import { useEffect, useId, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonClass } from "../lib/buttonClass.js";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, htmlFor, optional }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-semibold text-ink">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-ink-faint">opcional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-xl border bg-card px-3.5 text-[15px] text-ink placeholder:text-ink-faint transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12 disabled:bg-paper";

export function Input({ invalid, className = "", ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${control} h-11 ${invalid ? "border-danger" : "border-line"} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ invalid, className = "", ...props }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`${control} py-2.5 leading-relaxed ${invalid ? "border-danger" : "border-line"} ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${control} h-11 cursor-pointer border-line pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-soft">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Spinner({ className = "" }) {
  return <LoaderCircle className={`animate-spin text-brand ${className}`} aria-label="Carregando" />;
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner className="size-7" />
    </div>
  );
}

export function Dialog({ open, onClose, title, children, actions }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl"
    >
      <div className="space-y-3 p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="text-[15px] leading-relaxed text-ink-soft">{children}</div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft bg-paper px-6 py-4">{actions}</div>
    </dialog>
  );
}
