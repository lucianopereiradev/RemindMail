import { useState } from "react";
import ContactModal from "./ContactModal.jsx";
import { Menu, X, Bell, Github } from "lucide-react";

export default function Layout({ children, onNavigate, authenticated }) {
  const [showContact, setShowContact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-blue-600 to-blue-800 relative overflow-x-hidden">

      {/* Barra superior discreta */}
      <div className="hidden sm:flex justify-center items-center gap-6 bg-white/5 border-b border-white/10 py-2 px-6 text-xs text-white/50">
        <span>🚀 RemindMail — Lembretes automáticos por e-mail</span>
        <span className="text-white/20">•</span>
        <span>Gratuito · Sem cartão · Sem complicação</span>
        <span className="text-white/20">•</span>
        <a href="https://github.com/lucianopereiradev/RemindMail" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white/80 transition">
          <Github size={12} /> Ver no GitHub
        </a>
      </div>

      {/* Navbar principal */}
      <nav className="mx-4 sm:mx-6 mt-3 sm:mt-4 z-30 relative">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex justify-between items-center">
          <div
            className="flex items-center gap-2 font-bold text-white text-lg cursor-pointer select-none"
            onClick={() => onNavigate?.(authenticated ? "dashboard" : "login")}
          >
            <Bell size={20} className="text-blue-300" />
            RemindMail
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
            <span
              onClick={() => onNavigate?.("sobre")}
              className="text-white/70 hover:text-white cursor-pointer px-3 py-1.5 rounded-xl hover:bg-white/10 transition"
            >
              Sobre
            </span>
            <span
              onClick={() => setShowContact(true)}
              className="text-white/70 hover:text-white cursor-pointer px-3 py-1.5 rounded-xl hover:bg-white/10 transition"
            >
              Contato
            </span>

            {!authenticated && (
              <>
                <span
                  onClick={() => onNavigate?.("login")}
                  className="text-white/70 hover:text-white cursor-pointer px-3 py-1.5 rounded-xl hover:bg-white/10 transition"
                >
                  Entrar
                </span>
                <span
                  onClick={() => onNavigate?.("register")}
                  className="cursor-pointer bg-white text-blue-700 hover:bg-blue-50 transition px-4 py-1.5 rounded-full font-semibold text-sm shadow"
                >
                  Criar conta grátis
                </span>
              </>
            )}
          </div>

          <button className="sm:hidden text-white p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mt-2 px-5 py-4 flex flex-col gap-3 text-sm font-medium text-white">
            <span onClick={() => { onNavigate?.("sobre"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition py-1">Sobre</span>
            <span onClick={() => { setShowContact(true); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition py-1">Contato</span>
            {!authenticated && (
              <>
                <span onClick={() => { onNavigate?.("login"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition py-1">Entrar</span>
                <span onClick={() => { onNavigate?.("register"); setMenuOpen(false); }} className="cursor-pointer font-semibold text-blue-300 hover:text-blue-200 transition py-1">Criar conta grátis</span>
              </>
            )}
          </div>
        )}
      </nav>

      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      <main className="relative z-20">
        {children}
      </main>

      <footer className="text-center text-white/25 text-xs pb-6 mt-8 space-y-1">
        <p>© {new Date().getFullYear()} RemindMail · Feito com ☕ por Luciano Pereira</p>
      </footer>
    </div>
  );
}
