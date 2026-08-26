"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type ActivityItem = {
  id: string;
  module: string;
  action: string;
  reference?: string | null;
  detail?: string | null;
  status?: string | null;
  createdAt: string;
};

type TreeItem = {
  label: string;
  href?: string;
  description?: string;
  children?: TreeItem[];
};

type TreeModule = {
  code: string;
  title: string;
  description: string;
  items: TreeItem[];
};

const T = (label: string, href?: string, description?: string, children?: TreeItem[]): TreeItem => ({ label, href, description, children });

const TREE: TreeModule[] = [
  {
    code: "01",
    title: "Dashboard",
    description: "School administration overview and live operational activity.",
    items: [
      T("Overview", "/admin"),
      T("Pending Actions", "/admin"),
      T("System Activity", "/admin"),
    ],
  },
  {
    code: "02",
    title: "People",
    description: "Existing school people records and identity management.",
    items: [
      T("Students", "/admin/students", "Use the existing Students Admin page exactly as it is."),
      T("Parents & Guardians", "/admin/parents"),
      T("Members", "/admin/members", undefined, [
        T("Staff", "/admin/members?type=staff"),
        T("Teachers", "/admin/members?type=teacher"),
        T("Accounts", "/admin/members?type=accounts"),
        T("Others", "/admin/members?type=other"),
      ]),
    ],
  },
  {
    code: "03",
    title: "Human Resources",
    description: "Existing staff and teacher operations, attendance and salary workflow.",
    items: [
      T("Staff & Teachers", "/admin/hr"),
      T("Attendance", "/admin/hr?section=attendance"),
      T("Payroll", "/admin/hr?section=payroll"),
      T("Monthly Salary Sheet", "/admin/hr?section=salary"),
    ],
  },
  {
    code: "04",
    title: "Inventory & Procurement",
    description: "Existing school store, item master, stock, issue, return and procurement workflow.",
    items: [
      T("Items", "/admin/inventory"),
      T("Product Master", "/admin/inventory/products", undefined, [
        T("Products", "/admin/inventory/products"),
        T("Categories", "/admin/inventory/products/categories"),
      ]),
      T("Stock", "/admin/inventory", undefined, [
        T("Stock In", "/admin/inventory/stock-in"),
        T("Stock Out", "/admin/inventory/stock-out"),
      ]),
      T("Inventory Persons", "/admin/inventory/persons"),
      T("Issue", "/admin/inventory/issue"),
      T("Return", "/admin/inventory/returns"),
      T("Handover", "/admin/inventory/handover"),
      T("Takeover", "/admin/inventory/takeover"),
      T("Procurement", "/admin/inventory/procurement", undefined, [
        T("Purchase Request", "/admin/inventory/procurement?tab=pr"),
        T("PR Approval", "/admin/inventory/procurement?tab=pr&action=approval"),
        T("PR History", "/admin/inventory/procurement?tab=pr&action=history"),
        T("Purchase Order", "/admin/inventory/procurement?tab=po"),
        T("PO Price Entry", "/admin/inventory/procurement?tab=po&action=price"),
        T("PO Approval", "/admin/inventory/procurement?tab=po&action=approval"),
        T("PO History", "/admin/inventory/procurement?tab=po&action=history"),
      ]),
      T("Reports", "/admin/inventory/reports", undefined, [
        T("Stock", "/admin/inventory/reports/stock"),
        T("Issued", "/admin/inventory/reports/issued"),
        T("Returned", "/admin/inventory/reports/returned"),
        T("Outstanding", "/admin/inventory/reports/outstanding"),
        T("Handover", "/admin/inventory/reports/handover"),
        T("Takeover", "/admin/inventory/reports/takeover"),
        T("History", "/admin/inventory/reports/history"),
      ]),
    ],
  },
  {
    code: "05",
    title: "Item Service Request",
    description: "Existing Item SR workflow from request through approval, issue, print and history.",
    items: [
      T("Create SR", "/admin/item-sr?section=create"),
      T("Approval", "/admin/item-sr?section=approval"),
      T("Issue", "/admin/item-sr?section=issue"),
      T("Print", "/admin/item-sr?section=print"),
      T("History", "/admin/item-sr?section=history"),
    ],
  },
  {
    code: "06",
    title: "Accounts",
    description: "Existing school financial operations and accounting records.",
    items: [
      T("Dashboard", "/admin/accounts"),
      T("Fees", "/admin/accounts/fees", undefined, [
        T("Fee Structure", "/admin/accounts/fees/structure"),
        T("Fee Collection", "/admin/accounts/fees/collection"),
        T("Dues", "/admin/accounts/fees/dues"),
      ]),
      T("Income", "/admin/accounts/income"),
      T("Expense", "/admin/accounts/expense"),
      T("Bill Payments", "/admin/accounts?section=bill-payments"),
      T("Salary", "/admin/accounts/salary", undefined, [
        T("Salary Processing", "/admin/accounts/salary/payroll"),
      ]),
      T("Cash Book", "/admin/accounts/cashbook"),
      T("Bank", "/admin/accounts/bank"),
      T("Vouchers", "/admin/accounts/vouchers"),
      T("Journal", "/admin/accounts/journal"),
      T("Ledger", "/admin/accounts/ledger"),
      T("Reports", "/admin/accounts/reports", undefined, [
        T("Fee Collection", "/admin/accounts/reports/fee-collection"),
        T("Financial Summary", "/admin/accounts/reports/financial-summary"),
        T("Income & Expense", "/admin/accounts/reports/income-expense"),
        T("Outstanding", "/admin/accounts/reports/outstanding"),
        T("Salary", "/admin/accounts/reports/salary"),
      ]),
    ],
  },
  {
    code: "07",
    title: "Academic",
    description: "Existing academic records, results and school notices.",
    items: [
      T("Students", "/admin/students"),
      T("Results", "/admin/results", undefined, [
        T("Result Entry", "/admin/results/entry"),
        T("Reports", "/admin/results/reports"),
      ]),
      T("Notices", "/admin/notices"),
    ],
  },
  {
    code: "08",
    title: "Access & Settings",
    description: "Existing school permissions, portals and administrative settings.",
    items: [
      T("Roles & Permissions", "/admin/roles"),
      T("PR & PO Permissions", "/admin/roles/procurement"),
      T("Portal Management", "/admin/portals"),
      T("School Settings", "/admin/settings"),
    ],
  },
];

