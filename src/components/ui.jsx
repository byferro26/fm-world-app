import { X } from "lucide-react";

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-[var(--radius)] border bg-[var(--bg-panel)] border-[var(--line)] shadow-[var(--shadow)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "text-[var(--ink-soft)] border-[var(--line)] bg-[var(--bg-panel-alt)]",
    wine: "text-[var(--wine)] border-[var(--wine-soft)] bg-[color-mix(in_srgb,var(--wine)_10%,transparent)]",
    sage: "text-[var(--sage)] border-[var(--sage-soft)] bg-[color-mix(in_srgb,var(--sage)_12%,transparent)]",
    gold: "text-[var(--gold)] border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_12%,transparent)]",
    rust: "text-[var(--rust)] border-[var(--rust-soft)] bg-[color-mix(in_srgb,var(--rust)_12%,transparent)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }) {
  const variants = {
    primary:
      "bg-[var(--wine)] text-[var(--ink-on-dark,white)] hover:brightness-110 border-transparent",
    secondary:
      "bg-transparent text-[var(--ink)] border-[var(--line)] hover:bg-[var(--bg-panel-alt)]",
    ghost: "bg-transparent text-[var(--ink-soft)] border-transparent hover:bg-[var(--bg-panel-alt)]",
    danger: "bg-[var(--rust)] text-white border-transparent hover:brightness-110",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className = "", ...rest }) {
  return (
    <button
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full border border-transparent text-[var(--ink-soft)] hover:bg-[var(--bg-panel-alt)] transition ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-[var(--ink-soft)]">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--wine-soft)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wine)_20%,transparent)] transition";

export function Input(props) {
  return <input className={inputBase} {...props} />;
}
export function Textarea(props) {
  return <textarea className={`${inputBase} resize-y min-h-20`} {...props} />;
}
export function Select({ children, ...rest }) {
  return (
    <select className={inputBase} {...rest}>
      {children}
    </select>
  );
}

export function Modal({ title, onClose, children, footer, width = "max-w-lg" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 fm-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`w-full ${width} rounded-[var(--radius)] bg-[var(--bg-panel)] border border-[var(--line)] shadow-[var(--shadow)] max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="font-display text-lg text-[var(--ink)]">{title}</h2>
          <IconButton onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-[var(--bg-panel)] border-l border-[var(--line)] shadow-[var(--shadow)] fm-fade-in">
        <div className="sticky top-0 flex items-start justify-between border-b border-[var(--line)] bg-[var(--bg-panel)] px-5 py-4">
          <div>
            <h2 className="font-display text-lg text-[var(--ink)]">{title}</h2>
            {subtitle && <p className="text-xs text-[var(--ink-soft)] mt-0.5">{subtitle}</p>}
          </div>
          <IconButton onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[var(--ink-soft)]">
      {icon}
      <p className="font-medium text-[var(--ink)]">{title}</p>
      {hint && <p className="text-sm max-w-sm">{hint}</p>}
      {action}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--wine)] ${className}`}
    />
  );
}

export function KpiCard({ label, value, sub, tone = "wine", icon }) {
  const tones = {
    wine: "text-[var(--wine)]",
    sage: "text-[var(--sage)]",
    gold: "text-[var(--gold)]",
    rust: "text-[var(--rust)]",
  };
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
          {label}
        </span>
        <span className={tones[tone]}>{icon}</span>
      </div>
      <span className="font-display text-2xl text-[var(--ink)]">{value}</span>
      {sub && <span className="text-xs text-[var(--ink-soft)]">{sub}</span>}
    </Card>
  );
}
