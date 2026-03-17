import { useState } from "react";
import ContactModal from "./ContactModal.jsx";

export default function Layout({ children, onNavigate }) {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 relative overflow-hidden">
      <nav className="bg-white rounded-full mx-6 mt-6 px-6 py-3 flex justify-between items-center shadow-lg z-30 relative">
        <div className="font-semibold text-blue-600">RemindMail</div>
        <div className="flex gap-8 text-sm font-medium">
          <span onClick={() => onNavigate?.("sobre")} className="cursor-pointer hover:text-blue-600 transition">Sobre</span>
          <span onClick={() => setShowContact(true)} className="cursor-pointer hover:text-blue-600 transition">Fale conosco</span>
          <span onClick={() => onNavigate?.("login")} className="cursor-pointer hover:text-blue-600 transition">Login</span>
        </div>
      </nav>

      {/* Contact Modal */}
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* subtle decorative blurred circle placed lower and dimmer */}
      <div className="absolute top-52 left-1/2 transform -translate-x-1/2 w-[520px] h-[520px] bg-white/8 rounded-full blur-4xl z-0 pointer-events-none" />

      <main className="relative z-20">
        {children}
      </main>
    </div>
  );
}