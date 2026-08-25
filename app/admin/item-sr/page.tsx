import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AdminItemSrForm from "./AdminItemSrForm";

const permissions = [
  { title: "View / Search SR", description: "Search active inventory items by item code, name, type or specification." },
  { title: "Create SR", description: "Select items, set quantity and submit an Item Service Request for approval." },
  { title: "Full Popup Form", description: "The complete SR form opens in a large popup so the request information and selected items stay together." },
];

export default function AdminItemSrPage() {
  return (
    <AdminPageShell
      eyebrow="Item SR Form"
      title="Item Service Request"
      description="Functional Item SR workspace for Admin. Search real inventory items, select quantities and submit an SR directly from Admin."
      action={{ href: "/admin/inventory", label: "Open Inventory" }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 border-b border-[var(--school-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Admin SR Workspace</p>
              <h2 className="mt-1 text-xl font-black">Create Item Service Request</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Item codes come directly from active Inventory Items. The full request form opens in a popup.</p>
            </div>
            <span className="w-fit rounded-full border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black theme-primary">ADMIN: CREATE ENABLED</span>
          </div>
          <div className="mt-5"><AdminItemSrForm /></div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Access Control</p>
            <h2 className="mt-1 text-lg font-black">Role permissions</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">Member Item SR access remains controlled by Role Management. Admin has a dedicated authenticated SR endpoint.</p>
            <Link href="/admin/roles" className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Open Role Management →</Link>
          </section>
          <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">SR Features</p>
            <div className="mt-3 space-y-2">{permissions.map(p=><div key={p.title} className="rounded-2xl border border-[var(--school-border)] p-3"><h3 className="text-xs font-black">{p.title}</h3><p className="mt-1 text-[10px] leading-4 text-[var(--school-muted)]">{p.description}</p></div>)}</div>
          </section>
          <section className="rounded-3xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Workflow</p>
            <p className="mt-1 text-sm font-bold leading-6">Admin creates SR → Inventory receives it → authorized Inventory role approves / rejects / issues.</p>
          </section>
        </aside>
      </div>
    </AdminPageShell>
  );
}
