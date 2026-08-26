"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Activity = { id: string; module: string; action: string; reference?: string | null; detail?: string | null; status?: string | null; createdAt: string };
type Action = { label: string; href?: string; description?: string; children?: Action[]; kind?: "refresh" | "export" | "pending" | "activity" };
type Module = { id: string; title: string; code: string; group: string; description: string; actions: Action[] };

const A = (label: string, href?: string, description?: string, children?: Action[], kind?: Action["kind"]): Action => ({ label, href, description, children, kind });

const MODULES: Module[] = [
  { id: "dashboard", title: "Dashboard", code: "01", group: "Overview", description: "Owner command center with overview, pending work and complete system activity controls.", actions: [
    A("Overview", "/admin", "Open the Super Admin overview."),
    A("Pending Actions", undefined, "Review every currently actionable record.", undefined, "pending"),
    A("System Activity", undefined, "Inspect live activity with refresh, search and export controls.", undefined, "activity"),
    A("Global Action Search", "/admin", "Use the owner action catalog and search from the command center."),
  ]},
  { id: "people", title: "People", code: "02", group: "People", description: "Students, parents, guardians and every member category in one complete tree.", actions: [
    A("Students", "/admin/people", "Student directory and student administration."),
    A("Parents & Guardians", "/admin/parents", "Parent and guardian records and workflows."),
    A("Members", "/admin/members", "All member categories." , [
      A("Staff", "/admin/hr", "Staff records and HR workspace."),
      A("Teachers", "/admin/hr", "Teacher records and HR workspace."),
      A("Accounts", "/admin/accounts", "Accounts member and finance workspace."),
      A("Others", "/admin/members", "Other member records."),
    ]),
    A("New Student Registration", "/admin/people", "Start a new student registration workflow."),
    A("Existing Student Registration", "/admin/people", "Manage existing-student registration requests."),
    A("Parent / Guardian Registration", "/admin/parents", "Manage parent and guardian registration requests."),
    A("Teacher Registration", "/admin/people", "Manage teacher registration."),
    A("Staff Registration", "/admin/people", "Manage staff registration."),
  ]},
  { id: "hr", title: "Human Resources", code: "03", group: "HR", description: "Complete staff and teacher administration, attendance and payroll workflow.", actions: [
    A("Staff & Teachers", "/admin/hr", "Open the HR workspace."),
    A("Attendance", "/admin/hr", "Attendance records and review." , [A("Attendance Entry", "/admin/hr"), A("Attendance Review", "/admin/hr")]),
    A("Payroll", "/admin/hr", "Payroll workflow." , [A("Payroll Calculation", "/admin/hr"), A("Salary Sheet Review", "/admin/hr"), A("Submit Salary to Accounts", "/admin/hr"), A("Payroll History", "/admin/hr")]),
    A("Monthly Salary Sheet", "/admin/hr", "Monthly salary sheet generation and review."),
  ]},
  { id: "inventory", title: "Inventory & Procurement", code: "04", group: "Store", description: "Inventory, stock movement and procurement from request through purchase and restock.", actions: [
    A("Items", "/admin/inventory/products", "Inventory item and product records.", [A("Add Item", "/admin/inventory", "Add or edit an inventory item."), A("Product Details", "/admin/inventory/products")]),
    A("Stock", "/admin/inventory", "Current stock overview.", [A("Stock In", "/admin/inventory/stock-in"), A("Stock Out", "/admin/inventory/stock-out")]),
    A("Suppliers", "/admin/inventory/suppliers"),
    A("Inventory Persons", "/admin/inventory/persons"),
    A("Issue", "/admin/inventory/issue"),
    A("Return", "/admin/inventory/return", "Return workflow.", [A("Return Records", "/admin/inventory/returns")]),
    A("Handover", "/admin/inventory/handover"),
    A("Takeover", "/admin/inventory/takeover"),
    A("PR", "/admin/inventory/procurement", "Procurement request workflow.", [A("Create", "/admin/inventory/procurement"), A("Approval", "/admin/inventory/procurement"), A("History", "/admin/inventory/procurement")]),
    A("PO", "/admin/inventory/procurement", "Purchase order workflow.", [A("Generate", "/admin/inventory/procurement"), A("Price Entry", "/admin/inventory/procurement"), A("Approval", "/admin/inventory/procurement"), A("Payment", "/admin/accounts"), A("Restock", "/admin/inventory/stock-in"), A("History", "/admin/inventory/procurement")]),
    A("Inventory Reports", "/admin/inventory/reports", "Inventory and procurement reports."),
  ]},
  { id: "sr", title: "Service Requests", code: "05", group: "Workflow", description: "Complete service request lifecycle from creation to issue and history.", actions: [
    A("Create SR", "/admin/item-sr"), A("Approval", "/admin/item-sr"), A("Issue", "/admin/item-sr"), A("Print", "/admin/item-sr"), A("History", "/admin/item-sr"),
    A("My SR", "/admin/item-sr"), A("Awaiting Approval", "/admin/item-sr"), A("Approved SR", "/admin/item-sr"), A("Issued SR", "/admin/item-sr"), A("View SR", "/admin/item-sr"), A("Review SR", "/admin/item-sr"),
  ]},
  { id: "accounts", title: "Accounts", code: "06", group: "Finance", description: "Fees, income, expense, payments, cash, bank, journal, ledger and reporting.", actions: [
    A("Dashboard", "/admin/accounts"),
    A("Fees", "/admin/accounts/fees", "Fee management.", [A("Fee Structure", "/admin/accounts/fees/structure"), A("Collection", "/admin/accounts/fees/collection"), A("Dues", "/admin/accounts/fees/dues")]),
    A("Income", "/admin/accounts/income", "Income records.", [A("New Income", "/admin/accounts/income/new")]),
    A("Expense", "/admin/accounts/expense", "Expense records.", [A("New Expense", "/admin/accounts/expense/new")]),
    A("Bill Payments", "/admin/accounts"), A("PO Payments", "/admin/accounts"),
    A("Cash", "/admin/accounts/cashbook"), A("Bank", "/admin/accounts/bank"), A("Journal", "/admin/accounts/journal"), A("Ledger", "/admin/accounts/ledger"),
    A("Member Account Lookup", "/admin/accounts"),
    A("Reports", "/admin/accounts/reports", "All finance reports.", [A("Fee Collection", "/admin/accounts/reports/fee-collection"), A("Financial Summary", "/admin/accounts/reports/financial-summary"), A("Income & Expense", "/admin/accounts/reports/income-expense"), A("Outstanding", "/admin/accounts/reports/outstanding")]),
  ]},
  { id: "academic", title: "Academic", code: "07", group: "School", description: "Student academic administration, results, notices and reporting.", actions: [
    A("Students", "/admin/people"), A("Results", "/admin/results", "Result management."), A("Notices", "/admin/notices", "Notice management and publishing."), A("Reports", "/admin/results", "Academic reporting and result review."),
  ]},
  { id: "access", title: "Access Control", code: "08", group: "Control", description: "Roles, permissions, procurement permissions, portals and complete audit visibility.", actions: [
    A("Roles", "/admin/roles", "Role management."), A("Permissions", "/admin/roles", "Permission builder."), A("PR & PO Permissions", "/admin/roles", "Procurement-specific permissions."), A("Portal Management", "/admin/portals", "Admin portal controls."), A("System Settings", "/admin/settings", "System configuration."),
    A("Audit", undefined, "Complete activity and audit controls.", undefined, "activity"),
  ]},
];

