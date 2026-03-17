import { useState } from "react";
import { X, Mail, Copy, Check } from "lucide-react";
import { Button } from "./components/ui/button.jsx";
import { motion } from "framer-motion";

export default function ContactModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const email = "lucianopereiradejesus14@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-lg border border-blue-400/30 rounded-3xl p-8 shadow-2xl text-white max-w-md w-full mx-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500/30 rounded-full p-3">
            <Mail size={24} className="text-blue-300" />
          </div>
          <h2 className="text-2xl font-bold">Fale Conosco</h2>
        </div>

        {/* Description */}
        <p className="text-white/70 mb-6">
          Entre em contato através do email abaixo. Responderemos em breve!
        </p>

        {/* Email Display */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-white/60 mb-2">Email de contato</p>
          <p className="text-lg font-semibold break-all">{email}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleEmailClick}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full gap-2 py-2.5 font-semibold transition-all"
          >
            <Mail size={16} /> Enviar Email
          </Button>

          <Button
            onClick={handleCopy}
            className={`w-full rounded-full gap-2 py-2.5 font-semibold transition-all ${
              copied
                ? "bg-green-600 hover:bg-green-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} /> Copiado!
              </>
            ) : (
              <>
                <Copy size={16} /> Copiar Email
              </>
            )}
          </Button>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-white/50 text-center mt-6">
          Você será redirecionado para seu cliente de email padrão
        </p>
      </motion.div>
    </motion.div>
  );
}