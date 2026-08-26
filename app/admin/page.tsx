import { getCurrentProfile } from "@/lib/auth";
import SuperAdminDashboard from "@/components/admin/SuperAdminDashboard";

const isSuperAdmin = (roleName: string) =>
  ["super_admin", "super admin"].includes(roleName.toLowerCase().replace(/_/g, " "));

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  // Super Admin UI rollout starts here. No data/RPC/business logic is changed.
  if (isSuperAdmin(profile.role.name)) {
    return (
      <SuperAdminDashboard
        fullName={profile.full_name}
        email={profile.email}
        roleName={profile.role.name}
      />
    );
  }

  // Existing non-Super-Admin dashboard remains untouched until the staged
  // Super Admin UI is approved and the next UI module is loaded.
  const modules = [
    { href: "/admin/parents", title: "Parents & Guardians", description: "Approve Parent accounts, issue Parent IDs, review child registrations and maintain Parent–Student binding." },
    { href: "/admin/inventory", title: "Inventory", description: "Manage items, stock, item information and Inventory-side SR approval and processing." },
    { href: "/admin/item-sr", title: "Item SR", description: "Inspect the shared Item Service Request form and its member-side request structure." },
    { href: "/admin/accounts", title: "Accounts", description: "School financial operations including fees, salary payment, bills, income, expense, cash, bank, vouchers, ledger and reports." },
    { href: "/admin/hr", title: "HR • Attendance & Payroll", description: "Enter Teacher/Staff attendance by Member ID, calculate salary automatically and submit the salary sheet directly to Accounts." },
  ];

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
      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Ready administration modules">
        {modules.map(module => (
          <a key={module.href} href={module.href} className="group block rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)] hover:shadow-md md:p-8">
            <div className="mb-5 h-2 w-16 rounded-full theme-primary-bg transition-all group-hover:w-24" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Ready Module</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">{module.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">{module.description}</p>
            <span className="mt-6 inline-block text-xs font-bold theme-primary">Open {module.title} →</span>
          </a>
        ))}
      </section>
    </div>
  );
}
