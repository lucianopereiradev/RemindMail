import { useState } from "react";
import { Link } from "react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase.js";
import { friendlyError } from "../lib/errors.js";
import { AuthCard, useTitle } from "../components/layouts.jsx";
import { Button, Field, Input } from "../components/ui.jsx";
import { GoogleButton } from "../components/GoogleButton.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function strength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABEL = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];

export default function Register() {
  useTitle("Criar conta");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [resending, setResending] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "", general: "" }));
  };

  function validate() {
    const next = {};
    if (!form.username.trim()) next.username = "Diga como podemos te chamar.";
    else if (form.username.trim().length > 60) next.username = "Use até 60 caracteres.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Digite um e-mail válido.";
    if (form.password.length < 8) next.password = "A senha precisa ter pelo menos 8 caracteres.";
    return next;
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    const email = form.email.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: { username: form.username.trim() },
        emailRedirectTo: `${window.location.origin}/painel`,
      },
    });
    setLoading(false);

    if (error) {
      setErrors({ general: friendlyError(error) });
      return;
    }
    // Com confirmação de e-mail ativa, o Supabase não informa se o e-mail já existe
    // (proteção contra descoberta de contas). Em ambos os casos mostramos a mesma tela.
    if (data.session) return; // confirmação desativada: o AuthProvider já redireciona
    setSentTo(email);
  }

  async function resend() {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/painel` },
    });
    setResending(false);
    if (error) toast.error(friendlyError(error));
    else toast.success("Enviamos um novo link de confirmação.");
  }

  if (sentTo) {
    return (
      <AuthCard title="Confirme seu e-mail">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
          <MailCheck className="size-10 text-brand" aria-hidden="true" />
          <p>
            Enviamos um link de confirmação para <strong className="text-ink">{sentTo}</strong>. Abra o e-mail e clique
            no link para ativar a conta.
          </p>
          <p className="text-sm">Não chegou em alguns minutos? Confira a caixa de spam ou reenvie.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="secondary" onClick={resend} loading={resending}>
              Reenviar e-mail
            </Button>
            <Link to="/entrar" className="inline-flex h-11 items-center px-3 font-semibold text-brand hover:underline">
              Ir para o login
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  const score = strength(form.password);

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Grátis. Em um minuto você agenda o primeiro lembrete."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/entrar" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <GoogleButton label="Criar conta com Google" />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Como podemos te chamar?" htmlFor="username" error={errors.username}>
          <Input
            id="username"
            autoComplete="name"
            value={form.username}
            onChange={set("username")}
            invalid={!!errors.username}
            placeholder="Ex.: Ana Souza"
            maxLength={60}
          />
        </Field>
        <Field label="E-mail" htmlFor="email" error={errors.email} hint="É para este endereço que os lembretes serão enviados.">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            invalid={!!errors.email}
            placeholder="voce@exemplo.com"
          />
        </Field>
        <Field label="Senha" htmlFor="password" error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            invalid={!!errors.password}
            placeholder="Mínimo de 8 caracteres"
          />
          {form.password && !errors.password && (
            <div className="flex items-center gap-3 pt-1" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < score ? (score <= 1 ? "bg-danger" : score === 2 ? "bg-warn" : "bg-sent") : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-faint">{STRENGTH_LABEL[score]}</span>
            </div>
          )}
        </Field>
        {errors.general && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
            {errors.general}
          </p>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Criar conta
        </Button>
        <p className="text-center text-xs leading-relaxed text-ink-faint">
          Ao criar a conta você concorda com os{" "}
          <Link to="/termos" className="underline">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link to="/privacidade" className="underline">
            Política de privacidade
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
