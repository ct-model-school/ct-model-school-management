"use client";

import Link from "next/link";

type ActivityItem = {
  id: string;
  module: string;
  action: string;
  reference?: string | null;
  detail?: string | null;
  status?: string | null;
  createdAt: string;
};

function tone(status?: string | null) {
  const value = (status || "").toLowerCase();
  if (["pending", "submitted", "awaiting", "requested"].some((x) => value.includes(x))) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["approved", "completed", "paid", "issued", "active"].some((x) => value.includes(x))) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["rejected", "cancelled", "void"].some((x) => value.includes(x))) return "border-red-200 bg-red-50 text-red-700";
  return "border-[var(--school-border)] bg-[var(--school-background)] text-[var(--school-muted)]";
}

function formatTime(value: string) {
  try { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; }
}

export default function OwnerDashboardRecords({ view, fullName, roleName, activityItems }: { view: "pending" | "activity" | "audit"; fullName: string | null; roleName: string; activityItems: ActivityItem[] }) {
  const pending = activityItems.filter((item) => ["pending", "submitted", "awaiting", "requested"].some((word) => (item.status || "").toLowerCase().includes(word)));
  const rows = view === "pending" ? pending : activityItems;
  const title = view === "pending" ? "Pending Actions" : view === "audit" ? "Audit" : "System Activity";

  return <div className="min-h-[calc(100vh-1rem)] bg-[var(--school-background)] p-3 md:p-6"><div className="mx-auto max-w-[1500px] rounded-[28px] border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm"><header className="flex items-center justify-between gap-4 border-b border-[var(--school-border)] px-5 py-4 md:px-7"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] theme-primary">Super Admin / Owner Command Center</p><p className="mt-1 text-sm font-black">{title}</p></div><Link href="/admin" className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-[10px] font-black">Back to Dashboard</Link></header><main className="p-5 md:p-8"><div className="flex flex-col gap-2 border-b border-[var(--school-border)] pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] theme-primary">{roleName.replace(/_/g, " ")}</p><h1 className="mt-1 text-3xl font-black">{title}</h1><p className="mt-2 text-sm text-[var(--school-muted)]">{view === "pending" ? "Only live records requiring attention are shown." : view === "audit" ? "Recent live system records presented as the owner audit view." : "Recent activity from the existing school-management database records."}</p></div><div className="rounded-2xl border border-[var(--school-border)] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--school-muted)]">Records</p><p className="mt-1 text-2xl font-black">{rows.length}</p></div></div>{rows.length ? <div className="mt-6 space-y-2">{rows.map((item) => <article key={item.id} className="grid gap-3 rounded-2xl border border-[var(--school-border)] p-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black">{item.module}</p><span className="text-[10px] text-[var(--school-muted)]">·</span><p className="text-xs text-[var(--school-muted)]">{item.action}</p></div><p className="mt-1 text-[11px] text-[var(--school-muted)]">{item.reference || "No reference"}{item.detail ? ` · ${item.detail}` : ""}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{formatTime(item.createdAt)}</p></div><span className={`h-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${tone(item.status)}`}>{item.status || "recorded"}</span></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-[var(--school-border)] p-12 text-center"><p className="font-black">{view === "pending" ? "No pending actions" : "No recent activity"}</p><p className="mt-1 text-xs text-[var(--school-muted)]">There are no live records available for this view.</p></div>}<div className="mt-8 rounded-2xl bg-[var(--school-background)] p-4 text-xs text-[var(--school-muted)]"><span className="font-black text-[var(--school-text)]">Owner:</span> {fullName || "C.T. Model School Administrator"}</div></main></div></div>;
}