function countLeaves(items: TreeItem[]): number {
  return items.reduce((total, item) => total + (item.children?.length ? countLeaves(item.children) : 1), 0);
}

const TOTAL_LEAVES = TREE.reduce((total, module) => total + countLeaves(module.items), 0);

export default function SuperAdminDashboard({ fullName, email, activityItems = [] }: { fullName?: string | null; email?: string | null; roleName?: string; activityItems?: ActivityItem[] }) {
  const [query, setQuery] = useState("");
  const name = fullName || email || "Administrator";
  const pending = activityItems.filter((item) => ["pending", "awaiting_approval", "submitted", "under_review", "pending_approval"].includes((item.status || "").toLowerCase()));
  const filtered = useMemo(() => filterTree(TREE, query), [query]);

  return (
    <AdminPageShell
      eyebrow="Administration"
      title="Admin Dashboard"
      description="A complete school-management action tree built from the existing C.T. Model School Admin pages. No separate ERP/Oracle interface is used."
    >
      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] theme-primary">Super Admin / Owner</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Welcome, {name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">The tree below is only a navigation layer. Each leaf opens the existing school-management page and its existing Supabase workflow.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <Stat label="Modules" value={String(TREE.length)} />
            <Stat label="Leaf Actions" value={String(TOTAL_LEAVES)} />
            <Stat label="Pending" value={String(pending.length)} primary />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search existing modules and actions…" className="min-w-0 flex-1 rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-4 py-3 text-xs font-semibold outline-none focus:border-[var(--school-primary-border)]" />
          <Link href="/admin/students" className="rounded-xl px-4 py-3 text-xs font-black theme-primary-bg">Open Students</Link>
        </div>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((module) => <ModuleCard key={module.code} module={module} />)}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">Pending Actions</p>
          <h3 className="mt-1 text-lg font-black">{pending.length} records</h3>
          {pending.length ? <div className="mt-4 space-y-2">{pending.slice(0, 5).map((item) => <div key={item.id} className="rounded-xl bg-[var(--school-background)] p-3"><p className="text-xs font-black">{item.action}</p><p className="mt-1 text-[9px] text-[var(--school-muted)]">{item.module} · {item.reference || "No reference"}</p></div>)}</div> : <p className="mt-3 text-xs text-[var(--school-muted)]">No pending records right now.</p>}
        </div>
        <div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">System Activity</p>
          <h3 className="mt-1 text-lg font-black">{activityItems.length} recent records</h3>
          {activityItems.length ? <div className="mt-4 space-y-2">{activityItems.slice(0, 5).map((item) => <div key={item.id} className="rounded-xl bg-[var(--school-background)] p-3"><p className="text-xs font-black">{item.action}</p><p className="mt-1 text-[9px] text-[var(--school-muted)]">{item.module} · {item.reference || "No reference"}</p></div>)}</div> : <p className="mt-3 text-xs text-[var(--school-muted)]">No recent activity records found.</p>}
        </div>
      </section>
    </AdminPageShell>
  );
}

