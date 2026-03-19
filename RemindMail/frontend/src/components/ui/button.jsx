export function Button({ children, className = "", size, ...props }) {
  const base = "inline-flex items-center justify-center gap-1 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizing = size === "icon" ? "h-9 w-9 p-0 rounded-lg" : "px-4 py-2 rounded";
  const defaults = className.includes("bg-") ? "" : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button className={`${base} ${sizing} ${defaults} ${className}`} {...props}>
      {children}
    </button>
  );
}
