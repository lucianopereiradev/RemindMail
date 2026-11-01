// Marca: um envelope cuja aba é o ponteiro de um relógio.
export function LogoMark({ className = "size-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1b2559" />
      <rect x="7" y="9.5" width="18" height="13" rx="2.5" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M7.8 11 16 17l8.2-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24.5" cy="9.5" r="3.5" fill="#5b7bff" stroke="#1b2559" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink ${className}`}>
      <LogoMark className="size-8" />
      RemindMail
    </span>
  );
}
