import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAdminPermissions } from "@/lib/adminPermissions";
import OwnerAdminShell from "@/components/admin/OwnerAdminShell";

const primaryNavigation = [
  { href: "/admin", label: "Dashboard", permission: "dashboard" },
  { href: "/admin/portals", label: "Full Control Portals", adminOnly: true },
  { href: "/admin/parents", label: "Parents & Guardians", adminOnly: true },
  { href: "/admin/hr", label: "Human Resources", adminOnly: true },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory_view" },
  { href: "/admin/inventory/procurement", label: "PR & PO", permission: "procurement" },
  { href: "/admin/item-sr", label: "Item SR", permission: "item_sr" },
  { href: "/admin/accounts", label: "Accounts", permission: "accounts_access" },
  { href: "/admin/members", label: "Members", adminOnly: true },
  { href: "/admin/settings", label: "Settings", adminOnly: true },
  { href: "/admin/roles", label: "Role Management", adminOnly: true },
  { href: "/admin/roles/procurement", label: "PR & PO Permissions", adminOnly: true },
];

const isAdminOnlyRole = (roleName: string) => ["admin", "administrator", "super_admin", "super admin"].includes(roleName.toLowerCase().replace(/_/g, " "));
const isSuperAdminRole = (roleName: string) => ["super_admin", "super admin"].includes(roleName.toLowerCase().replace(/_/g, " "));

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAdminPermissions();
  if (!access) return children;

  const roleName = access.profile.role.name;
  const adminOnly = isAdminOnlyRole(roleName);
  const superAdmin = isSuperAdminRole(roleName);
  const permissions = access.permissions;
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-admin-pathname") || "";

  const procurement = (permissions.procurement || {}) as Record<string, any>;
  const inventory = (permissions.inventory || {}) as Record<string, any>;
  const accounts = (permissions.accounts || {}) as Record<string, any>;
  const itemSr = (permissions.item_sr || {}) as Record<string, any>;
  const hasInventory = adminOnly || Boolean(inventory.view);
  const hasProcurement = adminOnly || Object.values(procurement).some(Boolean);
  const hasAccounts = adminOnly || Object.values(accounts).some(Boolean) || Boolean(procurement.po_accounts_submit || procurement.po_payment_approve || procurement.po_payment_paid || procurement.po_history);
  const hasItemSr = adminOnly || Object.values(itemSr).some(Boolean);
  const allow = (key: string) => adminOnly || Boolean(permissions[key]);

  if (pathname === "/admin" || pathname === "/admin/") {
    if (!permissions.dashboard && !adminOnly) redirect("/admin/login");
  }
  if (pathname === "/admin/portals" || pathname.startsWith("/admin/portals/")) if (!adminOnly) redirect("/admin");
  if (pathname === "/admin/settings" || pathname.startsWith("/admin/settings/")) if (!adminOnly) redirect("/admin");
  if (pathname === "/admin/roles" || pathname.startsWith("/admin/roles/")) if (!adminOnly) redirect("/admin");
  if (pathname === "/admin/inventory/procurement" || pathname.startsWith("/admin/inventory/procurement/")) {
    if (!hasProcurement) redirect("/admin");
  } else if (pathname === "/admin/inventory" || pathname.startsWith("/admin/inventory/")) {
    if (!hasInventory) redirect("/admin");
  }
  if (pathname === "/admin/item-sr" || pathname.startsWith("/admin/item-sr/")) if (!hasItemSr) redirect("/admin");
  if (pathname === "/admin/accounts" || pathname.startsWith("/admin/accounts/")) if (!hasAccounts) redirect("/admin");
  if (pathname === "/admin/parents" || pathname.startsWith("/admin/parents/")) if (!adminOnly) redirect("/admin");
  if (pathname === "/admin/hr" || pathname.startsWith("/admin/hr/")) if (!adminOnly) redirect("/admin");
  if (pathname === "/admin/members" || pathname.startsWith("/admin/members/")) if (!adminOnly) redirect("/admin");

  const roleLabel = roleName.replace(/_/g, " ");
  const visiblePrimary = primaryNavigation.filter(item => {
    if (item.adminOnly) return adminOnly;
    if (item.permission === "inventory_view") return hasInventory;
    if (item.permission === "procurement") return hasProcurement;
    if (item.permission === "accounts_access") return hasAccounts;
    if (item.permission === "item_sr") return hasItemSr;
    return allow(item.permission || "");
  });

  if (superAdmin) {
    return <OwnerAdminShell fullName={access.profile.full_name} email={access.profile.email} roleName={access.profile.role.name}>{children}</OwnerAdminShell>;
  }

  return (
    <div className="admin-shell min-h-screen bg-[var(--school-background)] text-[var(--school-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--school-border)] bg-[var(--school-surface)] lg:flex lg:flex-col">
          <div className="border-b border-[var(--school-border)] px-6 py-6"><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">C.T. Model School</p><p className="mt-2 text-sm font-semibold">Digital Management System</p></div>
          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Admin navigation"><p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--school-muted)]">Administration</p><div className="mt-2 space-y-1">{visiblePrimary.map(item => <Link key={item.href} href={item.href} className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-[var(--school-primary-soft)] hover:text-[var(--school-primary)] ${item.href === "/admin/portals" ? "border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] theme-primary" : ""}`}>{item.label}</Link>)}</div></nav>
          <div className="border-t border-[var(--school-border)] p-4"><div className="rounded-2xl bg-[var(--school-primary-soft)] p-4"><p className="truncate text-sm font-bold">{access.profile.full_name || access.profile.email}</p><p className="mt-1 text-xs capitalize theme-primary">{roleLabel}</p></div></div>
        </aside>
        <div className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-4 py-3 backdrop-blur lg:hidden"><p className="truncate text-sm font-bold">C.T. Model School</p><p className="mt-0.5 text-xs capitalize theme-primary">{roleLabel}</p><nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Mobile admin navigation">{visiblePrimary.map(item => <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[11px] font-bold text-[var(--school-muted)]">{item.label}</Link>)}</nav></header><main className="min-w-0 p-5 md:p-8 lg:p-10">{children}</main></div>
      </div>
    </div>
  );
}
