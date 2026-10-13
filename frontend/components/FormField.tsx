type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[#bfd9d3] bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-[var(--lagoon)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]/40 ${className}`}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium">{children}</label>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-[var(--lagoon)] text-white hover:bg-[var(--deep)]",
  accent: "bg-[var(--mango)] text-[var(--ink)] hover:brightness-95",
  secondary:
    "bg-white text-[var(--ink)] border border-[#bfd9d3] hover:bg-[var(--seafoam)]",
  danger:
    "bg-white text-[var(--poppy)] border border-[#f3c4be] hover:bg-[#fdecea]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lagoon)] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}