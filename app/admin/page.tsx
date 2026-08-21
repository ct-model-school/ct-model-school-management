import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

const cards = [
  { href: "/admin/students", title: "Students", description: "Student records and registration" },
  { href: "/admin/accounts", title: "Accounts", description: "Income, expense, fees and payroll" },
  { href: "/admin/inventory", title: "Inventory", description: "Stock, handover and takeover" },
  { href: "/admin/settings", title: "Settings", description: "School settings and theme configuration" },
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
            <p className="mt-2 text-sm text-[var(--school-muted)]">
              Welcome back, {profile.full_name || profile.email}.
            </p>
          </div>
          <span className="w-fit rounded-full px-4 py-2 text-xs font-bold capitalize theme-primary-bg">
            {profile.role.name.replace(/_/g, " ")}
          </span>
        </div>
      </header>

      <section className="mt-6 grid gap-5 md:grid-cols-2" aria-label="Administration modules">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)] hover:shadow-md"
          >
            <div className="mb-5 h-2 w-16 rounded-full theme-primary-bg transition-all group-hover:w-24" />
            <h2 className="text-lg font-bold text-[var(--school-text)]">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">{card.description}</p>
            <span className="mt-5 inline-block text-xs font-bold theme-primary">Open module →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
