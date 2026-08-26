"use client";

import type { ReactNode } from "react";

type ModulePreview = {
  title: string;
  eyebrow: string;
  description: string;
  state: "ready" | "next";
  icon: ReactNode;
};

const modules: ModulePreview[] = [
  {
    title: "Parents & Guardians",
    eyebrow: "People",
    description: "Parent accounts, child binding, approvals and parent records.",
    state: "next",
    icon: "01",
  },
  {
    title: "Human Resources",
    eyebrow: "HR",
    description: "Teacher and staff attendance, salary sheets and HR operations.",
    state: "next",
    icon: "02",
  },
  {
    title: "Inventory",
    eyebrow: "Store",
    description: "Items, stock, service requests and inventory operations.",
    state: "next",
    icon: "03",
  },
  {
    title: "Item Service Request",
    eyebrow: "Workflow",
    description: "SR review, approval, issue and request history.",
    state: "next",
    icon: "04",
  },
  {
    title: "Accounts",
    eyebrow: "Finance",
    description: "Fees, payroll settlement, bills, vouchers and financial records.",
    state: "next",
    icon: "05",
  },
  {
    title: "Access & Settings",
    eyebrow: "Control",
    description: "Roles, permissions, system settings and administrative controls.",
    state: "next",
    icon: "06",
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
  const displayName = fullName || email || "Super Admin";
  const roleLabel = roleName.replace(/_/g, " ");

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="overflow-hidden rounded-[28px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm">
        <div className="relative px-5 py-6 sm:px-7 sm:py-8 lg:px-9">
          <div className="absolute inset-x-0 top-0 h-1.5 theme-primary-bg" />
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] theme-primary">
                  Super Admin
                </span>
                <StatusDot label="System access active" />
              </div>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--school-muted)]">
                C.T. Model School · Administration
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--school-text)] sm:text-4xl">
                Good to see you, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">
                This is the new Super Admin control center. The interface is being rebuilt module by module while the existing database, permissions and business logic remain untouched.
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[330px]">
              <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Role</p>
                <p className="mt-1 truncate text-xs font-black capitalize theme-primary">{roleLabel}</p>
              </div>
              <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">UI Stage</p>
                <p className="mt-1 text-xs font-black theme-primary">01 / 07</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3 sm:col-span-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">Account</p>
                <p className="mt-1 truncate text-xs font-black">{email || "Active"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--school-border)] bg-[var(--school-primary-soft)] px-5 py-4 sm:px-7 lg:px-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">UI rollout</p>
              <p className="mt-1 text-xs font-semibold text-[var(--school-text)]">
                Stage 01 is the Super Admin dashboard. Other modules stay on their existing implementation until this screen is approved.
              </p>
            </div>
            <div className="flex items-center gap-1.5" aria-label="UI rollout progress">
              {Array.from({ length: 7 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full ${index === 0 ? "w-7 theme-primary-bg" : "w-3 bg-[var(--school-border)]"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Control center</p>
            <h2 className="mt-1 text-xl font-black text-[var(--school-text)]">Administration modules</h2>
          </div>
          <p className="text-[11px] font-semibold text-[var(--school-muted)]">One module at a time · review before next</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, index) => (
            <article
              key={module.title}
              className={`group rounded-[24px] border bg-[var(--school-surface)] p-5 shadow-sm transition ${
                index === 0
                  ? "border-[var(--school-primary-border)] ring-1 ring-[var(--school-primary-border)]"
                  : "border-[var(--school-border)] opacity-90"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--school-primary-soft)] text-xs font-black theme-primary">
                  {module.icon}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                    index === 0
                      ? "theme-primary-bg"
                      : "border border-[var(--school-border)] text-[var(--school-muted)]"
                  }`}
                >
                  {index === 0 ? "Current" : module.state}
                </span>
              </div>
              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] theme-primary">{module.eyebrow}</p>
              <h3 className="mt-1.5 text-lg font-black text-[var(--school-text)]">{module.title}</h3>
              <p className="mt-2 min-h-[48px] text-xs leading-5 text-[var(--school-muted)]">{module.description}</p>
              <div className="mt-5 border-t border-[var(--school-border)] pt-4">
                <span className="text-[10px] font-black theme-primary">
                  {index === 0 ? "Review this screen first" : "Will load after approval"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--school-surface)] text-xs font-black theme-primary">✓</div>
          <div>
            <p className="text-xs font-black text-[var(--school-text)]">Logic and database are locked</p>
            <p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">
              This UI pass only changes presentation and component structure. Existing Supabase tables, RPCs, permission rules and business workflows are not modified by this dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
