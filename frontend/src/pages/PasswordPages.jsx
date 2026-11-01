import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase.js";
import { friendlyError } from "../lib/errors.js";
import { AuthCard } from "../components/layouts.jsx";
import { useTitle } from "../lib/useTitle.js";
import { Button, Field, FullPageSpinner, Input } from "../components/ui.jsx";
import { useAuth } from "../auth/context.js";

export function ForgotPassword() {
  useTitle("Recuperar senha");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (err) setError(friendlyError(err));
    else setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title="Confira seu e-mail">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
          <MailCheck className="size-10 text-brand" aria-hidden="true" />
          <p>
            Se existir uma conta com <strong className="text-ink">{email.trim()}</strong>, você vai receber um link para
            criar uma nova senha.
          </p>
          <Link to="/entrar" className="inline-block font-semibold text-brand hover:underline">
            Voltar para o login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma senha nova."
      footer={
        <Link to="/entrar" className="font-semibold text-brand hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail" htmlFor="email" error={error}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </Field>
        <Button type="submit" className="w-full" loading={loading} disabled={!email.includes("@")}>
          Enviar link
        </Button>
      </form>
    </AuthCard>
  );
}

export function ResetPassword() {
  useTitle("Nova senha");
  const navigate = useNavigate();
  const { user, loading: authLoading, setRecovering } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return <FullPageSpinner />;

  if (!user) {
    return (
      <AuthCard title="Link expirado" subtitle="Este link de recuperação não é mais válido. Peça um novo.">
        <Link to="/recuperar-senha" className="font-semibold text-brand hover:underline">
          Pedir novo link
        </Link>
      </AuthCard>
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não são iguais.");
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(friendlyError(err));
    setRecovering(false);
    toast.success("Senha alterada.");
    navigate("/painel", { replace: true });
  }

  return (
    <AuthCard title="Crie uma nova senha" subtitle={`Para a conta ${user.email}.`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nova senha" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo de 8 caracteres"
          />
        </Field>
        <Field label="Repita a nova senha" htmlFor="confirm" error={error}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            invalid={!!error}
          />
        </Field>
        <Button type="submit" className="w-full" loading={loading}>
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  );
}
