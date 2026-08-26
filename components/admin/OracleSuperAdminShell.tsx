"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SuperAdminParentWorkspace from "@/components/admin/SuperAdminParentWorkspace";
import SuperAdminHRWorkspace from "@/components/admin/SuperAdminHRWorkspace";

type Activity = { id: string; module: string; action: string; reference?: string | null; detail?: string | null; status?: string | null; createdAt: string };
type Action = { label: string; href: string; description?: string };
type Module = { id: string; title: string; code: string; group: string; description: string; actions: Action[] };

const A = (label: string, href: string, description?: string): Action => ({ label, href, description });

/*
 * This catalog is intentionally a UI/navigation layer only.
 * Existing pages, forms, dialogs, server actions and database logic are not replaced.
 * Every entry points to the existing workspace so its existing popup/form behavior stays intact.
 */
const MODULES: Module[] = [
  {
    id: "dashboard", title: "Command Center", code: "01", group: "Overview",
    description: "Owner-level control surface. Every visible administrative action is grouped here so you do not have to hunt through the application.",
    actions: [
      A("Command Center", "/admin"), A("Pending Actions", "/admin"), A("System Activity", "/admin"),
      A("Global Action Search", "/admin"), A("People Overview", "/admin/people"), A("Registration Overview", "/admin/people"),
      A("HR Overview", "/admin/hr"), A("Inventory Overview", "/admin/inventory"), A("Accounts Overview", "/admin/accounts"),
      A("Service Request Overview", "/admin/item-sr"), A("Results", "/admin/results"), A("Notice Board", "/admin/notices"),
    ],
  },
  {
    id: "people", title: "People & Registrations", code: "02", group: "People",
    description: "Existing people, member and registration workspaces gathered into one owner navigation.",
    actions: [
      A("People Directory", "/admin/people"), A("Members", "/admin/members"), A("Parents & Guardians", "/admin/parents"),
      A("Parent Accounts", "/admin/parents"), A("Parent Approvals", "/admin/parents"), A("Child Binding", "/admin/parents"),
      A("Parent Records", "/admin/parents"), A("Student Registrations", "/admin/people"), A("New Student Registration", "/admin/people"),
      A("Existing Student Registration", "/admin/people"), A("Teacher Registration", "/admin/people"), A("Staff Registration", "/admin/people"),
      A("Parent / Guardian Registration", "/admin/people"),
    ],
  },
  {
    id: "hr", title: "Human Resources", code: "03", group: "HR",
    description: "Teacher and staff administration, attendance and payroll workflow.",
    actions: [
      A("Staff & Teachers", "/admin/hr"), A("Staff Records", "/admin/hr"), A("Teacher Records", "/admin/hr"),
      A("Attendance", "/admin/hr"), A("Attendance Entry", "/admin/hr"), A("Attendance Review", "/admin/hr"),
      A("Payroll", "/admin/hr"), A("Payroll Calculation", "/admin/hr"), A("Monthly Salary Sheet", "/admin/hr"),
      A("Salary Sheet Review", "/admin/hr"), A("Submit Salary to Accounts", "/admin/hr"), A("Payroll History", "/admin/hr"),
    ],
  },
  {
    id: "inventory", title: "Inventory & Procurement", code: "04", group: "Store",
    description: "Full existing inventory tree including products, people, stock movement, procurement, handover, takeover, returns and reports.",
    actions: [
      A("Inventory Dashboard", "/admin/inventory"), A("Items / Products", "/admin/inventory/products"), A("Add / Edit Items", "/admin/inventory"),
      A("Product Details", "/admin/inventory/products"), A("Suppliers", "/admin/inventory/suppliers"), A("Inventory Persons", "/admin/inventory/persons"),
      A("Stock In", "/admin/inventory/stock-in"), A("New Stock In", "/admin/inventory/stock-in"), A("Stock Out", "/admin/inventory/stock-out"),
      A("New Stock Out", "/admin/inventory/stock-out"), A("Issue Stock", "/admin/inventory/issue"), A("Return Stock", "/admin/inventory/return"),
      A("Returns", "/admin/inventory/returns"), A("Handover", "/admin/inventory/handover"), A("Takeover", "/admin/inventory/takeover"),
      A("Procurement", "/admin/inventory/procurement"), A("Procurement Workspace", "/admin/inventory/procurement"),
      A("Procurement Reports", "/admin/inventory/reports"), A("Inventory Reports", "/admin/inventory/reports"),
    ],
  },
  {
    id: "sr", title: "Service Requests", code: "05", group: "Workflow",
    description: "Item Service Request workflow from creation through approval, issue and history.",
    actions: [
      A("Create Service Request", "/admin/item-sr"), A("My SR", "/admin/item-sr"), A("Awaiting Approval", "/admin/item-sr"),
      A("Approved SR", "/admin/item-sr"), A("Issued SR", "/admin/item-sr"), A("SR History", "/admin/item-sr"),
      A("View SR", "/admin/item-sr"), A("Print SR", "/admin/item-sr"), A("Review SR", "/admin/item-sr"),
      A("Approve SR", "/admin/item-sr"), A("Issue SR", "/admin/item-sr"),
    ],
  },
  {
    id: "accounts", title: "Accounts & Finance", code: "06", group: "Finance",
    description: "Existing accounts tree gathered into one owner-level finance command surface.",
    actions: [
      A("Accounts Dashboard", "/admin/accounts"), A("Accounts Entry", "/admin/accounts"), A("Fees", "/admin/accounts/fees"),
      A("Income", "/admin/accounts/income"), A("New Income", "/admin/accounts/income"), A("Expense", "/admin/accounts/expense"),
      A("New Expense", "/admin/accounts/expense/new"), A("Bill Payments", "/admin/accounts"), A("Bill Payment Workspace", "/admin/accounts"),
      A("PO Payments", "/admin/accounts"), A("Purchase Order Payments", "/admin/accounts"), A("Cashbook", "/admin/accounts/cashbook"),
      A("Bank", "/admin/accounts/bank"), A("Journal", "/admin/accounts/journal"), A("Ledger", "/admin/accounts/ledger"),
      A("Member Account Lookup", "/admin/accounts"), A("Financial Overview", "/admin/accounts"), A("Accounts Reports", "/admin/accounts/reports"),
      A("Financial Reports", "/admin/accounts/reports"),
    ],
  },
  {
    id: "academic", title: "Academic & Communication", code: "07", group: "School",
    description: "Existing academic result and notice administration entry points.",
    actions: [A("Results", "/admin/results"), A("Result Management", "/admin/results"), A("Notice Board", "/admin/notices"), A("Publish Notice", "/admin/notices"), A("Notice Management", "/admin/notices")],
  },
  {
    id: "access", title: "Access & System Control", code: "08", group: "Control",
    description: "Owner controls for access, roles, permissions, portals, settings and audit visibility.",
    actions: [A("Role Management", "/admin/roles"), A("Permission Builder", "/admin/roles"), A("PR & PO Permissions", "/admin/roles"), A("Admin Portals", "/admin/portals"), A("System Settings", "/admin/settings"), A("Audit & Activity", "/admin"), A("Access Overview", "/admin/roles")],
  },
];

