import { useState } from "react";
import ContactModal from "./ContactModal.jsx";
import { Menu, X } from "lucide-react";

export default function Layout({ children, onNavigate }) {
  const [showContact, setShowContact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 relative overflow-hidden">
      <nav className="bg-white rounded-full mx-4 sm:mx-6 mt-4 sm:mt-6 px-4 sm:px-6 py-3 flex justify-between items-center shadow-lg z-30 relative">
        <div className="font-semibold text-blue-600">RemindMail</div>

        <div className="hidden sm:flex gap-8 text-sm font-medium">
          <span onClick={() => onNavigate?.("sobre")} className="cursor-pointer hover:text-blue-600 transition">Sobre</span>
          <span onClick={() => setShowContact(true)} className="cursor-pointer hover:text-blue-600 transition">Fale conosco</span>
          <span onClick={() => onNavigate?.("login")} className="cursor-pointer hover:text-blue-600 transition">Login</span>
        </div>

        <button className="sm:hidden p-1" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="sm:hidden bg-white mx-4 mt-2 rounded-2xl shadow-lg z-30 relative px-6 py-4 flex flex-col gap-4 text-sm font-medium">
          <span onClick={() => { onNavigate?.("sobre"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-600 transition">Sobre</span>
          <span onClick={() => { setShowContact(true); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-600 transition">Fale conosco</span>
          <span onClick={() => { onNavigate?.("login"); setMenuOpen(false); }} className="cursor-pointer hover:text-blue-600 transition">Login</span>
        </div>
      )}

      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      <div className="absolute top-52 left-1/2 transform -translate-x-1/2 w-[520px] h-[520px] bg-white/8 rounded-full blur-4xl z-0 pointer-events-none" />

      <main className="relative z-20">
        {children}
      </main>
    </div>
  );
}
