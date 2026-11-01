import { AlertTriangle, BellRing, CheckCircle2, PauseCircle, Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "./ui.jsx";
import { formatDateTime, formatTime, notifyLabel, recurrenceLabel } from "../lib/datetime.js";

function Tag({ icon: Icon, children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-line-soft text-ink-soft",
    brand: "bg-brand-soft text-brand-dark",
    sent: "bg-sent-soft text-sent",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

export function ReminderItem({ reminder: r, timezone, onEdit, onDelete, highlight, history }) {
  const rec = recurrenceLabel(r.recurrence, r.recurrence_days);
  const before = notifyLabel(r.notify_before_minutes);

  return (
    <li
      className={`group flex gap-4 rounded-2xl border bg-card p-4 transition-colors sm:p-5 ${
        highlight ? "border-brand ring-4 ring-brand/10" : "border-line hover:border-ink-faint/50"
      }`}
    >
      <div className="w-14 shrink-0 pt-0.5 sm:w-16">
        <span className="font-display text-xl font-bold tabular-nums text-ink sm:text-2xl">
          {formatTime(r.remind_at, timezone)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="break-words font-sans text-base font-bold leading-snug tracking-normal">{r.title}</h3>
        {r.description && (
          <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-ink-soft">
            {r.description}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {r.status === "sent" && (
            <Tag icon={CheckCircle2} tone="sent">
              Enviado em {formatDateTime(r.last_sent_at ?? r.updated_at, timezone)}
            </Tag>
          )}
          {r.status === "failed" && (
            <Tag icon={AlertTriangle} tone="danger">
              Não foi possível enviar
            </Tag>
          )}
          {r.status === "skipped" && (
            <Tag icon={PauseCircle} tone="warn">
              Pulado: e-mails pausados
            </Tag>
          )}
          {r.status === "scheduled" && r.attempts > 0 && (
            <Tag icon={AlertTriangle} tone="warn">
              Tentando enviar de novo
            </Tag>
          )}
          {rec && (
            <Tag icon={Repeat} tone="brand">
              {rec}
            </Tag>
          )}
          {before && !history && <Tag icon={BellRing}>Avisa {before}</Tag>}
          {r.recurrence !== "none" && r.send_count > 0 && !history && (
            <Tag icon={CheckCircle2}>
              {r.send_count === 1 ? "Enviado 1 vez" : `Enviado ${r.send_count} vezes`}
            </Tag>
          )}
        </div>
        {r.status === "failed" && (
          <p className="mt-2 text-sm text-ink-soft">Edite o lembrete com uma nova data para tentar outra vez.</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
        <Button variant="ghost" size="icon" onClick={() => onEdit(r)} aria-label={`Editar "${r.title}"`} title="Editar">
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(r)}
          aria-label={`Excluir "${r.title}"`}
          title="Excluir"
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
