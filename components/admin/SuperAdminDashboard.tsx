"use client";

import { useState } from "react";

type Module = { id: string; title: string; eyebrow: string; description: string; stage: number; sections: string[] };
type ActivityItem = { id: string; module: string; action: string; reference?: string | null; detail?: string | null; status?: string | null; createdAt: string };

const modules: Module[] = [
  { id: "dashboard", title: "Dashboard", eyebrow: "Overview", description: "Super Admin overview and system status.", stage: 1, sections: ["Overview", "System Activity", "Pending Actions"] },
  { id: "parents", title: "Parents & Guardians", eyebrow: "People", description: "Parent accounts, child binding, approvals and parent records.", stage: 2, sections: ["Parent Accounts", "Child Binding", "Approvals", "Parent Records"] },
  { id: "hr", title: "Human Resources", eyebrow: "HR", description: "Teacher and staff attendance, salary sheets and HR operations.", stage: 3, sections: ["Staff & Teachers", "Attendance", "Payroll", "Monthly Salary Sheet"] },
  { id: "inventory", title: "Inventory", eyebrow: "Store", description: "Items, stock, service requests and inventory operations.", stage: 4, sections: ["Add Items", "Items", "Issue SR", "SR", "Stock History"] },
  { id: "item-sr", title: "Item Service Request", eyebrow: "Workflow", description: "SR review, approval, issue and request history.", stage: 5, sections: ["My SR", "Awaiting Approval", "Approved SR", "Issued SR", "SR History"] },
  { id: "accounts", title: "Accounts", eyebrow: "Finance", description: "Fees, payroll settlement, bills, vouchers and financial records.", stage: 6, sections: ["Dashboard", "Ledger", "Bill Payments", "PO Payments", "Payroll", "Reports"] },
  { id: "settings", title: "Access & Settings", eyebrow: "Control", description: "Roles, permissions, system settings and administrative controls.", stage: 7, sections: ["Role Management", "Permission Builder", "PR & PO Permissions", "System Settings", "Audit & Activity"] },
];

