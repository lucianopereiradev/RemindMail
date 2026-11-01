import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { CalendarPlus, History, PauseCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase.js";
import { friendlyError } from "../lib/errors.js";
import { groupByDay } from "../lib/datetime.js";
import { useAuth } from "../auth/context.js";
import { useTitle } from "../lib/useTitle.js";
import { Button, Dialog, Input, Spinner } from "../components/ui.jsx";
import { ReminderForm } from "../components/ReminderForm.jsx";
import { EMPTY_REMINDER, reminderToForm } from "../lib/reminderForm.js";
import { ReminderItem } from "../components/ReminderItem.jsx";

const COLUMNS =
  "id, title, description, remind_at, notify_before_minutes, notify_at, recurrence, recurrence_days, status, attempts, last_sent_at, send_count, updated_at";

const fetchReminders = () => supabase.from("reminders").select(COLUMNS).order("remind_at", { ascending: true });

export default function Dashboard() {
  useTitle("Meus lembretes");
  const { profile, timezone } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef(null);

  const applyResult = useCallback(({ data, error }) => {
    if (error) {
      setLoadError(friendlyError(error, "Não foi possível carregar seus lembretes."));
    } else {
      setReminders(data);
      setLoadError("");
    }
    setLoading(false);
  }, []);

  const load = useCallback(() => fetchReminders().then(applyResult), [applyResult]);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      fetchReminders().then((result) => {
        if (active) applyResult(result);
      });
    refresh();
    // Atualiza quando a aba volta a ficar visível (ex.: depois de um envio)
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyResult]);

  const initialForm = useMemo(
    () => (editing ? reminderToForm(editing, timezone) : EMPTY_REMINDER),
    [editing, timezone],
  );

  const upcoming = useMemo(() => reminders.filter((r) => r.status === "scheduled"), [reminders]);
  const history = useMemo(
    () =>
      reminders
        .filter((r) => r.status !== "scheduled")
        .sort((a, b) => new Date(b.last_sent_at ?? b.updated_at) - new Date(a.last_sent_at ?? a.updated_at)),
    [reminders],
  );

  const visible = useMemo(() => {
    const list = tab === "upcoming" ? upcoming : history;
    const q = query.trim().toLocaleLowerCase("pt-BR");
    if (!q) return list;
    return list.filter((r) => `${r.title} ${r.description ?? ""}`.toLocaleLowerCase("pt-BR").includes(q));
  }, [tab, upcoming, history, query]);

  const groups = useMemo(
    () => groupByDay(visible, (r) => (tab === "upcoming" ? r.remind_at : r.last_sent_at ?? r.updated_at), timezone),
    [visible, tab, timezone],
  );

  async function save(values) {
    setSaving(true);
    const request = editing
      ? supabase.from("reminders").update(values).eq("id", editing.id).select(COLUMNS).single()
      : supabase.from("reminders").insert(values).select(COLUMNS).single();
    const { data, error } = await request;
    setSaving(false);
    if (error) {
      toast.error(friendlyError(error, "Não foi possível salvar o lembrete."));
      return false;
    }
    setReminders((list) => {
      const rest = list.filter((r) => r.id !== data.id);
      return [...rest, data].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at));
    });
    toast.success(editing ? "Lembrete atualizado." : "Lembrete agendado.");
    setEditing(null);
    setTab("upcoming");
    return true;
  }

  function startEdit(r) {
    setEditing(r);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    });
  }

  async function confirmDelete() {
    setDeleting(true);
    const { error } = await supabase.from("reminders").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error(friendlyError(error, "Não foi possível excluir."));
      return;
    }
    setReminders((list) => list.filter((r) => r.id !== toDelete.id));
    if (editing?.id === toDelete.id) setEditing(null);
    toast.success("Lembrete excluído.");
    setToDelete(null);
  }

  const firstName = profile?.username?.split(" ")[0];
  const tabClass = (active) =>
    `inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
      active ? "bg-ink text-white" : "text-ink-soft hover:bg-line-soft hover:text-ink"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">{firstName ? `Olá, ${firstName}` : "Seus lembretes"}</h1>
        <p className="mt-1 text-ink-soft">
          {upcoming.length === 0
            ? "Nenhum lembrete agendado."
            : upcoming.length === 1
              ? "1 lembrete agendado."
              : `${upcoming.length} lembretes agendados.`}
        </p>
      </div>

      {profile && !profile.email_notifications && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <PauseCircle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
            Os e-mails estão pausados. Lembretes que vencerem agora serão pulados.
          </p>
          <Link to="/painel/conta" className="shrink-0 font-semibold text-warn underline">
            Retomar e-mails
          </Link>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section
          ref={formRef}
          aria-labelledby="form-title"
          className="scroll-mt-24 rounded-3xl border border-line bg-card p-5 sm:p-6 lg:sticky lg:top-24"
        >
          <h2 id="form-title" className="mb-5 text-xl font-bold">
            {editing ? "Editar lembrete" : "Novo lembrete"}
          </h2>
          <ReminderForm
            key={editing?.id ?? "novo"}
            initial={initialForm}
            editing={!!editing}
            timezone={timezone}
            saving={saving}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </section>

        <section aria-label="Lista de lembretes">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-full border border-line bg-card p-1" role="tablist">
              <button
                role="tab"
                aria-selected={tab === "upcoming"}
                className={tabClass(tab === "upcoming")}
                onClick={() => setTab("upcoming")}
              >
                Próximos
                <span className="tabular-nums opacity-70">{upcoming.length}</span>
              </button>
              <button
                role="tab"
                aria-selected={tab === "history"}
                className={tabClass(tab === "history")}
                onClick={() => setTab("history")}
              >
                Histórico
                <span className="tabular-nums opacity-70">{history.length}</span>
              </button>
            </div>
            <label className="relative block sm:w-64">
              <span className="sr-only">Buscar lembretes</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar"
                className="h-10 pl-10"
              />
            </label>
          </div>

          {loading ? (
            <div className="grid place-items-center py-20">
              <Spinner className="size-6" />
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-danger/30 bg-danger-soft p-6 text-sm text-danger">
              <p>{loadError}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={load}>
                Tentar de novo
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <EmptyState tab={tab} searching={!!query.trim()} />
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group.key}>
                  <h3 className="mb-3 font-sans text-sm font-bold tracking-normal text-ink-soft">{group.label}</h3>
                  <ul className="space-y-3">
                    {group.items.map((r) => (
                      <ReminderItem
                        key={r.id}
                        reminder={r}
                        timezone={timezone}
                        highlight={editing?.id === r.id}
                        history={tab === "history"}
                        onEdit={startEdit}
                        onDelete={setToDelete}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Excluir lembrete?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              Excluir
            </Button>
          </>
        }
      >
        {toDelete && (
          <p>
            <strong className="text-ink">{toDelete.title}</strong> será excluído
            {toDelete.recurrence !== "none" ? " e as próximas repetições não serão enviadas" : ""}.
          </p>
        )}
      </Dialog>
    </div>
  );
}

function EmptyState({ tab, searching }) {
  if (searching) {
    return <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-ink-soft">Nada encontrado com esse termo.</p>;
  }
  const Icon = tab === "upcoming" ? CalendarPlus : History;
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <Icon className="mx-auto size-9 text-ink-faint" aria-hidden="true" />
      <p className="mt-3 font-semibold text-ink">
        {tab === "upcoming" ? "Nenhum lembrete agendado" : "Nada enviado ainda"}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {tab === "upcoming"
          ? "Use o formulário para agendar o primeiro."
          : "Os lembretes enviados aparecem aqui."}
      </p>
    </div>
  );
}
