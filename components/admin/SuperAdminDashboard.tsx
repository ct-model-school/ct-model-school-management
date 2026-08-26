"use client";

import { useState } from "react";

type Module = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  stage: number;
  sections: string[];
};

const modules: Module[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    eyebrow: "Overview",
    description: "Super Admin overview and rollout status.",
    stage: 1,
    sections: ["Overview", "System Activity", "Pending Actions"],
  },
  {
    id: "parents",
    title: "Parents & Guardians",
    eyebrow: "People",
    description: "Parent accounts, child binding, approvals and parent records.",
    stage: 2,
    sections: ["Parent Accounts", "Child Binding", "Approvals", "Parent Records"],
  },
  {
    id: "hr",
    title: "Human Resources",
    eyebrow: "HR",
    description: "Teacher and staff attendance, salary sheets and HR operations.",
    stage: 3,
    sections: ["Staff & Teachers", "Attendance", "Payroll", "Monthly Salary Sheet"],
  },
  {
    id: "inventory",
    title: "Inventory",
    eyebrow: "Store",
    description: "Items, stock, service requests and inventory operations.",
    stage: 4,
    sections: ["Add Items", "Items", "Issue SR", "SR", "Stock History"],
  },
  {
    id: "item-sr",
    title: "Item Service Request",
    eyebrow: "Workflow",
    description: "SR review, approval, issue and request history.",
    stage: 5,
    sections: ["My SR", "Awaiting Approval", "Approved SR", "Issued SR", "SR History"],
  },
  {
    id: "accounts",
    title: "Accounts",
    eyebrow: "Finance",
    description: "Fees, payroll settlement, bills, vouchers and financial records.",
    stage: 6,
    sections: ["Dashboard", "Ledger", "Bill Payments", "PO Payments", "Payroll", "Reports"],
  },
  {
    id: "settings",
    title: "Access & Settings",
    eyebrow: "Control",
    description: "Roles, permissions, system settings and administrative controls.",
    stage: 7,
    sections: ["Role Management", "Permission Builder", "PR & PO Permissions", "System Settings", "Audit & Activity"],
  },
];

function StatusDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-bold text-[var(--school-muted)]">
      <span className="h-1.5 w-1.5 rounded-full theme-primary-bg" />
      {label}
    </span>
  );
}

