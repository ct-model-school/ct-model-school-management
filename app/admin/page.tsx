import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Administration</p><h1 className="mt-2 text-3xl font-bold text-[var(--school-text)]">Admin Dashboard</h1><p className="mt-2 text-sm text-[var(--school-muted)]">Welcome back, {profile.full_name || profile.email}.</p></div>
          <span className="w-fit rounded-full px-4 py-2 text-xs font-bold capitalize theme-primary-bg">{profile.role.name.replace(/_/g, " ")}</span>
        </div>
      </header>

      <section className="mt-6" aria-label="Ready administration modules">
        <Link href="/admin/inventory" className="group block rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)] hover:shadow-md md:p-8">
          <div className="mb-5 h-2 w-16 rounded-full theme-primary-bg transition-all group-hover:w-24" />
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Ready Modules</p><h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">Inventory + Item SR</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">Inventory manages items and stock. Item SR is the member request capability, while SR approval and processing remain inside the Inventory workspace.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black theme-primary">Inventory · READY</span><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black theme-primary">Item SR · READY</span></div></div>
            <span className="w-fit rounded-full border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black theme-primary">READY</span>
          </div>
          <span className="mt-6 inline-block text-xs font-bold theme-primary">Open Inventory Workspace →</span>
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 md:p-6"><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Module Rollout</p><h2 className="mt-1 text-base font-black">More modules will appear here as they become ready.</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Existing database structures and unfinished modules are kept intact. Only ready modules are exposed in the Admin UI.</p></section>
    </div>
  );
}
