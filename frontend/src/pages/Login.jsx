import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { supabase } from "../lib/supabase.js";
import { friendlyError } from "../lib/errors.js";
import { AuthCard, useTitle } from "../components/layouts.jsx";
import { Button, Field, Input } from "../components/ui.jsx";
import { GoogleButton } from "../components/GoogleButton.jsx";

export default function Login() {
  useTitle("Entrar");
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setUnconfirmed(false);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setUnconfirmed(/email not confirmed/i.test(err.message));
      setError(friendlyError(err));
      return;
    }
    navigate(location.state?.from ?? "/painel", { replace: true });
  }

  async function resend() {
    setResending(true);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/painel` },
    });
    setResending(false);
    if (err) toast.error(friendlyError(err));
    else toast.success("Enviamos um novo link de confirmação.");
  }

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse seus lembretes."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-brand hover:underline">
            Criar conta grátis
          </Link>
        </>
      }
    >
      <GoogleButton />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="E-mail" htmlFor="email">
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
        <Field label="Senha" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="-mt-1 text-right">
          <Link to="/recuperar-senha" className="text-sm font-semibold text-brand hover:underline">
            Esqueci a senha
          </Link>
        </div>
        {error && (
          <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
            {error}
            {unconfirmed && (
              <button type="button" onClick={resend} disabled={resending} className="mt-1 block font-semibold underline">
                {resending ? "Reenviando..." : "Reenviar o e-mail de confirmação"}
              </button>
            )}
          </div>
        )}
        <Button type="submit" className="w-full" loading={loading} disabled={!email || !password}>
          Entrar
        </Button>
      </form>
    </AuthCard>
  );
}
