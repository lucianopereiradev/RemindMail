import { Button } from "./components/ui/button.jsx";
import { ArrowLeft, Zap, Code, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Sobre({ goBack }) {
  return (
    <div className="min-h-screen text-white pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 pt-6">
          <Button onClick={goBack} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <ArrowLeft size={16} /> Voltar
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold">
            Sobre o <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">RemindMail</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Uma plataforma moderna e intuitiva para organizar seus compromissos
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 my-8">
          {[
            { icon: <Zap size={24} className="text-blue-400" />, title: "Rápido e Simples", text: "Interface intuitiva que permite criar lembretes em segundos, sem complicações." },
            { icon: <Target size={24} className="text-purple-400" />, title: "Organizado", text: "Centralize todos os seus compromissos em um só lugar e nunca mais esqueça nada." },
            { icon: <Code size={24} className="text-blue-300" />, title: "Tecnologia", text: "Desenvolvido com as melhores práticas de programação e arquitetura moderna." },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="flex items-center gap-3 mb-3">
                {item.icon}
                <h3 className="font-semibold text-lg">{item.title}</h3>
              </div>
              <p className="text-white/70">{item.text}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="font-bold text-xl sm:text-2xl mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              Organize seus compromissos
            </h2>
            <p className="text-white/80 leading-relaxed text-sm sm:text-base">
              O RemindMail é um site desenvolvido para ajudar pessoas a organizarem e acompanharem seus compromissos de forma simples e eficiente. A plataforma centraliza lembretes importantes em um só lugar, reduzindo esquecimentos e facilitando a rotina diária.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-purple-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="font-bold text-xl sm:text-2xl mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              Sobre o projeto
            </h2>
            <p className="text-white/80 leading-relaxed text-sm sm:text-base">
              Este projeto foi desenvolvido com o objetivo de aplicar conceitos fundamentais de desenvolvimento web e backend. O RemindMail integra lógica de programação, estruturação de dados e automação de processos, representando a consolidação do aprendizado na área de desenvolvimento de software.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
