import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

const cards = [
  { title: "Students", description: "Student records and registration", status: "Coming next" },
  { title: "Accounts", description: "Income, expense, fees and payroll", status: "Planned" },
  { title: "Inventory", description: "Stock, handover and takeover", status: "Planned" },
  { title: "Management", description: "Academic and financial overview", status: "Planned" },
];

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Administration</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--school-text)]">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-[var(--school-muted)]">Welcome back, {profile.full_name || profile.email}.</p>
          </div>
          <span className="w-fit rounded-full px-4 py-2 text-xs font-bold capitalize theme-primary-bg">{profile.role.name.replace(/_/g, " ")}</span>
        </div>
      </header>

      <section className="mt-6 grid gap-5 md:grid-cols-2" aria-label="Administration modules">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm">
            <div className="mb-5 h-2 w-16 rounded-full theme-primary-bg" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--school-text)]">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">{card.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--school-border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--school-muted)]">{card.status}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Configuration</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--school-text)]">Central school settings</h2>
            <p className="mt-2 text-sm text-[var(--school-muted)]">Manage the school theme and shared configuration from one place.</p>
          </div>
          <Link href="/admin/settings" className="w-fit rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">Open Settings</Link>
        </div>
      </section>
    </div>
  );
}