const PENDING = ["pending", "due", "partially_issued", "awaiting_approval", "submitted", "under_review", "pending_approval"];

export default function OracleSuperAdminShell({ fullName, email, roleName, activityItems = [] }: { fullName?: string | null; email?: string | null; roleName: string; activityItems?: Activity[] }) {
  const [selected, setSelected] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string[]>(MODULES.map(m => m.id));
  const [showAll, setShowAll] = useState(false);
  const [quickAction, setQuickAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const current = MODULES.find(m => m.id === selected) || MODULES[0];
  const name = fullName || email || "Super Admin";
  const role = roleName.replace(/_/g, " ");
  const pending = activityItems.filter(x => PENDING.includes((x.status || "").toLowerCase()));
  const totalActions = MODULES.reduce((n, m) => n + m.actions.length, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.map(m => ({ ...m, actions: m.actions.filter(a => `${m.title} ${m.group} ${a.label} ${a.description || ""}`.toLowerCase().includes(q)) }))
      .filter(m => m.actions.length || `${m.title} ${m.group}`.toLowerCase().includes(q));
  }, [search]);

  const toggle = (id: string) => setOpen(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const choose = (m: Module) => { setSelected(m.id); if (!open.includes(m.id)) setOpen(v => [...v, m.id]); };
  const logout = async () => { if (busy) return; setBusy(true); try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.href = "https://ct-model-school-management.vercel.app/loginportal"; } };

  return <div className="mx-auto w-full max-w-[1740px]">
    <div className="overflow-hidden rounded-[24px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm lg:grid lg:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="flex max-h-[calc(100vh-5rem)] min-h-[760px] flex-col border-b border-[var(--school-border)] lg:border-b-0 lg:border-r">
        <div className="border-b border-[var(--school-border)] p-5">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl theme-primary-bg text-xs font-black">CT</div><div><p className="text-xs font-black">C.T. Model School</p><p className="text-[9px] font-semibold text-[var(--school-muted)]">Owner Administration</p></div></div>
          <div className="mt-4 flex items-center justify-between"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black uppercase theme-primary">Super Admin / Owner</span><span className="text-[9px] font-bold text-[var(--school-muted)]">● Active</span></div>
        </div>
        <div className="border-b border-[var(--school-border)] p-3"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any action…" className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2.5 text-[10px] font-semibold outline-none" /></div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between px-2"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--school-muted)]">Complete action tree</p><span className="text-[9px] font-black theme-primary">{totalActions}</span></div>
          <nav className="space-y-1">{filtered.map(m => { const active = m.id === selected; const expanded = open.includes(m.id); return <div key={m.id}>
            <button type="button" onClick={() => { choose(m); toggle(m.id); }} className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left ${active ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-transparent hover:bg-[var(--school-background)]"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8px] font-black ${active ? "bg-[var(--school-surface)] theme-primary" : "bg-[var(--school-background)] text-[var(--school-muted)]"}`}>{m.code}</span>
              <span className="min-w-0 flex-1"><b className={`block truncate text-[10px] ${active ? "theme-primary" : ""}`}>{m.title}</b><small className="block text-[8px] text-[var(--school-muted)]">{m.group} · {m.actions.length} actions</small></span><span className={expanded ? "rotate-180" : ""}>⌄</span>
            </button>
            {expanded && <div className="ml-9 mt-1 space-y-0.5 border-l border-[var(--school-border)] pl-2">{m.actions.map((a, i) => <button key={`${m.id}-${a.label}`} type="button" onClick={() => setQuickAction(a)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[9px] font-semibold text-[var(--school-muted)] hover:bg-[var(--school-background)]"><span className="w-5 text-[8px] font-black">{String(i + 1).padStart(2, "0")}</span><span className="truncate">{a.label}</span></button>)}</div>}
          </div> })}</nav>
        </div>
        <div className="border-t border-[var(--school-border)] p-3"><div className="rounded-xl bg-[var(--school-background)] p-3"><p className="truncate text-[10px] font-black">{name}</p><p className="mt-0.5 truncate text-[8px] font-bold capitalize theme-primary">{role}</p><button type="button" onClick={logout} disabled={busy} className="mt-3 w-full rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2 text-[9px] font-black theme-primary">{busy ? "Logging out…" : "Logout"}</button></div></div>
      </aside>

      <main className="min-w-0 bg-[var(--school-background)]">
        <header className="sticky top-0 z-30 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{current.group}</p><p className="text-sm font-black">{current.title}</p></div><div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full border border-[var(--school-border)] px-3 py-1.5 text-[9px] font-bold text-[var(--school-muted)] sm:inline-flex">{totalActions} owner actions mapped</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--school-primary-soft)] text-[10px] font-black theme-primary">{name.slice(0, 1).toUpperCase()}</span></div></div></header>
        <div className="p-4 sm:p-6 lg:p-8">
          {selected === "dashboard" ? <CommandCenter name={name} pending={pending} activity={activityItems} modules={MODULES} onSelect={choose} onAction={setQuickAction} showAll={showAll} setShowAll={setShowAll} /> : <ModuleLanding module={current} activity={activityItems} pending={pending} onAction={setQuickAction} />}
        </div>
      </main>
    </div>
    {quickAction && <ActionModal action={quickAction} onClose={() => setQuickAction(null)} />}
  </div>;
}

function CommandCenter({ name, pending, activity, modules, onSelect, onAction, showAll, setShowAll }: { name: string; pending: Activity[]; activity: Activity[]; modules: Module[]; onSelect: (m: Module) => void; onAction: (a: Action) => void; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const [tab, setTab] = useState<"actions" | "pending" | "activity">("actions");
  const count = modules.reduce((n, m) => n + m.actions.length, 0);
  const visible = showAll ? modules : modules.slice(0, 6);
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-[var(--school-border)] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] theme-primary">Super Admin / Owner Command Center</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">Dashboard-er moddhe je action gulo existing tree-te ache, segulo ek jaygay. Existing form, popup and workflow unchanged.</p></div><div className="grid grid-cols-3 gap-2 sm:w-[390px]"><Stat label="Modules" value={String(modules.length)} /><Stat label="Actions" value={String(count)} /><Stat label="Pending" value={String(pending.length)} primary /></div></div>
    <section className="grid gap-3 md:grid-cols-3"><Quick title="Pending Actions" value={`${pending.length} items`} onClick={() => setTab("pending")} primary /><Quick title="System Activity" value={`${activity.length} live records`} onClick={() => setTab("activity")} /><Quick title="All Actions" value={`${count} mapped actions`} onClick={() => setTab("actions")} /></section>
    {tab === "actions" && <div className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">Complete action catalog</p><h2 className="mt-1 text-xl font-black">Nothing hidden</h2></div><button type="button" onClick={() => setShowAll(!showAll)} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-[9px] font-black theme-primary">{showAll ? "Show core" : "Show all modules"}</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(m => <ModuleCard key={m.id} module={m} onSelect={onSelect} onAction={onAction} />)}</div></div>}
    {tab === "pending" && <ActivityList title="Pending Actions" items={pending} />}
    {tab === "activity" && <ActivityList title="Recent System Activity" items={activity} />}
  </div>;
}

function ModuleCard({ module, onSelect, onAction }: { module: Module; onSelect: (m: Module) => void; onAction: (a: Action) => void }) {
  return <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => onSelect(module)} className="text-left"><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">{module.code} · {module.group}</p><h3 className="mt-1 text-base font-black">{module.title}</h3></button><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[8px] font-black theme-primary">{module.actions.length}</span></div><p className="mt-2 text-[10px] leading-5 text-[var(--school-muted)]">{module.description}</p><div className="mt-4 grid gap-1.5">{module.actions.slice(0, 8).map(a => <button key={a.label} type="button" onClick={() => onAction(a)} className="rounded-lg bg-[var(--school-background)] px-2.5 py-2 text-left text-[9px] font-semibold text-[var(--school-muted)] hover:theme-primary">{a.label}</button>)}{module.actions.length > 8 && <button type="button" onClick={() => onSelect(module)} className="px-2.5 pt-1 text-left text-[8px] font-black theme-primary">+ {module.actions.length - 8} more actions →</button>}</div></section>;
}

function ModuleLanding({ module, activity, pending, onAction }: { module: Module; activity: Activity[]; pending: Activity[]; onAction: (a: Action) => void }) {
  if (module.id === "people") return <SuperAdminParentWorkspace section="Parent Accounts" />;
  if (module.id === "hr") return <SuperAdminHRWorkspace section="Staff & Teachers" />;
  return <div className="space-y-5"><div className="border-b border-[var(--school-border)] pb-5"><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{module.group}</p><h1 className="mt-2 text-3xl font-black">{module.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">{module.description}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{module.actions.map((a, i) => <button key={a.label} type="button" onClick={() => onAction(a)} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)] hover:shadow-sm"><span className="text-[8px] font-black theme-primary">ACTION {String(i + 1).padStart(2, "0")}</span><h2 className="mt-1 text-sm font-black">{a.label}</h2><p className="mt-1 text-[9px] leading-4 text-[var(--school-muted)]">{a.description || `Open the existing ${a.label} workspace. Any existing form or popup remains the source of truth.`}</p></button>)}</div><div className="grid gap-5 xl:grid-cols-2"><ActivityList title="Pending in system" items={pending.slice(0, 8)} /><ActivityList title="Recent activity" items={activity.slice(0, 8)} /></div></div>;
}

