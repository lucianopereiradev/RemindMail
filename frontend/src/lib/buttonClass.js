const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/20",
  secondary: "bg-card text-ink border border-line hover:border-ink-faint hover:bg-paper",
  ghost: "text-ink-soft hover:text-ink hover:bg-line-soft",
  danger: "bg-danger text-white hover:brightness-95",
  "danger-outline": "text-danger border border-danger/30 hover:bg-danger-soft",
};

const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 justify-center",
};

// Mesmo visual para <button> e para <Link> com cara de botão
export function buttonClass(variant = "primary", size = "md", extra = "") {
  return `inline-flex items-center justify-center rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${extra}`;
}
