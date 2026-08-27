"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useOwnerAdminContext } from "./OwnerAdminContext";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
};

const moduleLinks = [
  { href: "/admin", label: "Dashboard", code: "01" },
  { href: "/admin/students", label: "Students", code: "02" },
  { href: "/admin/parents", label: "Parents & Guardians", code: "03" },
  { href: "/admin/hr", label: "Human Resources", code: "04" },
  { href: "/admin/inventory", label: "Inventory", code: "05" },
  { href: "/admin/item-sr", label: "Item Service Request", code: "06" },
  { href: "/admin/accounts", label: "Accounts", code: "07" },
  { href: "/admin/settings", label: "Access & Settings", code: "08" },
];

const memberLabels: Record<string, { title: string; description: string }> = {
  staff: { title: "Staff", description: "Create and manage Staff members only." },
  teacher: { title: "Teachers", description: "Create and manage Teacher members only." },
  accounts: { title: "Accounts", description: "Create and manage Accounts members only." },
  other: { title: "Other Members", description: "Create and manage Other members only." },
};

export function AdminPageShell({ eyebrow, title, description, children, action }: AdminPageShellProps) {
  const ownerContext = useOwnerAdminContext();
  const [memberType, setMemberType] = useState("staff");
  const [navOpen, setNavOpen] = useState(false);
  const isMemberPage = title === "Staff, Teachers, Accounts & Others";
  const activeModule = useMemo(() => moduleLinks.find((item) => typeof window !== "undefined" && window.location.pathname.startsWith(item.href))?.label || "Administration", []);

  useEffect(() => {
    if (!isMemberPage) return;
    const value = new URLSearchParams(window.location.search).get("type") || "staff";
    setMemberType(memberLabels[value] ? value : "staff");
  }, [isMemberPage]);

  if (ownerContext) return <>{children}</>;

  const navigation = (
    <nav aria-label="Administration navigation" className="space-y-1">
      {moduleLinks.map((item) => {
        const active = typeof window !== "undefined" && (item.href === "/admin" ? window.location.pathname === "/admin" : window.location.pathname.startsWith(item.href));
        return <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition ${active ? "bg-[var(--school-primary-soft)] theme-primary" : "text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:text-[var(--school-text)]"}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--school-background)] text-[9px] font-black">{item.code}</span><span className="truncate">{item.label}</span></Link>;
      })}
    </nav>
  );

  if (isMemberPage) {
    const section = memberLabels[memberType] || memberLabels.staff;
    return <div className="mx-auto w-full max-w-[1500px]"><div className="overflow-hidden rounded-[24px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm"><div className="flex min-h-[calc(100vh-7rem)] flex-col lg:grid lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="hidden border-r border-[var(--school-border)] bg-[var(--school-surface)] lg:block"><div className="border-b border-[var(--school-border)] p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] theme-primary">C.T. Model School</p><p className="mt-2 text-sm font-black">Management System</p></div><div className="p-3">{navigation}</div></aside><main className="min-w-0 bg-[var(--school-background)]"><header className="sticky top-0 z-20 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur sm:px-6"><div className="flex items-center gap-3"><button type="button" onClick={() => setNavOpen(!navOpen)} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-xs font-black lg:hidden">☰</button><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] theme-primary">{eyebrow}</p><p className="truncate text-sm font-black">{section.title}</p></div><div className="ml-auto hidden text-[10px] font-semibold text-[var(--school-muted)] sm:block">Administration / {section.title}</div></div></header>{navOpen ? <div className="border-b border-[var(--school-border)] bg-[var(--school-surface)] p-3 lg:hidden">{navigation}</div> : null}<div className="p-4 sm:p-6 lg:p-8"><div className="mb-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] theme-primary">{eyebrow}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{section.title}</h1><p className="mt-1 text-sm text-[var(--school-muted)]">{section.description}</p></div><section className="members-only">{children}</section></div></main></div></div><style jsx>{`.members-only > div:first-child { display: none; }`}</style></div>;
  }

  return <div className="mx-auto w-full max-w-[1500px]"><div className="overflow-hidden rounded-[24px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm"><div className="flex min-h-[calc(100vh-7rem)] flex-col lg:grid lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="hidden border-r border-[var(--school-border)] bg-[var(--school-surface)] lg:block"><div className="border-b border-[var(--school-border)] p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] theme-primary">C.T. Model School</p><p className="mt-2 text-sm font-black">Management System</p></div><div className="p-3">{navigation}</div></aside><main className="min-w-0 bg-[var(--school-background)]"><header className="sticky top-0 z-20 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur sm:px-6"><div className="flex items-center gap-3"><button type="button" onClick={() => setNavOpen(!navOpen)} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-xs font-black lg:hidden">☰</button><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] theme-primary">{activeModule}</p><p className="truncate text-sm font-black">{title}</p></div><div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full border border-[var(--school-border)] px-3 py-1.5 text-[9px] font-black text-[var(--school-muted)] sm:inline-flex">System access active</span>{action ? <Link href={action.href} className="rounded-lg px-3 py-2 text-[10px] font-black theme-primary-bg">{action.label}</Link> : null}</div></div></header>{navOpen ? <div className="border-b border-[var(--school-border)] bg-[var(--school-surface)] p-3 lg:hidden">{navigation}</div> : null}<div className="p-4 sm:p-6 lg:p-8"><div className="mb-5 border-b border-[var(--school-border)] pb-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] theme-primary">{eyebrow}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--school-text)]">{title}</h1><p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--school-muted)]">{description}</p></div><section>{children}</section></div></main></div></div></div>;
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-surface)] p-8 text-center md:p-12"><div className="mx-auto h-1 w-12 rounded-full theme-primary-bg" /><h2 className="mt-5 text-xl font-bold text-[var(--school-text)]">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--school-muted)]">{description}</p></div>; }

export function AdminInfoCard({ label, value, description }: { label: string; value: string; description: string }) { return <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--school-muted)]">{label}</p><p className="mt-2 text-lg font-black text-[var(--school-text)]">{value}</p><p className="mt-1 text-sm leading-6 text-[var(--school-muted)]">{description}</p></div>; }
