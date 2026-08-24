import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

const permissions = [
  {
    title: "View / Search SR",
    description: "Permission for a member to access the Item SR workspace and search the items available for requesting.",
  },
  {
    title: "Create SR",
    description: "Permission for a member to select items, enter quantity and request details, then submit an Item Service Request.",
  },
  {
    title: "View Own SR History",
    description: "Permission for a member to view their submitted requests and current approval or issue status.",
  },
];

export default function AdminItemSrPage() {
  return (
    <AdminPageShell
      eyebrow="Ready Module"
      title="Item SR"
      description="The Item SR category is the member-side request capability. Admin does not submit an SR from this page. SR approval and issue processing remain in Inventory."
      action={{ href: "/admin/inventory", label: "Open Inventory" }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Member Capability</p>
          <h2 className="mt-1 text-xl font-black">Item Service Request</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">
            This module contains the single member SR form. It is exposed to a member only when the corresponding role permissions are enabled.
          </p>

          <div className="mt-5 space-y-3">
            {permissions.map((permission) => (
              <div key={permission.title} className="rounded-2xl border border-[var(--school-border)] p-4">
                <h3 className="text-sm font-black">{permission.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">{permission.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Workflow</p>
            <p className="mt-1 text-sm font-bold">Member creates SR → Inventory receives it → authorized Inventory role approves/rejects/issues.</p>
          </div>
        </section>

        <aside className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Access Control</p>
          <h2 className="mt-1 text-lg font-black">Role permissions</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">Enable or disable each Item SR permission independently from Role Management.</p>
          <Link href="/admin/roles" className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Open Role Management →</Link>
        </aside>
      </div>
    </AdminPageShell>
  );
}
