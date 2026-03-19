import API_URL from "./api.js";
import { useState } from "react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Bell, Mail, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Login({ onLogin, goRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) onLogin(data.token);
    else alert("E-mail ou senha incorretos.");
  }

  const features = [
    { icon: <Bell size={22} className="text-blue-300" />, title: "Lembretes inteligentes", desc: "Crie lembretes com título, descrição e horário. Receba tudo no seu e-mail na hora certa." },
    { icon: <RefreshCw size={22} className="text-purple-300" />, title: "Recorrência automática", desc: "Configure lembretes diários, semanais ou mensais e esqueça de vez o trabalho manual." },
    { icon: <Mail size={22} className="text-blue-200" />, title: "Notificação por e-mail", desc: "Sem app, sem notificação push. Só um e-mail certinho na hora que você precisar." },
    { icon: <CheckCircle size={22} className="text-green-300" />, title: "Simples de usar", desc: "Crie sua conta, adicione um lembrete e pronto. Sem curva de aprendizado." },
  ];

  return (
    <div className="w-full">
      {/* Hero + Login */}
      <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center max-w-6xl mx-auto mt-10 px-6 gap-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white max-w-xl space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80">
            <Clock size={14} /> Lembretes automáticos por e-mail
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-snug">
            Nunca mais esqueça um compromisso importante
          </h1>
          <p className="text-white/70 text-base sm:text-lg">
            O <strong className="text-white">RemindMail</strong> envia lembretes automáticos por e-mail no horário que você definir. Simples, direto e eficiente.
          </p>
          <Button onClick={goRegister} className="bg-white text-blue-700 hover:bg-white/90 rounded-full px-6 font-semibold text-base shadow-lg">
            Criar conta gratuita →
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="bg-white shadow-2xl rounded-3xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Bell size={20} className="text-blue-600" />
                <h2 className="font-bold text-gray-800">Entrar na sua conta</h2>
              </div>
              <Input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
              <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
              <Button onClick={login} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold">
                Entrar
              </Button>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">ou</span></div>
              </div>
              <Button onClick={goRegister} className="w-full rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold">
                Criar conta gratuita
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Features */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-6xl mx-auto px-6 mt-20 mb-12">
        <h2 className="text-white text-center text-2xl font-bold mb-8">Tudo que você precisa, sem complicação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white hover:bg-white/15 transition">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Como funciona */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="text-white text-center text-2xl font-bold mb-8">Como funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Crie sua conta", desc: "Cadastre-se gratuitamente com e-mail e senha." },
            { step: "2", title: "Adicione um lembrete", desc: "Defina o título, descrição e a data/hora do aviso." },
            { step: "3", title: "Receba no e-mail", desc: "Na hora certa, o RemindMail te avisa automaticamente." },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-6 text-white text-center hover:bg-white/15 transition">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg mx-auto mb-3">{s.step}</div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-white/60 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button onClick={goRegister} className="bg-white text-blue-700 hover:bg-white/90 rounded-full px-8 py-3 font-semibold text-base shadow-xl">
            Começar agora — é grátis
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
