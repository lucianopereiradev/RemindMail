import { useMemo, useState } from "react";
import { Mail } from "lucide-react";

// O elemento central da página inicial: o visitante escreve um lembrete
// e vê como ele chega na caixa de entrada.
const PRESETS = [
  { title: "Pagar o boleto da internet", time: "09:00" },
  { title: "Consulta no dentista", time: "14:30" },
  { title: "Futebol com a turma", time: "18:00" },
];

export function InboxPreview() {
  const [title, setTitle] = useState("Consulta no dentista");
  const [time, setTime] = useState("14:30");
  const [version, setVersion] = useState(0);

  const subject = title.trim() ? `Lembrete: ${title.trim()}` : "Lembrete: seu compromisso";
  const others = useMemo(
    () => [
      { from: "Banco", subject: "Sua fatura fechou", when: "08:12" },
      { from: "Loja Online", subject: "Seu pedido saiu para entrega", when: "Ontem" },
    ],
    [],
  );

  function apply(next) {
    if (next.title !== undefined) setTitle(next.title);
    if (next.time !== undefined) setTime(next.time);
    setVersion((v) => v + 1);
  }

  return (
    <div className="relative">
      <div className="rounded-3xl border border-line bg-card p-5 shadow-2xl shadow-ink/10 sm:p-6">
        <p className="text-sm font-semibold text-ink">Experimente</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_7.5rem]">
          <label className="block">
            <span className="sr-only">O que você quer lembrar?</span>
            <input
              value={title}
              maxLength={60}
              onChange={(e) => apply({ title: e.target.value })}
              placeholder="O que você quer lembrar?"
              className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] focus:border-brand focus:bg-card focus:outline-none focus:ring-4 focus:ring-brand/12"
            />
          </label>
          <label className="block">
            <span className="sr-only">Horário</span>
            <input
              type="time"
              value={time}
              onChange={(e) => apply({ time: e.target.value })}
              className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-[15px] focus:border-brand focus:bg-card focus:outline-none focus:ring-4 focus:ring-brand/12"
            />
          </label>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => apply(p)}
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-line">
          <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2.5 text-xs font-semibold text-ink-soft">
            <Mail className="size-3.5" aria-hidden="true" />
            Caixa de entrada
          </div>
          <ul aria-live="polite">
            <li key={version} className="animate-arrive flex gap-3 border-b border-line-soft bg-brand-soft/60 px-4 py-3.5">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Não lido" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold text-ink">RemindMail</span>
                  <span className="shrink-0 text-xs font-bold text-brand">{time || "agora"}</span>
                </div>
                <p className="truncate text-sm font-semibold text-ink">{subject}</p>
                <p className="truncate text-sm text-ink-faint">Olá! Chegou a hora do seu compromisso.</p>
              </div>
            </li>
            {others.map((m) => (
              <li key={m.subject} className="flex gap-3 border-b border-line-soft px-4 py-3.5 last:border-0">
                <span className="mt-1.5 size-2 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-ink-soft">{m.from}</span>
                    <span className="shrink-0 text-xs text-ink-faint">{m.when}</span>
                  </div>
                  <p className="truncate text-sm text-ink-faint">{m.subject}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