const PENDING = ["pending", "due", "partially_issued", "awaiting_approval", "submitted", "under_review", "pending_approval"];
const leaves = (actions: Action[]): Action[] => actions.flatMap(a => a.children?.length ? leaves(a.children) : [a]);
const leafCount = (module: Module) => leaves(module.actions).length;

export default function OracleSuperAdminShell({ fullName, email, roleName, activityItems = [] }: { fullName?: string | null; email?: string | null; roleName: string; activityItems?: Activity[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string[]>(MODULES.map(m => m.id));
  const [tab, setTab] = useState<"tree" | "pending" | "activity">("tree");
  const [activityQuery, setActivityQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const current = MODULES.find(m => m.id === selected) || MODULES[0];
  const name = fullName || email || "Super Admin";
  const role = roleName.replace(/_/g, " ");
  const pending = activityItems.filter(x => PENDING.includes((x.status || "").toLowerCase()));
  const totalActions = MODULES.reduce((n, m) => n + leafCount(m), 0);
  const activity = useMemo(() => { const q = activityQuery.trim().toLowerCase(); return q ? activityItems.filter(x => `${x.module} ${x.action} ${x.reference || ""} ${x.detail || ""} ${x.status || ""}`.toLowerCase().includes(q)) : activityItems; }, [activityItems, activityQuery]);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); if (!q) return MODULES; const match = (a: Action) => `${a.label} ${a.description || ""} ${(a.children || []).map(c => c.label).join(" ")}`.toLowerCase().includes(q) || (a.children || []).some(match); return MODULES.map(m => ({ ...m, actions: m.actions.filter(match) })).filter(m => m.actions.length || `${m.title} ${m.group}`.toLowerCase().includes(q)); }, [search]);
  const toggle = (id: string) => setOpen(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const select = (m: Module) => { setSelected(m.id); if (!open.includes(m.id)) setOpen(v => [...v, m.id]); };
  const refresh = () => router.refresh();
  const exportActivity = () => { const rows = activity.map(x => [x.createdAt, x.module, x.action, x.reference || "", x.status || "", x.detail || ""]); const csv = [["Date","Module","Action","Reference","Status","Detail"], ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `system-activity-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url); };
  const logout = async () => { if (busy) return; setBusy(true); try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.href = "/loginportal"; } };

  const runAction = (a: Action) => { if (a.kind === "refresh") return refresh(); if (a.kind === "export") return exportActivity(); if (a.kind === "pending") return setTab("pending"); if (a.kind === "activity") return setTab("activity"); };

  return <div className="mx-auto w-full max-w-[1740px]">
    <div className="overflow-hidden rounded-[24px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm lg:grid lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="flex max-h-[calc(100vh-5rem)] min-h-[760px] flex-col border-b border-[var(--school-border)] lg:border-b-0 lg:border-r">
        <div className="border-b border-[var(--school-border)] p-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl theme-primary-bg text-xs font-black">CT</div><div><p className="text-xs font-black">C.T. Model School</p><p className="text-[9px] font-semibold text-[var(--school-muted)]">Owner Administration</p></div></div><div className="mt-4 flex items-center justify-between"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black uppercase theme-primary">Super Admin / Owner</span><span className="text-[9px] font-bold text-[var(--school-muted)]">● Active</span></div></div>
        <div className="border-b border-[var(--school-border)] p-3"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search every action…" className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2.5 text-[10px] font-semibold outline-none" /></div>
        <div className="flex-1 overflow-y-auto p-3"><div className="mb-2 flex items-center justify-between px-2"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--school-muted)]">Complete action tree</p><span className="text-[9px] font-black theme-primary">{totalActions} leaves</span></div><nav className="space-y-1">{filtered.map(m => <TreeModule key={m.id} module={m} active={selected === m.id} expanded={open.includes(m.id)} onToggle={() => { select(m); toggle(m.id); }} onRun={runAction} />)}</nav></div>
        <div className="border-t border-[var(--school-border)] p-3"><div className="rounded-xl bg-[var(--school-background)] p-3"><p className="truncate text-[10px] font-black">{name}</p><p className="mt-0.5 truncate text-[8px] font-bold capitalize theme-primary">{role}</p><button type="button" onClick={logout} disabled={busy} className="mt-3 w-full rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2 text-[9px] font-black theme-primary">{busy ? "Logging out…" : "Logout"}</button></div></div>
      </aside>
      <main className="min-w-0 bg-[var(--school-background)]">
        <header className="sticky top-0 z-30 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{current.group}</p><p className="text-sm font-black">{current.title}</p></div><div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full border border-[var(--school-border)] px-3 py-1.5 text-[9px] font-bold text-[var(--school-muted)] sm:inline-flex">{totalActions} leaf actions</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--school-primary-soft)] text-[10px] font-black theme-primary">{name.slice(0, 1).toUpperCase()}</span></div></div></header>
        <div className="p-4 sm:p-6 lg:p-8">
          {selected === "dashboard" ? <Dashboard name={name} pending={pending} activity={activity} modules={MODULES} tab={tab} setTab={setTab} query={activityQuery} setQuery={setActivityQuery} onRun={runAction} onRefresh={refresh} onExport={exportActivity} onSelect={select} /> : <ModuleLanding module={current} pending={pending} activity={activity} onRun={runAction} />}
        </div>
      </main>
    </div>
  </div>;
}

function TreeModule({ module, active, expanded, onToggle, onRun }: { module: Module; active: boolean; expanded: boolean; onToggle: () => void; onRun: (a: Action) => void }) { return <div><button type="button" onClick={onToggle} className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left ${active ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-transparent hover:bg-[var(--school-background)]"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8px] font-black ${active ? "bg-[var(--school-surface)] theme-primary" : "bg-[var(--school-background)] text-[var(--school-muted)]"}`}>{module.code}</span><span className="min-w-0 flex-1"><b className={`block truncate text-[10px] ${active ? "theme-primary" : ""}`}>{module.title}</b><small className="block text-[8px] text-[var(--school-muted)]">{module.group} · {leafCount(module)} leaf actions</small></span><span className={expanded ? "rotate-180" : ""}>⌄</span></button>{expanded && <div className="ml-7 mt-1 border-l border-[var(--school-border)] pl-2">{module.actions.map((a, i) => <TreeAction key={`${module.id}-${a.label}`} action={a} index={i + 1} onRun={onRun} />)}</div>}</div>; }

function TreeAction({ action, index, onRun }: { action: Action; index: number; onRun: (a: Action) => void }) { const [open, setOpen] = useState(true); const hasChildren = !!action.children?.length; return <div className="mb-0.5"><div className="flex items-center gap-1"><ActionButton action={action} index={index} onRun={onRun} /><button type="button" aria-label={`Toggle ${action.label}`} onClick={() => setOpen(v => !v)} className={`shrink-0 rounded-md px-1 text-[9px] text-[var(--school-muted)] ${hasChildren ? "" : "invisible"}`}>⌄</button></div>{hasChildren && open && <div className="ml-4 border-l border-[var(--school-border)] pl-2">{action.children!.map((c, i) => <TreeAction key={`${action.label}-${c.label}`} action={c} index={i + 1} onRun={onRun} />)}</div>}</div>; }

function ActionButton({ action, index, onRun }: { action: Action; index: number; onRun: (a: Action) => void }) { const body = <><span className="w-6 shrink-0 text-[7px] font-black">{String(index).padStart(2, "0")}</span><span className="truncate">{action.label}</span></>; if (action.kind) return <button type="button" onClick={() => onRun(action)} className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-left text-[8px] font-semibold theme-primary hover:bg-[var(--school-background)]">{body}</button>; return <Link href={action.href || "/admin"} className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-left text-[8px] font-semibold text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:theme-primary">{body}</Link>; }

function Dashboard({ name, pending, activity, modules, tab, setTab, query, setQuery, onRun, onRefresh, onExport, onSelect }: { name: string; pending: Activity[]; activity: Activity[]; modules: Module[]; tab: "tree" | "pending" | "activity"; setTab: (v: "tree" | "pending" | "activity") => void; query: string; setQuery: (v: string) => void; onRun: (a: Action) => void; onRefresh: () => void; onExport: () => void; onSelect: (m: Module) => void }) { const count = modules.reduce((n, m) => n + leafCount(m), 0); return <div className="space-y-6"><div className="flex flex-col gap-4 border-b border-[var(--school-border)] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] theme-primary">Super Admin / Owner Command Center</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">Every parent branch is expanded into its child actions. No dashboard card is treated as complete until its leaf actions are represented.</p></div><div className="grid grid-cols-3 gap-2 sm:w-[390px]"><Stat label="Modules" value={String(modules.length)} /><Stat label="Leaf Actions" value={String(count)} /><Stat label="Pending" value={String(pending.length)} primary /></div></div><section className="grid gap-3 md:grid-cols-3"><Quick title="Complete Action Tree" value={`${count} leaf actions`} onClick={() => setTab("tree")} primary /><Quick title="Pending Actions" value={`${pending.length} records`} onClick={() => setTab("pending")} /><Quick title="System Activity" value={`${activity.length} records`} onClick={() => setTab("activity")} /></section>{tab === "tree" && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map(m => <section key={m.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => onSelect(m)} className="text-left"><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">{m.code} · {m.group}</p><h3 className="mt-1 text-base font-black">{m.title}</h3></button><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[8px] font-black theme-primary">{leafCount(m)} leaves</span></div><p className="mt-2 text-[10px] leading-5 text-[var(--school-muted)]">{m.description}</p><div className="mt-4 space-y-1">{m.actions.map((a, i) => <DashboardAction key={a.label} action={a} index={i + 1} onRun={onRun} />)}</div></section>)}</div>}{tab === "pending" && <ActivityList title="Pending Actions" items={pending} empty="No pending actions." />}{tab === "activity" && <section className="space-y-4"><div className="flex flex-col gap-3 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:flex-row sm:items-center"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search system activity…" className="min-w-0 flex-1 rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2.5 text-xs font-semibold outline-none" /><button type="button" onClick={onRefresh} className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-[9px] font-black theme-primary">Refresh</button><button type="button" onClick={onExport} className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-[9px] font-black theme-primary">Export CSV</button></div><ActivityList title="System Activity" items={activity} empty="No activity records found." /></section>}</div>; }

function DashboardAction({ action, index, onRun }: { action: Action; index: number; onRun: (a: Action) => void }) { return <div className="rounded-lg bg-[var(--school-background)]"><ActionButton action={action} index={index} onRun={onRun} />{action.children?.length ? <div className="ml-5 border-l border-[var(--school-border)] pl-2 pb-1">{action.children.map((c, i) => <DashboardAction key={c.label} action={c} index={i + 1} onRun={onRun} />)}</div> : null}</div>; }

function ModuleLanding({ module, pending, activity, onRun }: { module: Module; pending: Activity[]; activity: Activity[]; onRun: (a: Action) => void }) { return <div className="space-y-5"><div className="border-b border-[var(--school-border)] pb-5"><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{module.group}</p><h1 className="mt-2 text-3xl font-black">{module.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">{module.description}</p></div><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">Complete module tree</p><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{module.actions.map((a, i) => <DashboardAction key={a.label} action={a} index={i + 1} onRun={onRun} />)}</div></div><div className="grid gap-5 xl:grid-cols-2"><ActivityList title="Pending in system" items={pending.slice(0, 8)} empty="No pending actions." /><ActivityList title="Recent activity" items={activity.slice(0, 8)} empty="No activity records." /></div></div>; }

function ActivityList({ title, items, empty }: { title: string; items: Activity[]; empty: string }) { return <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:p-5"><p className="text-[9px] font-black uppercase theme-primary">Live records</p><h2 className="mt-1 text-lg font-black">{title}</h2><div className="mt-4">{items.length ? <div className="divide-y divide-[var(--school-border)] overflow-hidden rounded-xl border border-[var(--school-border)]">{items.map(x => <div key={x.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1.5fr_.7fr_.7fr]"><div><p className="text-xs font-black">{x.action}</p><p className="text-[9px] text-[var(--school-muted)]">{x.module}{x.detail ? ` · ${x.detail}` : ""}</p></div><p className="text-[9px] text-[var(--school-muted)]">{x.reference || "—"}</p><div><span className="rounded-full border border-[var(--school-border)] px-2 py-1 text-[8px]">{status(x.status)}</span><p className="mt-1 text-[8px] text-[var(--school-muted)]">{date(x.createdAt)}</p></div></div>)}</div> : <Empty text={empty} />}</div></section>; }
function Stat({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) { return <div className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><p className="text-[8px] font-black uppercase text-[var(--school-muted)]">{label}</p><p className={`mt-1 text-xl font-black ${primary ? "theme-primary" : ""}`}>{value}</p></div>; }
function Quick({ title, value, onClick, primary = false }: { title: string; value: string; onClick: () => void; primary?: boolean }) { return <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left ${primary ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-[var(--school-border)] bg-[var(--school-surface)]"}`}><p className="text-[9px] font-black uppercase tracking-[.12em] text-[var(--school-muted)]">{title}</p><p className="mt-2 text-sm font-black theme-primary">{value}</p></button>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[var(--school-border)] p-8 text-center text-[10px] text-[var(--school-muted)]">{text}</div>; }
function status(v?: string | null) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Updated"; }
function date(v: string) { try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)); } catch { return v; } }
