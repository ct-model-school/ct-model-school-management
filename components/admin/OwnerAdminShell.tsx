"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ownerLeafCount, ownerModules } from "./ownerAdminNavigation";
import { OwnerAdminProvider } from "./OwnerAdminContext";

type Props = { fullName: string | null; email: string | null; roleName: string; children: React.ReactNode };

function pathMatches(href: string, pathname: string, search: string) {
  const [path, query] = href.split("?");
  if (path !== pathname) return false;
  if (!query) return true;
  return search === `?${query}`;
}

export default function OwnerAdminShell({ fullName, email, roleName, children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ "01": true, "02": true, "03": false, "04": false, "05": false, "06": false, "07": false, "08": false, "09": false });
  const q = query.trim().toLowerCase();

  const visible = useMemo(() => ownerModules.map(module => ({ ...module, groups: module.groups.map(group => ({ ...group, actions: group.actions?.filter(action => `${action.label} ${action.href}`.toLowerCase().includes(q)) })).filter(group => !q || `${group.label} ${group.href || ""}`.toLowerCase().includes(q) || Boolean(group.actions?.length)) })).filter(module => !q || `${module.title} ${module.description}`.toLowerCase().includes(q) || module.groups.length), [q]);

  let activeLabel = "Dashboard";
  let activeModule = ownerModules[0];
  let best = -1;
  for (const module of ownerModules) for (const group of module.groups) {
    const candidates = group.actions?.length ? group.actions : [{ label: group.label, href: group.href || "/admin" }];
    for (const item of candidates) {
      const [path] = item.href.split("?");
      if (path === pathname && item.href.length > best && pathMatches(item.href, pathname, search)) { activeLabel = item.label; activeModule = module; best = item.href.length; }
    }
  }

  const navigation = <nav aria-label="School administration tree" className="space-y-1">{visible.map(module => <div key={module.code}>
    <button type="button" onClick={() => setOpen(state => ({ ...state, [module.code]: !state[module.code] }))} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${open[module.code] ? "bg-[var(--school-primary-soft)]" : "hover:bg-[var(--school-background)]"}`}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--school-border)] text-[9px] font-black">{module.code}</span><span className="flex-1 text-xs font-black">{module.title}</span><span className="text-xs">{open[module.code] ? "⌃" : "⌄"}</span>
    </button>
    {open[module.code] ? <div className="ml-4 border-l border-[var(--school-border)] pl-2 pt-1">{module.groups.map(group => group.actions?.length ? <div key={group.label} className="mb-1"><p className="px-2 py-1 text-[9px] font-black theme-primary">{group.label}</p>{group.actions.map(action => <Link key={action.label} href={action.href} onClick={() => setMobileOpen(false)} className={`block rounded-lg px-2.5 py-1.5 text-[10px] transition ${pathMatches(action.href, pathname, search) ? "bg-[var(--school-primary-soft)] font-black theme-primary" : "text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:theme-primary"}`}>{action.label}</Link>)}</div> : <Link key={group.label} href={group.href || "/admin"} onClick={() => setMobileOpen(false)} className={`block rounded-lg px-2.5 py-1.5 text-[10px] transition ${pathMatches(group.href || "/admin", pathname, search) ? "bg-[var(--school-primary-soft)] font-black theme-primary" : "text-[var(--school-muted)] hover:bg-[var(--school-background)] hover:theme-primary"}`}>{group.label}</Link>)}</div> : null}
  </div>)}</nav>;

  return <OwnerAdminProvider><div className="min-h-screen bg-[var(--school-background)] text-[var(--school-text)]"><div className="mx-auto flex min-h-screen max-w-[1850px] overflow-hidden border-x border-[var(--school-border)] bg-[var(--school-surface)]">
    <aside className="hidden w-[310px] shrink-0 border-r border-[var(--school-border)] bg-[var(--school-surface)] md:flex md:flex-col">
      <div className="border-b border-[var(--school-border)] p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl theme-primary-bg text-sm font-black">CT</div><div><p className="text-sm font-black">C.T. Model School</p><p className="text-[10px] text-[var(--school-muted)]">Super Admin / Owner</p></div></div><div className="mt-4 rounded-full border border-[var(--school-border)] px-3 py-1 text-center text-[9px] font-black uppercase tracking-wider theme-primary">{ownerLeafCount} action leaves</div></div>
      <div className="p-4"><input className="field w-full" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules, actions..." /></div><div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">{navigation}</div>
      <div className="border-t border-[var(--school-border)] p-4"><p className="truncate text-xs font-black">{fullName || "School Administrator"}</p><p className="truncate text-[10px] capitalize text-[var(--school-muted)]">{roleName.replace(/_/g, " ")}</p><p className="truncate text-[9px] text-[var(--school-muted)]">{email || ""}</p></div>
    </aside>
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur md:px-7"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(v => !v)} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-xs font-black md:hidden">☰</button><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.18em] theme-primary">{activeModule.code} · {activeModule.title}</p><h1 className="truncate text-lg font-black md:text-xl">{activeLabel}</h1></div><div className="ml-auto rounded-full border border-[var(--school-border)] px-3 py-1 text-[9px] font-black">OWNER</div></div></header>
      {mobileOpen ? <div className="border-b border-[var(--school-border)] bg-[var(--school-surface)] p-3 md:hidden"><input className="field mb-3 w-full" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules, actions..." />{navigation}</div> : null}
      <div className="p-4 md:p-7 xl:p-9">{children}</div>
    </main>
  </div></div></OwnerAdminProvider>;
}
