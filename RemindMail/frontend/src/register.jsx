import API_URL from "./api.js";
import { useState } from "react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Bell, CheckCircle, Mail, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Register({ goLogin }) {
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!username.trim()) errs.username = "Nome é obrigatório.";
    if (!email.trim()) errs.email = "E-mail é obrigatório.";
    else if (!isValidEmail(email)) errs.email = "Digite um e-mail válido.";
    if (!password) errs.password = "Senha é obrigatória.";
    else if (password.length < 8) errs.password = "A senha deve ter no mínimo 8 caracteres.";
    return errs;
  }

  async function sendCode() {
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("verify");
      } else {
        setErrors({ email: data.error || "Erro ao enviar código." });
      }
    } catch {
      setErrors({ email: "Erro de conexão. Tente novamente." });
    }
    setLoading(false);
  }

  async function resendCode() {
    setResending(true);
    setCode("");
    try {
      const res = await fetch(`${API_URL}/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) setErrors({ code: data.error || "Erro ao reenviar." });
    } catch {
      setErrors({ code: "Erro de conexão." });
    }
    setResending(false);
  }

  async function register() {
    if (!code.trim()) return setErrors({ code: "Digite o código recebido." });
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, code }),
      });
      const data = await res.json();
      if (data.success) {
        goLogin();
      } else {
        setErrors({ code: data.error || "Erro ao criar conta." });
      }
    } catch {
      setErrors({ code: "Erro de conexão. Tente novamente." });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center max-w-5xl mx-auto mt-10 px-6 gap-12 pb-16">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white max-w-md space-y-4 text-center lg:text-left">
        <h1 className="text-3xl font-bold">Crie sua conta gratuita</h1>
        <p className="text-white/70">Em menos de 1 minuto você já pode receber lembretes automáticos no seu e-mail.</p>
        <div className="space-y-2 text-sm text-white/70">
          {["Sem cartão de crédito", "Plano gratuito para sempre", "E-mail verificado e seguro"].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" /> {t}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="bg-white shadow-2xl rounded-3xl">
          <CardContent className="p-8 space-y-4">

            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Bell size={20} className="text-blue-600" />
                    <h2 className="font-bold text-gray-800">Criar conta</h2>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Nome de usuário</label>
                    <Input
                      placeholder="Ex: João Silva"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: "" })); }}
                      className={errors.username ? "border-red-400" : ""}
                    />
                    {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">E-mail</label>
                    <Input
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                      className={errors.email ? "border-red-400" : ""}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Senha</label>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                      className={errors.password ? "border-red-400" : ""}
                    />
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    {password && !errors.password && (
                      <div className="flex gap-1 mt-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= 8 + i * 2
                              ? i < 2 ? "bg-yellow-400" : "bg-green-500"
                              : "bg-gray-200"
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={sendCode} disabled={loading} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                    {loading ? "Enviando código..." : "Continuar →"}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    Já tem uma conta?{" "}
                    <span onClick={goLogin} className="font-semibold text-blue-600 cursor-pointer hover:underline">Entrar</span>
                  </p>
                </motion.div>
              )}

              {step === "verify" && (
                <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Mail size={22} className="text-blue-600" />
                    </div>
                    <h2 className="font-bold text-gray-800">Verifique seu e-mail</h2>
                    <p className="text-xs text-gray-500">
                      Enviamos um código de 6 dígitos para<br />
                      <strong className="text-gray-700">{email}</strong>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Código de verificação</label>
                    <Input
                      placeholder="000000"
                      value={code}
                      onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors(p => ({ ...p, code: "" })); }}
                      className={`text-center text-2xl font-bold tracking-widest ${errors.code ? "border-red-400" : ""}`}
                      maxLength={6}
                    />
                    {errors.code && <p className="text-xs text-red-500 text-center">{errors.code}</p>}
                    <p className="text-xs text-gray-400 text-center">⏱ O código expira em 10 minutos</p>
                  </div>

                  <Button onClick={register} disabled={loading || code.length < 6} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                    {loading ? "Verificando..." : "Criar minha conta →"}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <button onClick={() => setStep("form")} className="hover:text-blue-600 transition">← Voltar</button>
                    <button onClick={resendCode} disabled={resending} className="flex items-center gap-1 hover:text-blue-600 transition">
                      <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                      {resending ? "Reenviando..." : "Reenviar código"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
