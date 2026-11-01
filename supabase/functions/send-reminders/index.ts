// Edge Function: envia os lembretes vencidos.
// Chamada pelo pg_cron (private.dispatch_due_reminders) somente quando há algo para enviar.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildReminderEmail, buildTestEmail } from "./email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") ?? "lucianopereiradejesus14@gmail.com";
const SENDER_NAME = Deno.env.get("SENDER_NAME") ?? "RemindMail";
const APP_URL = (Deno.env.get("APP_URL") ?? "https://remindmail.pages.dev").replace(/\/$/, "");

const BATCH_SIZE = 25;
const CONCURRENCY = 5;
const TIME_BUDGET_MS = 45_000;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface DueReminder {
  id: number;
  title: string;
  description: string | null;
  remind_at: string;
  notify_before_minutes: number;
  recurrence: string;
  recurrence_days: number[] | null;
  email: string;
  username: string;
  timezone: string;
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json() as Promise<{ messageId?: string }>;
}

// Próxima ocorrência estimada, só para exibir no e-mail (a fonte da verdade é o banco)
function estimateNext(r: DueReminder): Date | null {
  const d = new Date(r.remind_at);
  switch (r.recurrence) {
    case "daily":
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "monthly":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "yearly":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    case "custom_weekly": {
      if (!r.recurrence_days?.length) return null;
      const local = new Date(d.toLocaleString("en-US", { timeZone: r.timezone }));
      for (let i = 1; i <= 7; i++) {
        const candidate = new Date(local);
        candidate.setDate(local.getDate() + i);
        if (r.recurrence_days.includes(candidate.getDay())) {
          d.setUTCDate(d.getUTCDate() + i);
          break;
        }
      }
      break;
    }
    default:
      return null;
  }
  return d;
}

async function processReminder(r: DueReminder) {
  try {
    const email = buildReminderEmail({
      username: r.username,
      title: r.title,
      description: r.description,
      remindAt: new Date(r.remind_at),
      notifyBeforeMinutes: r.notify_before_minutes,
      recurrence: r.recurrence,
      recurrenceDays: r.recurrence_days,
      nextAt: estimateNext(r),
      timezone: r.timezone || "America/Sao_Paulo",
      appUrl: APP_URL,
    });
    await sendEmail(r.email, email.subject, email.html, email.text);
    const { error } = await supabase.rpc("complete_reminder", { p_id: r.id, p_result: "sent" });
    if (error) console.error(`complete_reminder(${r.id}) falhou:`, error.message);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Lembrete ${r.id} falhou:`, message);
    await supabase.rpc("complete_reminder", { p_id: r.id, p_result: "failed", p_error: message });
    return false;
  }
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<boolean>) {
  let sent = 0;
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      if (await worker(item)) sent++;
    }
  });
  await Promise.all(runners);
  return sent;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const secret = req.headers.get("x-cron-secret") ?? "";
  const { data: valid, error: verifyError } = await supabase.rpc("verify_cron_secret", { p_secret: secret });
  if (verifyError || valid !== true) return json({ error: "Não autorizado" }, 401);

  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY não configurada");
    return json({ error: "BREVO_API_KEY não configurada" }, 500);
  }

  const body = await req.json().catch(() => ({}));

  // Modo de teste: { "test_to": "email@exemplo.com" }
  if (typeof body?.test_to === "string" && body.test_to.includes("@")) {
    try {
      const email = buildTestEmail(APP_URL);
      const result = await sendEmail(body.test_to, email.subject, email.html, email.text);
      return json({ ok: true, test: true, messageId: result.messageId ?? null });
    } catch (err) {
      return json({ ok: false, test: true, error: err instanceof Error ? err.message : String(err) }, 502);
    }
  }

  const started = Date.now();
  let processed = 0;
  let sent = 0;

  while (Date.now() - started < TIME_BUDGET_MS) {
    const { data, error } = await supabase.rpc("claim_due_reminders", { p_limit: BATCH_SIZE });
    if (error) {
      console.error("claim_due_reminders falhou:", error.message);
      return json({ ok: false, error: error.message }, 500);
    }
    const batch = (data ?? []) as DueReminder[];
    if (batch.length === 0) break;
    processed += batch.length;
    sent += await runPool(batch, CONCURRENCY, processReminder);
    if (batch.length < BATCH_SIZE) break;
  }

  console.log(`RemindMail: ${sent}/${processed} enviados`);
  return json({ ok: true, processed, sent });
});
