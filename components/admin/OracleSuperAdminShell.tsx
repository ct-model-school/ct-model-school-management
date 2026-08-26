"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Activity = { id: string; module: string; action: string; reference?: string | null; detail?: string | null; status?: string | null; createdAt: string };
type Action = { label: string; href?: string; description?: string; children?: Action[]; kind?: "pending" | "activity" };
type Module = { id: string; title: string; code: string; group: string; description: string; actions: Action[] };

const A = (label: string, href?: string, description?: string, children?: Action[], kind?: Action["kind"]): Action => ({ label, href, description, children, kind });

// School-management-only product map. Branches organize work; leaves open the real working UI.
const MODULES: Module[] = [
  { id: "dashboard", title: "Dashboard", code: "01", group: "Dashboard", description: "Owner command center for overview, pending work and live system activity.", actions: [
    A("Overview", "/admin", "Live school administration overview."),
    A("Pending Actions", undefined, "Records that currently require owner attention.", undefined, "pending"),
    A("System Activity", undefined, "Live activity from existing school records.", undefined, "activity"),
  ]},
  { id: "people", title: "People", code: "02", group: "People", description: "Students, parents and internal school members.", actions: [
    A("Students", "/admin/students", "Student directory and administration."),
    A("Parents & Guardians", "/admin/parents", "Parent and guardian accounts, bindings and approvals."),
    A("Members", undefined, "Internal school members.", [
      A("Staff", "/admin/members?type=staff", "Staff members only."),
      A("Teachers", "/admin/members?type=teacher", "Teacher members only."),
      A("Accounts", "/admin/members?type=accounts", "Accounts members only."),
      A("Others", "/admin/members?type=other", "Other internal members only."),
    ]),
  ]},
  { id: "hr", title: "Human Resources", code: "03", group: "HR", description: "Staff and teacher operations, attendance and salary processing.", actions: [
    A("Staff & Teachers", "/admin/hr", "Live staff and teacher records."),
    A("Attendance", "/admin/hr?section=attendance", "Attendance entry, review and status."),
    A("Payroll", "/admin/hr?section=payroll", "Payroll calculation and processing."),
    A("Monthly Salary Sheet", "/admin/hr?section=salary", "Monthly salary sheet preparation and review."),
  ]},
  { id: "inventory", title: "Inventory & Procurement", code: "04", group: "Store", description: "School store, stock movement, procurement requests and purchase orders.", actions: [
    A("Items", undefined, "Inventory item master.", [
      A("Add Item", "/admin/inventory", "Create or edit inventory items."),
    ]),
    A("Stock", undefined, "Stock movement.", [
      A("Stock In", "/admin/inventory/stock-in", "Receive stock into the school store."),
      A("Stock Out", "/admin/inventory/stock-out", "Record stock leaving the store."),
    ]),
    A("Suppliers", "/admin/inventory/suppliers", "Supplier records."),
    A("Inventory Persons", "/admin/inventory/persons", "Persons responsible for inventory."),
    A("Issue", "/admin/inventory/issue", "Issue inventory to an authorized person."),
    A("Return", undefined, "Return workflow.", [
      A("Return Records", "/admin/inventory/returns", "Review inventory return records."),
    ]),
    A("Handover", "/admin/inventory/handover", "Handover inventory responsibility."),
    A("Takeover", "/admin/inventory/takeover", "Take over inventory responsibility."),
    A("PR", undefined, "Purchase request lifecycle.", [
      A("Create", "/admin/inventory/procurement?tab=pr&action=create", "Create a purchase request."),
      A("Approval", "/admin/inventory/procurement?tab=pr&action=approval", "Approve or reject purchase requests."),
      A("History", "/admin/inventory/procurement?tab=pr&action=history", "Review purchase request history."),
    ]),
    A("PO", undefined, "Purchase order lifecycle.", [
      A("Generate", "/admin/inventory/procurement?tab=po&action=generate", "Generate a purchase order."),
      A("Price Entry", "/admin/inventory/procurement?tab=po&action=price", "Enter purchase order pricing."),
      A("Approval", "/admin/inventory/procurement?tab=po&action=approval", "Approve or reject purchase orders."),
      A("Payment", "/admin/accounts?section=po-payments", "Process purchase order payments."),
      A("Restock", "/admin/inventory/stock-in?source=po", "Receive purchase order stock."),
      A("History", "/admin/inventory/procurement?tab=po&action=history", "Review purchase order history."),
    ]),
  ]},
  { id: "sr", title: "Service Requests", code: "05", group: "Workflow", description: "Complete service request lifecycle from creation through print and history.", actions: [
    A("Create SR", "/admin/item-sr?section=create", "Create a service request."),
    A("Approval", "/admin/item-sr?section=approval", "Review and approve service requests."),
    A("Issue", "/admin/item-sr?section=issue", "Process approved service requests."),
    A("Print", "/admin/item-sr?section=print", "Print service request documents."),
    A("History", "/admin/item-sr?section=history", "Review service request history."),
  ]},
  { id: "accounts", title: "Accounts", code: "06", group: "Finance", description: "School financial operations, payments, books and reports.", actions: [
    A("Dashboard", "/admin/accounts", "Accounts overview."),
    A("Fees", "/admin/accounts/fees", "Student fee operations."),
    A("Income", "/admin/accounts/income", "Income records and entry."),
    A("Expense", "/admin/accounts/expense", "Expense records and entry."),
    A("Bill Payments", "/admin/accounts?section=bill-payments", "Process school bill payments."),
    A("PO Payments", "/admin/accounts?section=po-payments", "Process purchase order payments."),
    A("Cash", "/admin/accounts/cashbook", "Cash book."),
    A("Bank", "/admin/accounts/bank", "Bank transactions."),
    A("Journal", "/admin/accounts/journal", "Journal entries."),
    A("Ledger", "/admin/accounts/ledger", "Ledger records."),
    A("Reports", "/admin/accounts/reports", "School financial reports."),
  ]},
  { id: "academic", title: "Academic", code: "07", group: "School", description: "Student academic records, results, notices and reports.", actions: [
    A("Students", "/admin/students", "Academic student records."),
    A("Results", "/admin/results", "Result entry and result administration."),
    A("Notices", "/admin/notices", "Create, manage and publish school notices."),
    A("Reports", "/admin/results/reports", "Academic and result reports."),
  ]},
  { id: "access", title: "Access Control", code: "08", group: "Control", description: "School roles, permissions, portals and audit controls.", actions: [
    A("Roles", "/admin/roles", "Manage school roles."),
    A("Permissions", "/admin/roles", "Manage user permissions."),
    A("PR & PO Permissions", "/admin/roles/procurement", "Manage procurement permissions."),
    A("Portal Management", "/admin/portals", "Manage school portals."),
    A("Audit", undefined, "Review owner-level system activity and audit records.", undefined, "activity"),
  ]},
];

