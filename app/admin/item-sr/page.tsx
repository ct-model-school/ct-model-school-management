import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import ItemSrModule from "@/app/member/dashboard/item-sr";

const permissions = [
  { title: "View / Search SR", description: "Permission for a member to access the Item SR workspace and search the items available for requesting." },
  { title: "Create SR", description: "Permission for a member to select items, enter quantity and request details, then submit an Item Service Request." },
  { title: "View Own SR History", description: "Permission for a member to view their submitted requests and current approval or issue status." },
];

export default function AdminItemSrPage() {
  return (
    <AdminPageShell
      eyebrow="Item SR Form"
      title="Item Service Request"
      description="This is the actual shared Item SR form used by members. Admin can inspect the complete form structure here, while submission remains disabled. Future form changes should be made in this single shared form so there is no duplicate SR form or duplicate form logic."
      action={{ href: "/admin/inventory", label: "Open Inventory" }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 border-b border-[var(--school-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Admin Form Lab</p>
              <h2 className="mt-1 text-xl font-black">Actual Member SR Form</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Preview only. Search, selection and submission controls are intentionally disabled for Admin.</p>
            </div>
            <span className="w-fit rounded-full border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black theme-primary">ADMIN: NO SUBMIT</span>
          </div>

          <ItemSrModule department="" permissions={{ view: true, create: true, history: true }} preview />
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Access Control</p>
            <h2 className="mt-1 text-lg font-black">Role permissions</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">Enable or disable each Item SR permission independently from Role Management.</p>
            <Link href="/admin/roles" className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Open Role Management →</Link>
          </section>

          <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Member Permissions</p>
            <div className="mt-3 space-y-2">
              {permissions.map((permission) => (
                <div key={permission.title} className="rounded-2xl border border-[var(--school-border)] p-3">
                  <h3 className="text-xs font-black">{permission.title}</h3>
                  <p className="mt-1 text-[10px] leading-4 text-[var(--school-muted)]">{permission.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Workflow</p>
            <p className="mt-1 text-sm font-bold leading-6">Member creates SR → Inventory receives it → authorized Inventory role approves / rejects / issues.</p>
            <p className="mt-2 text-[10px] leading-4 text-[var(--school-muted)]">Admin does not create an SR. This page is the control and preview surface for the one shared SR form.</p>
          </section>
        </aside>
      </div>
    </AdminPageShell>
  );
}