export default function SuperAdminDashboard({
  fullName,
  email,
  roleName,
}: {
  fullName?: string | null;
  email?: string | null;
  roleName: string;
}) {
  const [selected, setSelected] = useState("dashboard");
  const [openModule, setOpenModule] = useState<string | null>("dashboard");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const displayName = fullName || email || "Super Admin";
  const roleLabel = roleName.replace(/_/g, " ");
  const selectedModule = modules.find(module => module.id === selected) || modules[0];

  const handleModuleClick = (module: Module) => {
    setSelected(module.id);
    setSelectedSection(null);
    setOpenModule(current => current === module.id ? null : module.id);
  };

  const handleSectionClick = (module: Module, section: string) => {
    setSelected(module.id);
    setSelectedSection(section);
  };

  return (
    <div className="mx-auto w-full max-w-[1550px]">
      <div className="grid min-h-[calc(100vh-7rem)] grid-cols-1 overflow-hidden rounded-[28px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--school-border)] bg-[var(--school-surface)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--school-border)] px-5 py-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] theme-primary">C.T. Model School</p>
            <p className="mt-2 text-sm font-black text-[var(--school-text)]">Management System</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider theme-primary">Super Admin</span>
              <StatusDot label="Active" />
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--school-muted)]">Control Panel</p>
              <span className="text-[9px] font-black theme-primary">01 / 07</span>
            </div>

            <nav className="space-y-1" aria-label="Super Admin modules">
              {modules.map(module => {
                const active = selected === module.id;
                const expanded = openModule === module.id;
                const locked = module.stage !== 1;

                return (
                  <div key={module.id}>
                    <button
                      type="button"
                      onClick={() => handleModuleClick(module)}
                      aria-expanded={expanded}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]"
                          : "border-transparent hover:border-[var(--school-border)] hover:bg-[var(--school-background)]"
                      }`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[9px] font-black ${active ? "bg-[var(--school-surface)] theme-primary" : "bg-[var(--school-background)] text-[var(--school-muted)]"}`}>
                        {String(module.stage).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[11px] font-black ${active ? "theme-primary" : "text-[var(--school-text)]"}`}>{module.title}</span>
                        <span className="mt-0.5 block truncate text-[9px] font-semibold text-[var(--school-muted)]">{module.eyebrow}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {locked && <span className="rounded-full border border-[var(--school-border)] px-1.5 py-0.5 text-[8px] font-black uppercase text-[var(--school-muted)]">Next</span>}
                        <span className={`grid h-5 w-5 place-items-center rounded-full border border-[var(--school-border)] text-[10px] font-black text-[var(--school-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
                      </span>
                    </button>

                    {expanded && (
                      <div className="ml-11 mt-1 space-y-0.5 border-l border-[var(--school-border)] pl-3 pb-1">
                        {module.sections.map((section, index) => {
                          const sectionActive = active && selectedSection === section;
                          return (
                            <button
                              key={section}
                              type="button"
                              onClick={() => handleSectionClick(module, section)}
                              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[10px] font-semibold transition ${
                                sectionActive
                                  ? "bg-[var(--school-primary-soft)] font-black theme-primary"
                                  : "text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:text-[var(--school-text)]"
                              }`}
                            >
                              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-md bg-[var(--school-background)] text-[7px] font-black text-[var(--school-muted)]">{index + 1}</span>
                              <span className="truncate">{section}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-[var(--school-border)] p-4">
            <div className="rounded-2xl bg-[var(--school-primary-soft)] p-4">
              <p className="truncate text-xs font-black">{displayName}</p>
              <p className="mt-1 truncate text-[9px] font-bold capitalize theme-primary">{roleLabel}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[var(--school-background)] p-4 sm:p-6 lg:p-8">
          {selectedModule.id === "dashboard" && !selectedSection ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[26px] border border-[var(--school-border)] bg-[var(--school-surface)]">
                <div className="relative px-5 py-6 sm:px-7 sm:py-8 lg:px-9">
                  <div className="absolute inset-x-0 top-0 h-1.5 theme-primary-bg" />
                  <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Super Admin</span>
                        <StatusDot label="System access active" />
                      </div>
                      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--school-muted)]">C.T. Model School · Administration</p>
                      <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--school-text)] sm:text-4xl">Good to see you, {displayName}</h1>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">Super Admin control center. Select a module from the left panel to view it here.</p>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[330px]">
                      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Role</p><p className="mt-1 truncate text-xs font-black capitalize theme-primary">{roleLabel}</p></div>
                      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">UI Stage</p><p className="mt-1 text-xs font-black theme-primary">01 / 07</p></div>
                      <div className="col-span-2 rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3 sm:col-span-1"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Account</p><p className="mt-1 truncate text-xs font-black">{email || "Active"}</p></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--school-border)] bg-[var(--school-primary-soft)] px-5 py-4 sm:px-7 lg:px-9">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">UI rollout</p><p className="mt-1 text-xs font-semibold text-[var(--school-text)]">Stage 01 is the only completed view currently exposed. The next stage opens after approval.</p></div>
                    <div className="flex items-center gap-1.5" aria-label="UI rollout progress">{Array.from({ length: 7 }).map((_, index) => <span key={index} className={`h-1.5 rounded-full ${index === 0 ? "w-7 theme-primary-bg" : "w-3 bg-[var(--school-border)]"}`} />)}</div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="flex min-h-[calc(100vh-11rem)] items-center justify-center rounded-[26px] border border-[var(--school-border)] bg-[var(--school-surface)] p-6 text-center">
              <div className="max-w-lg">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--school-primary-soft)] text-sm font-black theme-primary">{String(selectedModule.stage).padStart(2, "0")}</div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] theme-primary">{selectedModule.eyebrow}</p>
                <h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">{selectedSection || selectedModule.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--school-muted)]">{selectedSection ? `${selectedModule.title} · ${selectedSection}` : selectedModule.description}</p>
                <div className="mt-6 rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4 text-xs font-semibold text-[var(--school-muted)]">Stage {String(selectedModule.stage).padStart(2, "0")} is locked until Stage 01 is approved. No existing form, database or business logic is being loaded here yet.</div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
