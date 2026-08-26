"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ActivityItem = {
  id: string;
  module: string;
  action: string;
  reference?: string | null;
  detail?: string | null;
  status?: string | null;
  createdAt: string;
};

type View = "overview" | "pending" | "activity" | "audit";

type Leaf = {
  label: string;
  href: string;
  keywords?: string;
};

type Branch = Leaf & { children?: Leaf[] };

type Module = {
  id: string;
  code: string;
  title: string;
  short: string;
  description: string;
  branches: Branch[];
};

const modules: Module[] = [
  {
    id: "dashboard",
    code: "01",
    title: "Dashboard",
    short: "Command Center",
    description: "Owner overview, pending work and live system activity.",
    branches: [
      { label: "Overview", href: "/admin?view=overview" },
      { label: "Pending Actions", href: "/admin?view=pending" },
      { label: "System Activity", href: "/admin?view=activity" },
    ],
  },
  {
    id: "people",
    code: "02",
    title: "People",
    short: "Students & People",
    description: "Students, parents and internal school members.",
    branches: [
      { label: "Students", href: "/admin/students" },
      { label: "Parents & Guardians", href: "/admin/parents" },
      {
        label: "Members",
        href: "/admin/members?type=staff",
        children: [
          { label: "Staff", href: "/admin/members?type=staff" },
          { label: "Teachers", href: "/admin/members?type=teacher" },
          { label: "Accounts", href: "/admin/members?type=accounts" },
          { label: "Others", href: "/admin/members?type=other" },
        ],
      },
    ],
  },
  {
    id: "hr",
    code: "03",
    title: "Human Resources",
    short: "HR",
    description: "Employee records, attendance and salary processing.",
    branches: [
      { label: "Staff & Teachers", href: "/admin/hr" },
      { label: "Attendance", href: "/admin/hr?tab=attendance" },
      { label: "Payroll", href: "/admin/hr?tab=payroll" },
      { label: "Monthly Salary Sheet", href: "/admin/hr?tab=salary" },
    ],
  },
  {
    id: "inventory",
    code: "04",
    title: "Inventory & Procurement",
    short: "Store",
    description: "Items, stock control, procurement and purchase orders.",
    branches: [
      {
        label: "Items",
        href: "/admin/inventory",
        children: [
          { label: "Add Item", href: "/admin/inventory" },
          { label: "Product Details", href: "/admin/inventory" },
        ],
      },
      {
        label: "Stock",
        href: "/admin/inventory",
        children: [
          { label: "Stock In", href: "/admin/inventory/stock-in" },
          { label: "Stock Out", href: "/admin/inventory/stock-out" },
        ],
      },
      { label: "Suppliers", href: "/admin/inventory/suppliers" },
      { label: "Inventory Persons", href: "/admin/inventory/persons" },
      { label: "Issue", href: "/admin/inventory/issue" },
      { label: "Return", href: "/admin/inventory/return" },
      { label: "Handover", href: "/admin/inventory/handover" },
      { label: "Takeover", href: "/admin/inventory/takeover" },
      {
        label: "PR",
        href: "/admin/inventory/procurement",
        children: [
          { label: "Create", href: "/admin/inventory/procurement" },
          { label: "Approval", href: "/admin/inventory/procurement" },
          { label: "History", href: "/admin/inventory/procurement" },
        ],
      },
      {
        label: "PO",
        href: "/admin/inventory/procurement",
        children: [
          { label: "Generate", href: "/admin/inventory/procurement" },
          { label: "Price Entry", href: "/admin/inventory/procurement" },
          { label: "Approval", href: "/admin/inventory/procurement" },
          { label: "Payment", href: "/admin/inventory/procurement" },
          { label: "Restock", href: "/admin/inventory/procurement" },
          { label: "History", href: "/admin/inventory/procurement" },
        ],
      },
    ],
  },
  {
    id: "service",
    code: "05",
    title: "Service Requests",
    short: "Workflow",
    description: "Request creation, approval, issue, print and history.",
    branches: [
      { label: "Create SR", href: "/admin/item-sr" },
      { label: "Approval", href: "/admin/inventory" },
      { label: "Issue", href: "/admin/inventory" },
      { label: "Print", href: "/admin/item-sr" },
      { label: "History", href: "/admin/inventory" },
    ],
  },
  {
    id: "accounts",
    code: "06",
    title: "Accounts",
    short: "Finance",
    description: "Fees, income, expenses, payments, cash, bank and reports.",
    branches: [
      { label: "Dashboard", href: "/admin/accounts" },
      { label: "Fees", href: "/admin/accounts/fees" },
      { label: "Income", href: "/admin/accounts/income" },
      { label: "Expense", href: "/admin/accounts/expense" },
      { label: "Bill Payments", href: "/admin/accounts/bill-payments" },
      { label: "PO Payments", href: "/admin/accounts/salary/payroll" },
      { label: "Cash", href: "/admin/accounts/cashbook" },
      { label: "Bank", href: "/admin/accounts/bank" },
      { label: "Journal", href: "/admin/accounts/journal" },
      { label: "Ledger", href: "/admin/accounts/ledger" },
      { label: "Reports", href: "/admin/accounts/reports" },
    ],
  },
  {
    id: "academic",
    code: "07",
    title: "Academic",
    short: "Academics",
    description: "Student academic records, results, notices and reports.",
    branches: [
      { label: "Students", href: "/admin/students" },
      { label: "Results", href: "/admin/results" },
      { label: "Notices", href: "/admin/notices" },
      { label: "Reports", href: "/admin/results/reports" },
    ],
  },
  {
    id: "access",
    code: "08",
    title: "Access Control",
    short: "Control",
    description: "Roles, permissions, portal access and audit controls.",
    branches: [
      { label: "Roles", href: "/admin/roles" },
      { label: "Permissions", href: "/admin/roles" },
      { label: "PR & PO Permissions", href: "/admin/roles/procurement" },
      { label: "Portal Management", href: "/admin/portals" },
      { label: "Audit", href: "/admin?view=audit" },
    ],
  },
];

