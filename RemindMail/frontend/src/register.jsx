import API_URL from "./api.js";
import { useState } from "react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Bell, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Register({ goLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    if (!username || !email || !password) return alert("Preencha todos os campos.");
    setLoading(true);
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert("Conta criada com sucesso!");
      goLogin();
    } else {
      alert(data.error || "Erro ao criar conta. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center max-w-5xl mx-auto mt-10 px-6 gap-12 pb-16">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white max-w-md space-y-4 text-center lg:text-left">
        <h1 className="text-3xl font-bold">Crie sua conta gratuita</h1>
        <p className="text-white/70">
          Em menos de 1 minuto você já pode receber lembretes automáticos no seu e-mail.
        </p>
        <div className="space-y-2 text-sm text-white/70">
          {["Sem cartão de crédito", "Plano gratuito para sempre", "Cancele quando quiser"].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" /> {t}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="bg-white shadow-2xl rounded-3xl">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Bell size={20} className="text-blue-600" />
              <h2 className="font-bold text-gray-800">Criar conta</h2>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Nome de usuário</label>
              <Input placeholder="Ex: João Silva" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">E-mail</label>
              <Input placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Senha</label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <Button onClick={register} disabled={loading} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold">
              {loading ? "Criando conta..." : "Criar conta gratuita →"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Já tem uma conta?{" "}
              <span onClick={goLogin} className="font-semibold text-blue-600 cursor-pointer hover:underline">Entrar</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
