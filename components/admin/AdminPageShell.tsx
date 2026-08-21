import Link from "next/link";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  children,
  action,
}: AdminPageShellProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--school-text)]">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">{description}</p>
          </div>
          {action ? (
            <Link
              href={action.href}
              className="w-fit rounded-xl px-4 py-2.5 text-sm font-bold theme-primary-bg"
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      </header>
      <section className="mt-6">{children}</section>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-8 text-center md:p-12">
      <div className="mx-auto h-2 w-16 rounded-full theme-primary-bg" />
      <h2 className="mt-5 text-xl font-bold text-[var(--school-text)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--school-muted)]">{description}</p>
      <p className="mt-5 text-xs font-semibold theme-primary">Ready for the verified data model.</p>
    </div>
  );
}

export function AdminInfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--school-muted)]">{label}</p>
      <p className="mt-2 text-lg font-bold text-[var(--school-text)]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--school-muted)]">{description}</p>
    </div>
  );
}
