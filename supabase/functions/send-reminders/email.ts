// Templates dos e-mails do RemindMail.
// Todo texto vindo do usuário passa por escapeHtml (corrige injeção de HTML da versão antiga).

export interface ReminderEmailData {
  username: string;
  title: string;
  description: string | null;
  remindAt: Date;
  notifyBeforeMinutes: number;
  recurrence: string;
  recurrenceDays: number[] | null;
  nextAt: Date | null;
  timezone: string;
  appUrl: string;
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Todos os dias",
  weekly: "Toda semana",
  monthly: "Todo mês",
  yearly: "Todo ano",
};

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

export function recurrenceLabel(recurrence: string, days: number[] | null): string | null {
  if (recurrence === "none") return null;
  if (recurrence === "custom_weekly" && days?.length) {
    return "Toda " + days.map((d) => WEEKDAYS[d]).join(", ");
  }
  return RECURRENCE_LABELS[recurrence] ?? null;
}

export function antecedenceLabel(minutes: number): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} minutos`;
  if (minutes === 60) return "1 hora";
  if (minutes < 1440) return `${minutes / 60} horas`;
  return "1 dia";
}

function formatDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(date);
}

function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(date);
}

function formatShort(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}

function layout(preheader: string, content: string, appUrl: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RemindMail</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2937;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#4f46e5;padding:24px 32px;">
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">RemindMail</span>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #eef0f3;font-size:12px;line-height:1.6;color:#6b7280;">
Você recebeu este e-mail porque criou um lembrete no RemindMail.<br>
<a href="${appUrl}/painel/conta" style="color:#4f46e5;">Gerenciar ou pausar os e-mails</a> &middot; &copy; ${year} RemindMail
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildReminderEmail(d: ReminderEmailData) {
  const tz = d.timezone;
  const time = formatTime(d.remindAt, tz);
  const date = formatDate(d.remindAt, tz);
  const rec = recurrenceLabel(d.recurrence, d.recurrenceDays);
  const before = antecedenceLabel(d.notifyBeforeMinutes);
  const name = d.username?.trim() || "tudo bem";
  const greeting = d.username?.trim() ? `Olá, ${escapeHtml(name)}!` : "Olá!";
  const lead = before
    ? `Seu compromisso começa em <strong>${before}</strong>.`
    : "Chegou a hora do seu compromisso.";

  const content = `
<p style="margin:0 0 4px;font-size:18px;font-weight:600;">${greeting}</p>
<p style="margin:0 0 24px;font-size:15px;color:#4b5563;">${lead}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5ff;border-left:4px solid #4f46e5;border-radius:10px;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#3730a3;">${escapeHtml(d.title)}</p>
${d.description ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4b5563;">${nl2br(d.description)}</p>` : ""}
<p style="margin:0;font-size:14px;color:#374151;"><strong>${time}</strong> &middot; ${date}</p>
</td></tr>
</table>
${rec && d.nextAt ? `<p style="margin:16px 0 0;font-size:13px;color:#5b21b6;">Repete: ${escapeHtml(rec)}. Próxima vez: ${formatShort(d.nextAt, tz)}.</p>` : ""}
<p style="margin:28px 0 0;">
<a href="${d.appUrl}/painel" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:14px;">Ver meus lembretes</a>
</p>`;

  const textLines = [
    d.username?.trim() ? `Olá, ${name}!` : "Olá!",
    "",
    before ? `Seu compromisso começa em ${before}.` : "Chegou a hora do seu compromisso.",
    "",
    d.title,
    d.description ?? "",
    `${time} - ${date}`,
    rec && d.nextAt ? `Repete: ${rec}. Próxima vez: ${formatShort(d.nextAt, tz)}.` : "",
    "",
    `Ver meus lembretes: ${d.appUrl}/painel`,
    `Pausar os e-mails: ${d.appUrl}/painel/conta`,
  ];

  return {
    subject: before ? `Em ${before}: ${d.title}` : `Lembrete: ${d.title}`,
    html: layout(`${d.title} - ${time}`, content, d.appUrl),
    text: textLines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim(),
  };
}

export function buildTestEmail(appUrl: string) {
  const content = `
<p style="margin:0 0 12px;font-size:18px;font-weight:600;">Teste de envio</p>
<p style="margin:0;font-size:15px;color:#4b5563;">Se você está lendo isto, a integração do RemindMail com a Brevo está funcionando.</p>`;
  return {
    subject: "RemindMail: teste de envio",
    html: layout("A integração com a Brevo está funcionando.", content, appUrl),
    text: "Teste de envio: a integração do RemindMail com a Brevo está funcionando.",
  };
}
