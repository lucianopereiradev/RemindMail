import { useEffect, useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "./ui.jsx";
import {
  NOTIFY_OPTIONS,
  RECURRENCE_OPTIONS,
  WEEKDAYS,
  formatDateTime,
  utcToWallTime,
  wallTimeToUtc,
} from "../lib/datetime.js";

export const EMPTY_REMINDER = {
  title: "",
  description: "",
  when: "",
  notify_before_minutes: 0,
  recurrence: "none",
  recurrence_days: [],
};

export function reminderToForm(r, tz) {
  return {
    title: r.title,
    description: r.description ?? "",
    when: utcToWallTime(r.remind_at, tz),
    notify_before_minutes: r.notify_before_minutes,
    recurrence: r.recurrence,
    recurrence_days: r.recurrence_days ?? [],
  };
}

function nextRoundHour(tz) {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return utcToWallTime(d, tz).slice(0, 14) + "00";
}

export function ReminderForm({ initial, editing, timezone, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial);
    setErrors({});
  }, [initial]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const remindAt = useMemo(() => wallTimeToUtc(form.when, timezone), [form.when, timezone]);
  const notifyAt = remindAt ? new Date(remindAt.getTime() - form.notify_before_minutes * 60000) : null;

  function toggleDay(day) {
    const days = form.recurrence_days.includes(day)
      ? form.recurrence_days.filter((d) => d !== day)
      : [...form.recurrence_days, day].sort((a, b) => a - b);
    set("recurrence_days", days);
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Dê um nome ao lembrete.";
    else if (form.title.trim().length > 120) next.title = "Use até 120 caracteres.";
    if (form.description.length > 1000) next.description = "Use até 1000 caracteres.";
    if (!remindAt) next.when = "Escolha a data e a hora.";
    else if (notifyAt.getTime() < Date.now() - 30000) next.when = "Esse horário já passou. Escolha uma data futura.";
    if (form.recurrence === "custom_weekly" && form.recurrence_days.length === 0)
      next.recurrence_days = "Escolha pelo menos um dia.";
    return next;
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      remind_at: remindAt.toISOString(),
      notify_before_minutes: Number(form.notify_before_minutes),
      recurrence: form.recurrence,
      recurrence_days: form.recurrence === "custom_weekly" ? form.recurrence_days : null,
    });
    if (ok && !editing) setForm(EMPTY_REMINDER);
  }

  const id = editing ? "edit" : "new";

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="O que você quer lembrar?" htmlFor={`${id}-title`} error={errors.title}>
        <Input
          id={`${id}-title`}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          invalid={!!errors.title}
          placeholder="Ex.: Reunião com o cliente"
          maxLength={120}
        />
      </Field>

      <Field label="Detalhes" htmlFor={`${id}-desc`} error={errors.description} optional>
        <Textarea
          id={`${id}-desc`}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          invalid={!!errors.description}
          placeholder="Ex.: Sala 3, levar o relatório"
          maxLength={1000}
          className="resize-y"
        />
      </Field>

      <Field label="Quando é?" htmlFor={`${id}-when`} error={errors.when}>
        <Input
          id={`${id}-when`}
          type="datetime-local"
          value={form.when}
          onFocus={() => {
            if (!form.when) set("when", nextRoundHour(timezone));
          }}
          onChange={(e) => set("when", e.target.value)}
          invalid={!!errors.when}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Avisar" htmlFor={`${id}-notify`}>
          <Select
            id={`${id}-notify`}
            value={form.notify_before_minutes}
            onChange={(e) => set("notify_before_minutes", Number(e.target.value))}
          >
            {NOTIFY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Repetir" htmlFor={`${id}-rec`}>
          <Select id={`${id}-rec`} value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)}>
            {RECURRENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {form.recurrence === "custom_weekly" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink">Em quais dias?</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => {
              const on = form.recurrence_days.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={on}
                  aria-label={d.long}
                  onClick={() => toggleDay(d.value)}
                  className={`h-9 min-w-11 rounded-full border px-2.5 text-sm font-semibold transition-colors ${
                    on ? "border-brand bg-brand text-white" : "border-line bg-card text-ink-soft hover:border-ink-faint"
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
          {errors.recurrence_days && (
            <p className="text-sm text-danger" role="alert">
              {errors.recurrence_days}
            </p>
          )}
        </fieldset>
      )}

      {notifyAt && !errors.when && (
        <p className="rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm text-ink">
          O e-mail chega em <strong>{formatDateTime(notifyAt, timezone)}</strong>.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1" loading={saving}>
          {editing ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {editing ? "Salvar alterações" : "Agendar lembrete"}
        </Button>
        {editing && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