function ActionModal({ action, onClose }: { action: Action; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={action.label} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="w-full max-w-md rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-2xl"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--school-primary-soft)] text-xs font-black theme-primary">↗</div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">Existing workspace</p><h2 className="mt-1 text-lg font-black">{action.label}</h2><p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">This action opens the existing module. Existing forms, dialogs, validation, server actions and database behavior are kept intact.</p></div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-lg text-[var(--school-muted)]">×</button></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-black">Cancel</button><Link href={action.href} onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-black theme-primary-bg">Open {action.label}</Link></div></div></div>;
}

function ActivityList({ title, items }: { title: string; items: Activity[] }) { return <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:p-5"><p className="text-[9px] font-black uppercase theme-primary">Live records</p><h2 className="mt-1 text-lg font-black">{title}</h2><div className="mt-4">{items.length ? <div className="divide-y divide-[var(--school-border)] overflow-hidden rounded-xl border border-[var(--school-border)]">{items.map(x => <div key={x.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1.5fr_.7fr_.7fr]"><div><p className="text-xs font-black">{x.action}</p><p className="text-[9px] text-[var(--school-muted)]">{x.module}{x.detail ? ` · ${x.detail}` : ""}</p></div><p className="text-[9px] text-[var(--school-muted)]">{x.reference || "—"}</p><div><span className="rounded-full border border-[var(--school-border)] px-2 py-1 text-[8px]">{status(x.status)}</span><p className="mt-1 text-[8px] text-[var(--school-muted)]">{date(x.createdAt)}</p></div></div>)}</div> : <Empty text="No records found." />}</div></section>; }
function Stat({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) { return <div className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><p className="text-[8px] font-black uppercase text-[var(--school-muted)]">{label}</p><p className={`mt-1 text-xl font-black ${primary ? "theme-primary" : ""}`}>{value}</p></div>; }
function Quick({ title, value, onClick, primary = false }: { title: string; value: string; onClick: () => void; primary?: boolean }) { return <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left ${primary ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-[var(--school-border)] bg-[var(--school-surface)]"}`}><p className="text-[9px] font-black uppercase tracking-[.12em] text-[var(--school-muted)]">{title}</p><p className="mt-2 text-sm font-black theme-primary">{value}</p></button>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[var(--school-border)] p-8 text-center text-[10px] text-[var(--school-muted)]">{text}</div>; }
function status(v?: string | null) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Updated"; }
function date(v: string) { try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)); } catch { return v; } }
