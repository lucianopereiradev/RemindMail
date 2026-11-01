import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { supabase } from "../lib/supabase.js";
import { friendlyError } from "../lib/errors.js";
import { browserTimezone, formatTime, listTimezones } from "../lib/datetime.js";
import { useAuth } from "../auth/context.js";
import { useTitle } from "../lib/useTitle.js";
import { Button, Dialog, Field, Input, Select, Spinner, Toggle } from "../components/ui.jsx";

function Section({ title, description, children, tone }) {
  return (
    <section className="grid gap-5 border-b border-line py-8 last:border-0 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className={`font-sans text-lg font-bold tracking-normal ${tone === "danger" ? "text-danger" : ""}`}>{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p>}
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

function ProfileForm({ profile, onSave }) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [saving, setSaving] = useState(false);

  const zones = useMemo(() => {
    const all = listTimezones();
    return all.includes(profile.timezone) ? all : [profile.timezone, ...all];
  }, [profile.timezone]);
  const detected = browserTimezone();
  const changed = username.trim() !== (profile.username ?? "") || timezone !== profile.timezone;

  async function submit(e) {
    e.preventDefault();
    if (username.trim().length > 60) return toast.error("Use até 60 caracteres no nome.");
    setSaving(true);
    try {
      await onSave({ username: username.trim(), timezone });
      toast.success("Perfil salvo.");
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível salvar o perfil."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome" htmlFor="username">
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={60} />
      </Field>
      <Field
        label="Fuso horário"
        htmlFor="timezone"
        hint={`Agora são ${formatTime(new Date(), timezone)} neste fuso. Os horários dos lembretes seguem esta escolha.`}
      >
        <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        {detected !== timezone && (
          <button
            type="button"
            onClick={() => setTimezone(detected)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Usar o fuso deste dispositivo ({detected.replaceAll("_", " ")})
          </button>
        )}
      </Field>
      <Button type="submit" loading={saving} disabled={!changed}>
        Salvar perfil
      </Button>
    </form>
  );
}

export default function Account() {
  useTitle("Conta");
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();
  const [savingToggle, setSavingToggle] = useState(false);
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const usesPassword = user?.app_metadata?.providers?.includes("email") ?? true;

  if (!profile) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="size-6" />
      </div>
    );
  }

  async function toggleEmails(value) {
    setSavingToggle(true);
    try {
      await updateProfile({ email_notifications: value });
      toast.success(value ? "E-mails retomados." : "E-mails pausados.");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSavingToggle(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (password.length < 8) return toast.error("A senha precisa ter pelo menos 8 caracteres.");
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) return toast.error(friendlyError(error));
    setPassword("");
    toast.success("Senha alterada.");
  }

  async function deleteAccount() {
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setDeleting(false);
      return toast.error(friendlyError(error, "Não foi possível excluir a conta."));
    }
    await supabase.auth.signOut();
    toast.success("Sua conta foi excluída.");
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Conta</h1>
      <p className="mt-1 text-ink-soft">{user?.email}</p>

      <div className="mt-4">
        <Section title="Perfil" description="Seu nome aparece na saudação dos e-mails.">
          <ProfileForm key={profile.id} profile={profile} onSave={updateProfile} />
        </Section>

        <Section title="E-mails" description="Pause os envios sem apagar nenhum lembrete.">
          <Toggle
            checked={profile.email_notifications}
            onChange={toggleEmails}
            disabled={savingToggle}
            label="Receber e-mails de lembrete"
            description={
              profile.email_notifications
                ? "Ativo. Os lembretes chegam no horário marcado."
                : "Pausado. Lembretes que vencerem serão pulados; os que repetem seguem para a próxima data."
            }
          />
        </Section>

        {usesPassword && (
          <Section title="Senha" description="Use pelo menos 8 caracteres.">
            <form onSubmit={changePassword} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Nova senha" htmlFor="new-password">
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" variant="secondary" loading={savingPassword} disabled={!password}>
                Alterar senha
              </Button>
            </form>
          </Section>
        )}

        <Section title="Sessão">
          <Button variant="secondary" onClick={signOut}>
            Sair desta conta
          </Button>
        </Section>

        <Section title="Excluir conta" tone="danger" description="Apaga sua conta e todos os lembretes. Não dá para desfazer.">
          <Button variant="danger-outline" onClick={() => setDeleteOpen(true)}>
            Excluir minha conta
          </Button>
        </Section>
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
        }}
        title="Excluir sua conta?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={deleteAccount}
              loading={deleting}
              disabled={confirmText.trim().toLowerCase() !== "excluir"}
            >
              Excluir conta
            </Button>
          </>
        }
      >
        <p>Todos os seus lembretes serão apagados e nenhum e-mail será enviado. Para confirmar, digite excluir.</p>
        <Input
          className="mt-3"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          aria-label="Digite excluir para confirmar"
          autoComplete="off"
        />
      </Dialog>
    </div>
  );
}