const PENDING = ["pending", "due", "partially_issued", "awaiting_approval", "submitted", "under_review", "pending_approval"];
const leaves = (actions: Action[]): Action[] => actions.flatMap((a) => (a.children?.length ? leaves(a.children) : [a]));
const leafCount = (module: Module) => leaves(module.actions).length;
const totalLeaves = MODULES.reduce((n, m) => n + leafCount(m), 0);

export default function OracleSuperAdminShell({ fullName, email, roleName, activityItems = [] }: { fullName?: string | null; email?: string | null; roleName: string; activityItems?: Activity[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>(MODULES.map((m) => m.id));
  const [view, setView] = useState<"tree" | "pending" | "activity">("tree");
  const [activityQuery, setActivityQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const name = fullName || email || "Super Admin";
  const role = roleName.replace(/_/g, " ");
  const pending = activityItems.filter((x) => PENDING.includes((x.status || "").toLowerCase()));
  const activity = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    if (!q) return activityItems;
    return activityItems.filter((x) => `${x.module} ${x.action} ${x.reference || ""} ${x.detail || ""} ${x.status || ""}`.toLowerCase().includes(q));
  }, [activityItems, activityQuery]);
  const filtered = useMemo(() => filterModules(search), [search]);
  const current = MODULES.find((m) => m.id === selected) || MODULES[0];

  const toggleModule = (id: string) => setExpanded((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const selectModule = (id: string) => { setSelected(id); setView("tree"); if (!expanded.includes(id)) setExpanded((v) => [...v, id]); };
  const refresh = () => router.refresh();
  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.href = "/loginportal"; }
  };
  const exportActivity = () => {
    const rows = activity.map((x) => [x.createdAt, x.module, x.action, x.reference || "", x.status || "", x.detail || ""]);
    const csv = [["Date", "Module", "Action", "Reference", "Status", "Detail"], ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `school-system-activity-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-[1780px]">
      <div className="overflow-hidden rounded-[24px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm lg:grid lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="flex max-h-[calc(100vh-4rem)] min-h-[760px] flex-col border-b border-[var(--school-border)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--school-border)] p-5">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl theme-primary-bg text-xs font-black">CT</div><div><p className="text-xs font-black">C.T. Model School</p><p className="text-[9px] font-semibold text-[var(--school-muted)]">Super Admin / Owner</p></div></div>
            <div className="mt-4 flex items-center justify-between"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black uppercase theme-primary">Owner access</span><span className="text-[9px] font-bold text-[var(--school-muted)]">● Active</span></div>
          </div>
          <div className="border-b border-[var(--school-border)] p-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search modules, actions…" className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2.5 text-[10px] font-semibold outline-none" /></div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between px-2"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--school-muted)]">School product map</p><span className="text-[9px] font-black theme-primary">{totalLeaves} leaves</span></div>
            <nav className="space-y-1">{filtered.map((m) => <ModuleNode key={m.id} module={m} active={selected === m.id} expanded={expanded.includes(m.id)} onSelect={() => selectModule(m.id)} onToggle={() => toggleModule(m.id)} onSpecial={(kind) => setView(kind)} />)}</nav>
          </div>
          <div className="border-t border-[var(--school-border)] p-3"><div className="rounded-xl bg-[var(--school-background)] p-3"><p className="truncate text-[10px] font-black">{name}</p><p className="mt-0.5 truncate text-[8px] font-bold capitalize theme-primary">{role}</p><button type="button" onClick={logout} disabled={busy} className="mt-3 w-full rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2 text-[9px] font-black theme-primary">{busy ? "Logging out…" : "Logout"}</button></div></div>
        </aside>

        <main className="min-w-0 bg-[var(--school-background)]">
          <header className="sticky top-0 z-30 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{current.group}</p><p className="text-sm font-black">{current.title}</p></div><div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full border border-[var(--school-border)] px-3 py-1.5 text-[9px] font-bold text-[var(--school-muted)] sm:inline-flex">{totalLeaves} leaf actions</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--school-primary-soft)] text-[10px] font-black theme-primary">{name.slice(0, 1).toUpperCase()}</span></div></div></header>
          <div className="p-4 sm:p-6 lg:p-8">
            {selected === "dashboard" ? <Dashboard view={view} setView={setView} name={name} pending={pending} activity={activity} modules={filtered} query={activityQuery} setQuery={setActivityQuery} onRefresh={refresh} onExport={exportActivity} onSelect={selectModule} onSpecial={setView} /> : <ModuleLanding module={current} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function filterModules(query: string): Module[] {
  const q = query.trim().toLowerCase();
  if (!q) return MODULES;
  const match = (a: Action): boolean => `${a.label} ${a.description || ""}`.toLowerCase().includes(q) || !!a.children?.some(match);
  return MODULES.map((m) => ({ ...m, actions: m.actions.filter(match) })).filter((m) => m.actions.length || `${m.title} ${m.group}`.toLowerCase().includes(q));
}

function ModuleNode({ module, active, expanded, onSelect, onToggle, onSpecial }: { module: Module; active: boolean; expanded: boolean; onSelect: () => void; onToggle: () => void; onSpecial: (kind: "pending" | "activity") => void }) {
  return <div>
    <div className={`flex items-center gap-1 rounded-xl border px-2 py-1.5 ${active ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-transparent hover:bg-[var(--school-background)]"}`}>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8px] font-black ${active ? "bg-[var(--school-surface)] theme-primary" : "bg-[var(--school-background)] text-[var(--school-muted)]"}`}>{module.code}</span><span className="min-w-0 flex-1"><b className={`block truncate text-[10px] ${active ? "theme-primary" : ""}`}>{module.title}</b><small className="block text-[8px] text-[var(--school-muted)]">{module.group} · {leafCount(module)} leaves</small></span></button>
      <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${module.title}`} onClick={onToggle} className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] text-[var(--school-muted)] transition ${expanded ? "rotate-180" : ""}`}>⌄</button>
    </div>
    {expanded && <div className="ml-7 mt-1 border-l border-[var(--school-border)] pl-2">{module.actions.map((a, i) => <TreeAction key={`${module.id}-${a.label}`} action={a} index={i + 1} onSpecial={onSpecial} />)}</div>}
  </div>;
}

function TreeAction({ action, index, onSpecial }: { action: Action; index: number; onSpecial: (kind: "pending" | "activity") => void }) {
  const [open, setOpen] = useState(true);
  const branch = !!action.children?.length;
  const content = <><span className="w-6 shrink-0 text-[7px] font-black text-[var(--school-muted)]">{String(index).padStart(2, "0")}</span><span className="truncate">{action.label}</span></>;
  return <div className="mb-0.5">
    <div className="flex items-center gap-1">
      {branch ? <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-left text-[8px] font-bold text-[var(--school-text)] hover:bg-[var(--school-background)]">{content}</button> : action.kind ? <button type="button" onClick={() => onSpecial(action.kind!)} className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-left text-[8px] font-bold theme-primary hover:bg-[var(--school-background)]">{content}</button> : <Link href={action.href || "/admin"} className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-left text-[8px] font-semibold text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:theme-primary">{content}</Link>}
      {branch && <button type="button" aria-label={`Toggle ${action.label}`} onClick={() => setOpen((v) => !v)} className={`shrink-0 rounded-md px-1 text-[9px] text-[var(--school-muted)] ${open ? "rotate-180" : ""}`}>⌄</button>}
    </div>
    {branch && open && <div className="ml-4 border-l border-[var(--school-border)] pl-2">{action.children!.map((c, i) => <TreeAction key={`${action.label}-${c.label}`} action={c} index={i + 1} onSpecial={onSpecial} />)}</div>}
  </div>;
}

function Dashboard({ view, setView, name, pending, activity, modules, query, setQuery, onRefresh, onExport, onSelect, onSpecial }: { view: "tree" | "pending" | "activity"; setView: (v: "tree" | "pending" | "activity") => void; name: string; pending: Activity[]; activity: Activity[]; modules: Module[]; query: string; setQuery: (v: string) => void; onRefresh: () => void; onExport: () => void; onSelect: (id: string) => void; onSpecial: (v: "pending" | "activity") => void }) {
  return <div className="space-y-6">
    <section className="flex flex-col gap-4 border-b border-[var(--school-border)] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] theme-primary">Super Admin / Owner Command Center</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">A complete school-management product map. Every branch ends in a real action or a live owner control.</p></div><div className="grid grid-cols-3 gap-2 sm:w-[390px]"><Stat label="Modules" value={String(MODULES.length)} /><Stat label="Leaf Actions" value={String(totalLeaves)} /><Stat label="Pending" value={String(pending.length)} primary /></div></section>
    <section className="grid gap-3 md:grid-cols-3"><Quick title="Complete Action Tree" value={`${totalLeaves} leaf actions`} onClick={() => setView("tree")} primary /><Quick title="Pending Actions" value={`${pending.length} records`} onClick={() => { setView("pending"); onSpecial("pending"); }} /><Quick title="System Activity" value={`${activity.length} records`} onClick={() => { setView("activity"); onSpecial("activity"); }} /></section>
    {view === "tree" && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map((m) => <ModuleCard key={m.id} module={m} onSelect={() => onSelect(m.id)} onSpecial={onSpecial} />)}</div>}
    {view === "pending" && <ActivityList title="Pending Actions" items={pending} empty="No pending actions." />}
    {view === "activity" && <section className="space-y-4"><div className="flex flex-col gap-3 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:flex-row sm:items-center"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search system activity…" className="min-w-0 flex-1 rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2.5 text-xs font-semibold outline-none" /><button type="button" onClick={onRefresh} className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-[9px] font-black theme-primary">Refresh</button><button type="button" onClick={onExport} className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-[9px] font-black theme-primary">Export CSV</button></div><ActivityList title="System Activity" items={activity} empty="No activity records found." /></section>}
  </div>;
}

function ModuleCard({ module, onSelect, onSpecial }: { module: Module; onSelect: () => void; onSpecial: (v: "pending" | "activity") => void }) {
  return <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><button type="button" onClick={onSelect} className="text-left"><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">{module.code} · {module.group}</p><h3 className="mt-1 text-base font-black">{module.title}</h3></button><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[8px] font-black theme-primary">{leafCount(module)} leaves</span></div><p className="mt-2 text-[10px] leading-5 text-[var(--school-muted)]">{module.description}</p><div className="mt-4 space-y-1">{module.actions.map((a, i) => <DashboardAction key={a.label} action={a} index={i + 1} onSpecial={onSpecial} />)}</div></section>;
}

function DashboardAction({ action, index, onSpecial }: { action: Action; index: number; onSpecial: (v: "pending" | "activity") => void }) {
  const [open, setOpen] = useState(true);
  const branch = !!action.children?.length;
  const body = <><span className="w-6 shrink-0 text-[7px] font-black text-[var(--school-muted)]">{String(index).padStart(2, "0")}</span><span className="truncate">{action.label}</span></>;
  return <div className="rounded-lg bg-[var(--school-background)]"><div className="flex items-center">{branch ? <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1 px-2 py-2 text-left text-[9px] font-bold">{body}</button> : action.kind ? <button type="button" onClick={() => onSpecial(action.kind!)} className="flex min-w-0 flex-1 items-center gap-1 px-2 py-2 text-left text-[9px] font-bold theme-primary">{body}</button> : <Link href={action.href || "/admin"} className="flex min-w-0 flex-1 items-center gap-1 px-2 py-2 text-left text-[9px] font-semibold text-[var(--school-muted)] hover:theme-primary">{body}</Link>}{branch && <button type="button" onClick={() => setOpen((v) => !v)} className={`px-2 text-[9px] text-[var(--school-muted)] ${open ? "rotate-180" : ""}`}>⌄</button>}</div>{branch && open && <div className="ml-5 border-l border-[var(--school-border)] pl-2 pb-1">{action.children!.map((c, i) => <DashboardAction key={c.label} action={c} index={i + 1} onSpecial={onSpecial} />)}</div>}</div>;
}

function ModuleLanding({ module }: { module: Module }) {
  return <div className="space-y-5"><div className="border-b border-[var(--school-border)] pb-5"><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{module.group}</p><h1 className="mt-2 text-3xl font-black">{module.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">{module.description}</p></div><section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">Work areas</p><span className="text-[9px] font-black text-[var(--school-muted)]">{leafCount(module)} leaves</span></div><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{module.actions.map((a, i) => <DashboardAction key={a.label} action={a} index={i + 1} onSpecial={() => undefined} />)}</div></section></div>;
}

function ActivityList({ title, items, empty }: { title: string; items: Activity[]; empty: string }) {
  return <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:p-5"><p className="text-[9px] font-black uppercase theme-primary">Live records</p><h2 className="mt-1 text-lg font-black">{title}</h2><div className="mt-4">{items.length ? <div className="divide-y divide-[var(--school-border)] overflow-hidden rounded-xl border border-[var(--school-border)]">{items.map((x) => <div key={x.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1.5fr_.7fr_.7fr]"><div><p className="text-xs font-black">{x.action}</p><p className="text-[9px] text-[var(--school-muted)]">{x.module}{x.detail ? ` · ${x.detail}` : ""}</p></div><p className="text-[9px] text-[var(--school-muted)]">{x.reference || "—"}</p><div><span className="rounded-full border border-[var(--school-border)] px-2 py-1 text-[8px]">{status(x.status)}</span><p className="mt-1 text-[8px] text-[var(--school-muted)]">{date(x.createdAt)}</p></div></div>)}</div> : <Empty text={empty} />}</div></section>;
}

function Stat({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) { return <div className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><p className="text-[8px] font-black uppercase text-[var(--school-muted)]">{label}</p><p className={`mt-1 text-xl font-black ${primary ? "theme-primary" : ""}`}>{value}</p></div>; }
function Quick({ title, value, onClick, primary = false }: { title: string; value: string; onClick: () => void; primary?: boolean }) { return <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left ${primary ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-[var(--school-border)] bg-[var(--school-surface)]"}`}><p className="text-[9px] font-black uppercase tracking-[.12em] text-[var(--school-muted)]">{title}</p><p className="mt-2 text-sm font-black theme-primary">{value}</p></button>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[var(--school-border)] p-8 text-center text-[10px] text-[var(--school-muted)]">{text}</div>; }
function status(v?: string | null) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Updated"; }
function date(v: string) { try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)); } catch { return v; } }