function filterTree(modules: TreeModule[], query: string): TreeModule[] {
  const q = query.trim().toLowerCase();
  if (!q) return modules;
  const filterItems = (items: TreeItem[]): TreeItem[] => items.map((item) => {
    const children = item.children ? filterItems(item.children) : [];
    const match = `${item.label} ${item.description || ""}`.toLowerCase().includes(q);
    return match || children.length ? { ...item, children: children.length ? children : item.children } : null;
  }).filter(Boolean) as TreeItem[];
  return modules.map((module) => ({ ...module, items: filterItems(module.items) })).filter((module) => module.items.length || module.title.toLowerCase().includes(q) || module.description.toLowerCase().includes(q));
}

function ModuleCard({ module }: { module: TreeModule }) {
  return <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] theme-primary">{module.code} · School Management</p><h3 className="mt-1 text-xl font-black">{module.title}</h3></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[8px] font-black theme-primary">{countLeaves(module.items)} leaves</span></div><p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">{module.description}</p><div className="mt-4 space-y-1.5">{module.items.map((item, index) => <TreeRow key={`${module.code}-${item.label}`} item={item} index={index + 1} />)}</div></section>;
}

function TreeRow({ item, index }: { item: TreeItem; index: number }) {
  const [open, setOpen] = useState(true);
  const branch = !!item.children?.length;
  const content = <><span className="w-6 shrink-0 text-[8px] font-black text-[var(--school-muted)]">{String(index).padStart(2, "0")}</span><span className="truncate">{item.label}</span></>;
  return <div><div className="flex items-center rounded-xl bg-[var(--school-background)]">{item.href && !branch ? <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-[10px] font-semibold text-[var(--school-text)] hover:theme-primary">{content}</Link> : <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-[10px] font-bold">{content}</button>}{branch ? <button type="button" onClick={() => setOpen((value) => !value)} className={`mr-2 rounded-md px-1.5 text-[10px] text-[var(--school-muted)] ${open ? "rotate-180" : ""}`} aria-label={`Toggle ${item.label}`}>⌄</button> : null}</div>{branch && open ? <div className="ml-4 border-l border-[var(--school-border)] pl-2 pt-1">{item.children!.map((child, childIndex) => <TreeRow key={`${item.label}-${child.label}`} item={child} index={childIndex + 1} />)}</div> : null}</div>;
}

function Stat({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return <div className="rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] p-3"><p className="text-[8px] font-black uppercase tracking-[.1em] text-[var(--school-muted)]">{label}</p><p className={`mt-1 text-xl font-black ${primary ? "theme-primary" : ""}`}>{value}</p></div>;
}
