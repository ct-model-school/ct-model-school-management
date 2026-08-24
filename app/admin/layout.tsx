import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAdminPermissions } from "@/lib/adminPermissions";

const primaryNavigation = [
  { href: "/admin", label: "Dashboard", permission: "dashboard" },
  { href: "/admin/settings", label: "Settings", adminOnly: true },
  { href: "/admin/roles", label: "Role Management", adminOnly: true },
  { href: "/admin/item-sr", label: "Item SR", adminOnly: true },
  { href: "/store", label: "Store / SR", external: true },
];

const upcomingModules = [
  { href: "/admin/students", label: "Students", permission: "students" },
  { href: "/admin/parents", label: "Parents & Guardians", permission: "parents" },
  { href: "/admin/people", label: "People & Achievements", permission: "people" },
  { href: "/admin/teachers", label: "Teachers & Staff", permission: "teachers" },
  { href: "/admin/accounts", label: "Accounts & Finance", permission: "accounts" },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory" },
  { href: "/admin/store-members", label: "Store Users", permission: "store_members" },
  { href: "/admin/notices", label: "Notices", permission: "notices" },
  { href: "/admin/results", label: "Results & Reports", permission: "results" },
];

const isAdminOnlyRole = (roleName: string) => ["admin", "administrator", "super_admin", "super admin"].includes(roleName.toLowerCase().replace(/_/g, " "));

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getCurrentAdminPermissions();
  if (!access) return children;
  const roleName = access.profile.role.name;
  const adminOnly = isAdminOnlyRole(roleName);
  const permissions = access.permissions;
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-admin-pathname") || "";

  const routePermission: Array<[string, string | string[]]> = [
    ["/admin/students", "students"], ["/admin/parents", "parents"], ["/admin/people", "people"], ["/admin/teachers", "teachers"], ["/admin/accounts", "accounts"], ["/admin/inventory", "inventory"], ["/admin/store-members", "store_members"], ["/admin/notices", "notices"], ["/admin/results", "results"], ["/admin/members", ["teachers", "accounts", "store_members"]],
  ];
  const matchedRoute = routePermission.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (matchedRoute) { const required = Array.isArray(matchedRoute[1]) ? matchedRoute[1] : [matchedRoute[1]]; if (!required.some((key) => Boolean(permissions[key]))) redirect("/admin"); }
  if (pathname === "/admin" || pathname === "/admin/") { if (!permissions.dashboard) redirect("/admin/login"); }
  if (pathname === "/admin/settings" || pathname.startsWith("/admin/settings/")) { if (!adminOnly) redirect("/admin"); }
  if (pathname === "/admin/roles" || pathname.startsWith("/admin/roles/")) { if (!adminOnly) redirect("/admin"); }
  if (pathname === "/admin/item-sr" || pathname.startsWith("/admin/item-sr/")) { if (!adminOnly) redirect("/admin"); }

  const roleLabel = roleName.replace(/_/g, " ");
  const visiblePrimary = primaryNavigation.filter((item) => {
    if (item.external) return true;
    if (item.adminOnly) return adminOnly;
    return Boolean(item.permission && permissions[item.permission]);
  });
  const visibleModules = upcomingModules.filter((item) => Boolean(permissions[item.permission]));

  return <div className="admin-shell min-h-screen bg-[var(--school-background)] text-[var(--school-text)]"><div className="mx-auto flex min-h-screen max-w-[1600px]">
    <aside className="hidden w-64 shrink-0 border-r border-[var(--school-border)] bg-[var(--school-surface)] lg:flex lg:flex-col"><div className="border-b border-[var(--school-border)] px-6 py-6"><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">C.T. Model School</p><p className="mt-2 text-sm font-semibold text-[var(--school-text)]">Digital Management System</p></div><nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6" aria-label="Admin navigation"><div><p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--school-muted)]">Administration</p><div className="mt-2 space-y-1">{visiblePrimary.map((item) => <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--school-text)] transition hover:bg-[var(--school-primary-soft)] hover:text-[var(--school-primary)]">{item.label}</Link>)}</div></div><div><p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--school-muted)]">Modules</p><div className="mt-2 space-y-1">{visibleModules.map((item) => <Link key={item.href} href={item.href} className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[var(--school-muted)] transition hover:bg-[var(--school-primary-soft)] hover:text-[var(--school-primary)]">{item.label}<span className="rounded-full border border-[var(--school-border)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide group-hover:border-[var(--school-primary-border)]">Open</span></Link>)}</div></div></nav><div className="border-t border-[var(--school-border)] p-4"><div className="rounded-2xl bg-[var(--school-primary-soft)] p-4"><p className="truncate text-sm font-bold text-[var(--school-text)]">{access.profile.full_name || access.profile.email}</p><p className="mt-1 text-xs capitalize theme-primary">{roleLabel}</p></div></div></aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur lg:hidden"><div className="flex min-w-0 items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--school-text)]">C.T. Model School</p><p className="mt-0.5 text-xs capitalize theme-primary">{roleLabel}</p></div><Link href="/store" className="shrink-0 rounded-xl border border-[var(--school-primary-border)] px-3 py-2 text-xs font-bold theme-primary">Store / SR</Link></div><nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Mobile admin navigation">{[...visiblePrimary, ...visibleModules].map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[11px] font-bold text-[var(--school-muted)] shadow-sm">{item.label}</Link>)}</nav></header><main className="min-w-0 p-5 md:p-8 lg:p-10">{children}</main></div>
  </div></div>;
}