function StatusDot({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-bold text-[var(--school-muted)]"><span className="h-1.5 w-1.5 rounded-full theme-primary-bg" />{label}</span>;
}

function formatStatus(status?: string | null) {
  if (!status) return "Updated";
  return status.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" }).format(date);
}

function actionTarget(item: ActivityItem) {
  if (item.module === "Accounts") return "/admin/accounts";
  if (item.module === "Inventory" || item.module === "Item Service Request") return "/admin/item-sr";
  if (item.module === "Parents & Guardians") return "/admin/parents";
  if (item.module === "Student Registration") return "/admin/people";
  return "/admin";
}

function isPending(item: ActivityItem) {
  const status = (item.status || "").toLowerCase();
  return ["pending", "due", "partially_issued", "awaiting_approval", "submitted", "under_review", "pending_approval"].includes(status);
}

export default function SuperAdminDashboard({ fullName, email, roleName, activityItems = [] }: { fullName?: string | null; email?: string | null; roleName: string; activityItems?: ActivityItem[] }) {
  const [selected, setSelected] = useState("dashboard");
  const [openModule, setOpenModule] = useState<string | null>("dashboard");
  const [selectedSection, setSelectedSection] = useState("Overview");
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = fullName || email || "Super Admin";
  const roleLabel = roleName.replace(/_/g, " ");
  const selectedModule = modules.find(module => module.id === selected) || modules[0];
  const isDashboardOverview = selectedModule.id === "dashboard" && selectedSection === "Overview";
  const isSystemActivity = selectedModule.id === "dashboard" && selectedSection === "System Activity";
  const isPendingActions = selectedModule.id === "dashboard" && selectedSection === "Pending Actions";
  const pendingItems = activityItems.filter(isPending);

  const handleModuleClick = (module: Module) => { setSelected(module.id); setOpenModule(module.id); setSelectedSection(module.sections[0]); };
  const handleSectionClick = (module: Module, section: string) => { setSelected(module.id); setOpenModule(module.id); setSelectedSection(section); };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { window.location.href = "https://ct-model-school-management.vercel.app/loginportal"; }
  };

  return (
    <div className="mx-auto w-full max-w-[1550px]">
      <div className="grid min-h-[calc(100vh-7rem)] grid-cols-1 overflow-hidden rounded-[28px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-[var(--school-border)] bg-[var(--school-surface)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--school-border)] px-5 py-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] theme-primary">C.T. Model School</p>
            <p className="mt-2 text-sm font-black text-[var(--school-text)]">Management System</p>
            <div className="mt-4 flex items-center gap-2"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider theme-primary">Super Admin</span><StatusDot label="Active" /></div>
          </div>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between px-2"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--school-muted)]">Control Panel</p><span className="text-[9px] font-black theme-primary">{String(selectedModule.stage).padStart(2, "0")} / 07</span></div>
            <nav className="space-y-1" aria-label="Super Admin modules">
              {modules.map(module => {
                const active = selected === module.id;
                const expanded = openModule === module.id;
                return <div key={module.id}>
                  <button type="button" onClick={() => handleModuleClick(module)} aria-expanded={expanded} className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${active ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]" : "border-transparent hover:border-[var(--school-border)] hover:bg-[var(--school-background)]"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[9px] font-black ${active ? "bg-[var(--school-surface)] theme-primary" : "bg-[var(--school-background)] text-[var(--school-muted)]"}`}>{String(module.stage).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1"><span className={`block truncate text-[11px] font-black ${active ? "theme-primary" : "text-[var(--school-text)]"}`}>{module.title}</span><span className="mt-0.5 block truncate text-[9px] font-semibold text-[var(--school-muted)]">{module.eyebrow}</span></span>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[var(--school-border)] text-[10px] font-black text-[var(--school-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {expanded && <div className="ml-11 mt-1 space-y-0.5 border-l border-[var(--school-border)] pl-3 pb-1">{module.sections.map((section, index) => <button key={section} type="button" onClick={() => handleSectionClick(module, section)} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[10px] font-semibold transition ${active && selectedSection === section ? "bg-[var(--school-primary-soft)] font-black theme-primary" : "text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:text-[var(--school-text)]"}`}><span className="grid h-4 w-4 shrink-0 place-items-center rounded-md bg-[var(--school-background)] text-[7px] font-black text-[var(--school-muted)]">{index + 1}</span><span className="truncate">{section}</span></button>)}</div>}
                </div>;
              })}
            </nav>
          </div>
          <div className="mt-auto border-t border-[var(--school-border)] p-4"><div className="rounded-2xl bg-[var(--school-primary-soft)] p-4"><p className="truncate text-xs font-black">{displayName}</p><p className="mt-1 truncate text-[9px] font-bold capitalize theme-primary">{roleLabel}</p><button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-4 w-full rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-2 text-[10px] font-black theme-primary transition hover:opacity-80 disabled:cursor-wait disabled:opacity-60">{loggingOut ? "Logging out..." : "Logout"}</button></div></div>
        </aside>

        <main className="min-w-0 bg-[var(--school-background)] p-4 sm:p-6 lg:p-8">
          <section className="min-h-[calc(100vh-11rem)] rounded-[26px] border border-[var(--school-border)] bg-[var(--school-surface)] p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 border-b border-[var(--school-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] theme-primary">{selectedModule.eyebrow}</span><StatusDot label="System access active" /></div><p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--school-muted)]">C.T. Model School · Administration</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--school-text)] sm:text-4xl">{selectedSection}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">{isDashboardOverview ? `Welcome, ${displayName}. This is your Super Admin control center.` : `${selectedModule.title} · ${selectedSection}`}</p></div>
              <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[310px]"><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Role</p><p className="mt-1 truncate text-xs font-black capitalize theme-primary">{roleLabel}</p></div><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Module</p><p className="mt-1 truncate text-xs font-black text-[var(--school-text)]">{selectedModule.title}</p></div></div>
            </div>

            {isDashboardOverview && <div className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-5"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Access</p><p className="mt-2 text-xl font-black theme-primary">Active</p><p className="mt-1 text-xs text-[var(--school-muted)]">Super Admin access</p></div><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-5"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Modules</p><p className="mt-2 text-xl font-black text-[var(--school-text)]">07</p><p className="mt-1 text-xs text-[var(--school-muted)]">Administration modules</p></div><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-5"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Current</p><p className="mt-2 truncate text-xl font-black text-[var(--school-text)]">Dashboard</p><p className="mt-1 text-xs text-[var(--school-muted)]">Overview</p></div><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-5"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Account</p><p className="mt-2 truncate text-xl font-black text-[var(--school-text)]">{displayName}</p><p className="mt-1 truncate text-xs text-[var(--school-muted)]">{email || "Active account"}</p></div></div><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Quick access</p><h2 className="mt-2 text-xl font-black text-[var(--school-text)]">Select a module from the left</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">Click any item in the left Control Panel. Its sections will open directly below it, and clicking a section will show that section here.</p></div></div>}

            {isSystemActivity && <div className="mt-6 space-y-5"><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Live records</p><h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">Recent System Activity</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Recent activity from the existing school management records.</p></div><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-black theme-primary">{activityItems.length} recent</span></div></div>{activityItems.length ? <div className="overflow-hidden rounded-2xl border border-[var(--school-border)]"><div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr] gap-4 bg-[var(--school-background)] px-5 py-3 text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)] md:grid"><span>Activity</span><span>Reference</span><span>Status</span><span>Date & Time</span></div><div className="divide-y divide-[var(--school-border)]">{activityItems.map(item => <div key={item.id} className="grid gap-3 bg-[var(--school-surface)] px-5 py-4 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center md:gap-4"><div><p className="text-xs font-black text-[var(--school-text)]">{item.action}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{item.module}{item.detail ? ` · ${item.detail}` : ""}</p></div><p className="text-[10px] font-bold text-[var(--school-muted)]">{item.reference || "—"}</p><span className="w-fit rounded-full border border-[var(--school-border)] bg-[var(--school-background)] px-2.5 py-1 text-[9px] font-black capitalize text-[var(--school-muted)]">{formatStatus(item.status)}</span><p className="text-[10px] font-semibold text-[var(--school-muted)]">{formatDate(item.createdAt)}</p></div>)}</div></div> : <div className="rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-background)] p-10 text-center"><p className="text-sm font-black text-[var(--school-text)]">No recent activity</p><p className="mt-1 text-xs text-[var(--school-muted)]">There are no recent records available to display.</p></div>}</div>}

            {isPendingActions && <div className="mt-6 space-y-5"><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Live records</p><h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">Pending Actions</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Only records that currently need attention are shown. No demo or placeholder entries.</p></div><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-black theme-primary">{pendingItems.length} pending</span></div></div>{pendingItems.length ? <div className="grid gap-4 lg:grid-cols-2">{pendingItems.map(item => <div key={item.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.15em] theme-primary">{item.module}</p><h3 className="mt-2 text-lg font-black text-[var(--school-text)]">{item.action}</h3></div><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-2.5 py-1 text-[9px] font-black capitalize theme-primary">{formatStatus(item.status)}</span></div><div className="mt-4 grid gap-2 text-xs text-[var(--school-muted)]"><p><span className="font-black text-[var(--school-text)]">Reference:</span> {item.reference || "—"}</p>{item.detail && <p><span className="font-black text-[var(--school-text)]">Details:</span> {item.detail}</p>}<p><span className="font-black text-[var(--school-text)]">Created:</span> {formatDate(item.createdAt)}</p></div><a href={actionTarget(item)} className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-4 py-2.5 text-xs font-black theme-primary transition hover:bg-[var(--school-primary-soft)]">Open {item.module} →</a></div>)}</div> : <div className="rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-background)] p-10 text-center"><p className="text-sm font-black text-[var(--school-text)]">No pending actions</p><p className="mt-1 text-xs text-[var(--school-muted)]">All currently loaded records are in a completed or non-actionable state.</p></div>}</div>}

            {!isDashboardOverview && !isSystemActivity && !isPendingActions && <div className="mt-6 rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">{selectedModule.title}</p><h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">{selectedSection}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">{selectedModule.description}</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedModule.sections.map(section => <button key={section} type="button" onClick={() => handleSectionClick(selectedModule, section)} className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition ${selectedSection === section ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] theme-primary" : "border-[var(--school-border)] bg-[var(--school-surface)] text-[var(--school-muted)] hover:bg-[var(--school-primary-soft)] hover:text-[var(--school-text)]"}`}>{section}</button>)}</div></div>}
          </section>
        </main>
      </div>
    </div>
  );
}