function flattenLeaves(branches: Branch[]): Leaf[] {
  return branches.flatMap((branch) => branch.children?.length ? flattenLeaves(branch.children) : [branch]);
}

function countLeaves(module: Module) {
  return flattenLeaves(module.branches).length;
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusTone(status?: string | null) {
  const value = (status || "").toLowerCase();
  if (["pending", "submitted", "awaiting", "requested"].some((x) => value.includes(x))) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["approved", "completed", "paid", "issued", "active"].some((x) => value.includes(x))) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["rejected", "cancelled", "void"].some((x) => value.includes(x))) return "border-red-200 bg-red-50 text-red-700";
  return "border-[var(--school-border)] bg-[var(--school-background)] text-[var(--school-muted)]";
}

export default function OwnerCommandCenter({ fullName, email, roleName, activityItems }: { fullName: string | null; email: string | null; roleName: string; activityItems: ActivityItem[] }) {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({ dashboard: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  const leafCount = useMemo(() => modules.reduce((total, module) => total + countLeaves(module), 0), []);
  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.map((module) => {
      const branches = module.branches.map((branch) => {
        const children = branch.children?.filter((child) => `${child.label} ${child.keywords || ""}`.toLowerCase().includes(q));
        if (`${branch.label} ${branch.keywords || ""}`.toLowerCase().includes(q)) return branch;
        if (children?.length) return { ...branch, children };
        return null;
      }).filter(Boolean) as Branch[];
      if (`${module.title} ${module.short} ${module.description}`.toLowerCase().includes(q)) return module;
      return branches.length ? { ...module, branches } : null;
    }).filter(Boolean) as Module[];
  }, [query]);

  const pending = activityItems.filter((item) => ["pending", "submitted", "awaiting", "requested"].some((word) => (item.status || "").toLowerCase().includes(word)));
  const auditItems = activityItems.slice(0, 20);

  function setDashboardView(next: View) {
    setView(next);
    setMobileOpen(false);
    if (typeof window !== "undefined") window.history.replaceState(null, "", next === "overview" ? "/admin" : `/admin?view=${next}`);
  }

  return (
    <div className="min-h-[calc(100vh-1rem)] bg-[var(--school-background)] text-[var(--school-text)]">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1800px] overflow-hidden rounded-[28px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm">
        <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-[var(--school-border)] bg-[var(--school-surface)] transition-transform md:static md:z-auto`}>
          <div className="border-b border-[var(--school-border)] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl theme-primary-bg text-sm font-black">CT</div>
              <div className="min-w-0"><p className="truncate text-sm font-black">C.T. Model School</p><p className="text-[11px] text-[var(--school-muted)]">Super Admin / Owner</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em]"><span className="rounded-full border border-[var(--school-border)] px-2.5 py-1 theme-primary">Owner Access</span><span className="theme-primary">• Active</span></div>
          </div>
          <div className="p-4">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules, actions..." className="field w-full" aria-label="Search administration actions" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <div className="mb-2 flex items-center justify-between px-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--school-muted)]">School Product Map</p><span className="text-[10px] font-black theme-primary">{leafCount} leaves</span></div>
            <div className="space-y-1.5">
              {filteredModules.map((module) => {
                const expanded = openModules[module.id] ?? false;
                return <div key={module.id} className="rounded-2xl">
                  <button onClick={() => setOpenModules((state) => ({ ...state, [module.id]: !expanded }))} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left ${expanded ? "bg-[var(--school-primary-soft)]" : "hover:bg-[var(--school-background)]"}`}>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-[var(--school-border)] text-[9px] font-black">{module.code}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{module.title}</span><span className="block text-[9px] text-[var(--school-muted)]">{module.short} · {countLeaves(module)} leaves</span></span>
                    <span className="text-xs text-[var(--school-muted)]">{expanded ? "⌃" : "⌄"}</span>
                  </button>
                  {expanded ? <div className="ml-4 border-l border-[var(--school-border)] py-1 pl-2">
                    {module.branches.map((branch, index) => branch.children?.length ? <div key={`${module.id}-${branch.label}`} className="mb-1 rounded-xl bg-[var(--school-background)]/70">
                      <button onClick={() => setOpenModules((state) => ({ ...state, [`${module.id}:${branch.label}`]: !(state[`${module.id}:${branch.label}`] ?? true) }))} className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[10px] font-bold"><span className="text-[8px] theme-primary">{String(index + 1).padStart(2, "0")}</span><span className="flex-1">{branch.label}</span><span>{openModules[`${module.id}:${branch.label}`] ?? true ? "⌃" : "⌄"}</span></button>
                      {(openModules[`${module.id}:${branch.label}`] ?? true) ? <div className="space-y-0.5 px-2 pb-1.5 pl-6">{branch.children.map((child, childIndex) => <Link key={child.label} href={child.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] text-[var(--school-muted)] hover:bg-[var(--school-surface)] hover:theme-primary"><span className="text-[8px]">{String(childIndex + 1).padStart(2, "0")}</span><span>{child.label}</span></Link>)}</div> : null}
                    </div> : <Link key={`${module.id}-${branch.label}`} href={branch.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:theme-primary"><span className="text-[8px] theme-primary">{String(index + 1).padStart(2, "0")}</span><span>{branch.label}</span></Link>)}
                  </div> : null}
                </div>;
              })}
            </div>
          </div>
          <div className="border-t border-[var(--school-border)] p-4"><div className="rounded-2xl bg-[var(--school-background)] p-3"><p className="truncate text-xs font-black">{fullName || "School Administrator"}</p><p className="mt-0.5 truncate text-[10px] text-[var(--school-muted)]">{roleName.replace(/_/g, " ")}</p><p className="mt-1 truncate text-[9px] text-[var(--school-muted)]">{email || ""}</p></div><Link href="/admin/login" className="mt-2 block rounded-xl border border-[var(--school-border)] px-3 py-2 text-center text-[10px] font-black">Logout</Link></div>
        </aside>

        {mobileOpen ? <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/20 md:hidden" /> : null}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 backdrop-blur md:px-7">
            <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-sm md:hidden" aria-label="Open navigation">☰</button><div><p className="text-[9px] font-black uppercase tracking-[0.18em] theme-primary">{modules.find((module) => module.id === "dashboard")?.short}</p><p className="text-sm font-black">{view === "overview" ? "Dashboard" : view === "pending" ? "Pending Actions" : view === "activity" ? "System Activity" : "Audit"}</p></div></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-full border border-[var(--school-border)] px-3 py-1.5 text-[9px] font-black md:inline-flex">{leafCount} leaf actions</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--school-background)] text-[10px] font-black">{(fullName || "C").trim().charAt(0).toUpperCase()}</span></div>
          </header>

          <div className="p-4 md:p-7 xl:p-9">
            <section className="flex flex-col gap-5 border-b border-[var(--school-border)] pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div><p className="text-[9px] font-black uppercase tracking-[0.2em] theme-primary">Super Admin / Owner Command Center</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {fullName || "C.T. Model School Administrator"}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">One administration tree. Every branch ends in a real school-management action or a live owner control.</p></div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]"><div className="rounded-2xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">Modules</p><p className="mt-1 text-2xl font-black">{modules.length}</p></div><div className="rounded-2xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">Leaves</p><p className="mt-1 text-2xl font-black">{leafCount}</p></div><div className="rounded-2xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">Pending</p><p className="mt-1 text-2xl font-black">{pending.length}</p></div></div>
            </section>

            <div className="mt-6 grid gap-3 md:grid-cols-3"><button onClick={() => setDashboardView("overview")} className={`rounded-2xl border p-4 text-left ${view === "overview" ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-[var(--school-border)]"}`}><p className="text-[9px] font-black uppercase tracking-[0.14em] theme-primary">Complete Action Tree</p><p className="mt-1 text-lg font-black">{leafCount} leaf actions</p></button><button onClick={() => setDashboardView("pending")} className={`rounded-2xl border p-4 text-left ${view === "pending" ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-[var(--school-border)]"}`}><p className="text-[9px] font-black uppercase tracking-[0.14em] theme-primary">Pending Actions</p><p className="mt-1 text-lg font-black">{pending.length} records</p></button><button onClick={() => setDashboardView("activity")} className={`rounded-2xl border p-4 text-left ${view === "activity" ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-[var(--school-border)]"}`}><p className="text-[9px] font-black uppercase tracking-[0.14em] theme-primary">System Activity</p><p className="mt-1 text-lg font-black">{activityItems.length} records</p></button></div>

            {view === "overview" ? <section className="mt-6 grid gap-4 xl:grid-cols-3">
              {modules.map((module) => <article key={module.id} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] theme-primary">{module.code} · {module.short}</p><h2 className="mt-1 text-xl font-black">{module.title}</h2></div><span className="rounded-full bg-[var(--school-background)] px-2.5 py-1 text-[9px] font-black">{countLeaves(module)} leaves</span></div><p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">{module.description}</p><div className="mt-4 space-y-1.5">{module.branches.map((branch, index) => branch.children?.length ? <div key={branch.label} className="rounded-xl bg-[var(--school-background)] p-2.5"><p className="text-[10px] font-black"><span className="mr-2 theme-primary">{String(index + 1).padStart(2, "0")}</span>{branch.label}</p><div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">{branch.children.map((child, childIndex) => <Link key={child.label} href={child.href} className="rounded-lg px-2 py-1.5 text-[9px] text-[var(--school-muted)] hover:bg-[var(--school-surface)] hover:theme-primary"><span className="mr-1.5">{String(childIndex + 1).padStart(2, "0")}</span>{child.label}</Link>)}</div></div> : <Link key={branch.label} href={branch.href} className="flex items-center gap-2 rounded-xl bg-[var(--school-background)] px-2.5 py-2 text-[10px] text-[var(--school-muted)] hover:bg-[var(--school-primary-soft)] hover:theme-primary"><span className="text-[8px] theme-primary">{String(index + 1).padStart(2, "0")}</span>{branch.label}</Link>)}</div></article>)}
            </section> : null}

            {view === "pending" ? <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:p-6"><div className="mb-5"><p className="text-[9px] font-black uppercase tracking-[0.16em] theme-primary">Live Queue</p><h2 className="mt-1 text-2xl font-black">Pending Actions</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Only records currently carrying an actionable pending/submitted/requested state are shown.</p></div>{pending.length ? <div className="space-y-2">{pending.map((item) => <div key={item.id} className="grid gap-2 rounded-2xl border border-[var(--school-border)] p-4 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-black">{item.module} · {item.action}</p><p className="mt-1 text-[11px] text-[var(--school-muted)]">{item.reference || "No reference"}{item.detail ? ` · ${item.detail}` : ""}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{formatTime(item.createdAt)}</p></div><span className={`h-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${statusTone(item.status)}`}>{item.status || "pending"}</span></div>)}</div> : <div className="rounded-2xl border border-dashed border-[var(--school-border)] p-10 text-center"><p className="font-black">No pending actions</p><p className="mt-1 text-xs text-[var(--school-muted)]">The current live records do not require owner action.</p></div>}</section> : null}

            {view === "activity" || view === "audit" ? <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 sm:p-6"><div className="mb-5"><p className="text-[9px] font-black uppercase tracking-[0.16em] theme-primary">Live Records</p><h2 className="mt-1 text-2xl font-black">{view === "audit" ? "Audit" : "System Activity"}</h2><p className="mt-1 text-sm text-[var(--school-muted)]">{view === "audit" ? "Current system activity presented as the owner audit view." : "Recent activity assembled from the existing school-management records."}</p></div>{auditItems.length ? <div className="space-y-2">{auditItems.map((item) => <div key={item.id} className="grid gap-2 rounded-2xl border border-[var(--school-border)] p-4 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-black">{item.module} · {item.action}</p><p className="mt-1 text-[11px] text-[var(--school-muted)]">{item.reference || "No reference"}{item.detail ? ` · ${item.detail}` : ""}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{formatTime(item.createdAt)}</p></div><span className={`h-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${statusTone(item.status)}`}>{item.status || "recorded"}</span></div>)}</div> : <div className="rounded-2xl border border-dashed border-[var(--school-border)] p-10 text-center"><p className="font-black">No recent activity</p><p className="mt-1 text-xs text-[var(--school-muted)]">There are no recent records available to display.</p></div>}</section> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
