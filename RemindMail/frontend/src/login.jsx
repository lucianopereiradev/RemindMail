import API_URL from "./api.js";
import { useState } from "react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Bell } from "lucide-react";
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
    else alert("Credenciais inválidas");
  }

  return (
    <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center max-w-6xl mx-auto mt-10 px-6 gap-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white max-w-lg space-y-4 text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug">
          Transformando compromissos em notificações automáticas
        </h1>
        <p className="text-white/80">
          Unindo organização, tecnologia e praticidade em um único sistema.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="bg-white shadow-2xl rounded-3xl">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Bell size={20} />
              <h2 className="font-semibold">Acesse sua conta</h2>
            </div>

            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />

            <Button onClick={login} className="w-full rounded-full">Logar</Button>

            <p className="text-xs text-center">
              Não possui uma conta?{" "}
              <span onClick={goRegister} className="font-semibold cursor-pointer">Cadastrar-se</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
