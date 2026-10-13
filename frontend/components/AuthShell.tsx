export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="max-w-4xl">
      <div className="grid overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        <div
          className="hidden flex-col justify-end p-10 text-white md:flex"
          style={{
            background:
              "linear-gradient(160deg, #117a8b 0%, #0a4552 60%, #0b2e3a 100%)",
          }}
        >
          <p className="font-display text-4xl font-bold leading-tight">
            Tell us where you want to go.
          </p>
          <p className="mt-3 text-white/80">
            We turn it into a day-by-day plan with real places and the weather
            forecast.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-slate-500">{subtitle}</p>
          {children}
          <div className="mt-6 text-sm text-slate-500">{footer}</div>
        </div>
      </div>
    </main>
  );
}