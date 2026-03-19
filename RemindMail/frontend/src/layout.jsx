import { useState } from "react";
import ContactModal from "./ContactModal.jsx";
import { Menu, X, Bell } from "lucide-react";

export default function Layout({ children, onNavigate, screen }) {
  const [showContact, setShowContact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-blue-600 to-blue-800 relative overflow-x-hidden">
      <nav className="mx-4 sm:mx-6 mt-4 sm:mt-6 z-30 relative">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-white text-lg cursor-pointer" onClick={() => onNavigate?.("login")}>
            <Bell size={20} className="text-blue-300" />
            RemindMail
          </div>

          <div className="hidden sm:flex gap-6 text-sm font-medium text-white/80">
            <span onClick={() => onNavigate?.("sobre")} className="cursor-pointer hover:text-white transition">Sobre</span>
            <span onClick={() => setShowContact(true)} className="cursor-pointer hover:text-white transition">Contato</span>
            <span onClick={() => onNavigate?.("login")} className="cursor-pointer hover:text-white transition">Entrar</span>
            <span onClick={() => onNavigate?.("register")} className="cursor-pointer bg-white text-blue-700 hover:bg-white/90 transition px-4 py-1 rounded-full font-semibold">Cadastrar</span>
          </div>

          <button className="sm:hidden text-white p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mt-2 px-6 py-4 flex flex-col gap-4 text-sm font-medium text-white">
            <span onClick={() => { onNavigate?.("sobre"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition">Sobre</span>
            <span onClick={() => { setShowContact(true); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition">Contato</span>
            <span onClick={() => { onNavigate?.("login"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition">Entrar</span>
            <span onClick={() => { onNavigate?.("register"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-200 transition font-semibold">Cadastrar</span>
          </div>
        )}
      </nav>

      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      <main className="relative z-20">
        {children}
      </main>

      <footer className="text-center text-white/30 text-xs pb-6 mt-4">
        © {new Date().getFullYear()} RemindMail. Todos os direitos reservados.
      </footer>
    </div>
  );
}
