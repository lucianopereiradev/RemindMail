import { useState } from "react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function Register({ goLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  async function register() {
    const res = await fetch("http://localhost:3001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Conta criada!");
      goLogin();
    } else {
      alert("Erro ao cadastrar");
    }
  }

  return (
    <div className="flex justify-center mt-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-[520px] bg-white shadow-2xl rounded-3xl">
          <CardContent className="p-10 space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Bell size={20} />
              <h2 className="font-semibold">Crie uma conta</h2>
            </div>

            <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />

            <Button onClick={register} className="w-full rounded-full">
              Criar
            </Button>

            <p className="text-xs text-center">
              Já possui uma conta?{" "}
              <span onClick={goLogin} className="font-semibold cursor-pointer">
                Login
              </span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}