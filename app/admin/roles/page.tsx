"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type InventoryPermissions = { view: boolean; add: boolean; edit: boolean; remove: boolean; sr_approval: boolean };
type ItemSrPermissions = { view: boolean; create: boolean; history: boolean; approve: boolean; issue: boolean };
type Role = { id: string; role_name: string; permissions: Record<string, unknown>; is_system: boolean; is_active: boolean };
type LegacyPermissionKey = "dashboard" | "profile" | "attendance" | "students" | "parents" | "people" | "teachers" | "accounts" | "store_members" | "notices" | "results";

const legacyModules: { key: LegacyPermissionKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Dashboard", description: "View the member dashboard" },
  { key: "profile", label: "Profile", description: "View and manage the member profile" },
  { key: "attendance", label: "Attendance", description: "Access attendance features" },
  { key: "students", label: "Students", description: "Access student records and management" },
  { key: "parents", label: "Parents & Guardians", description: "Access parent and guardian records" },
  { key: "people", label: "People & Achievements", description: "Access people and achievements" },
  { key: "teachers", label: "Teachers & Staff", description: "Access teacher and staff management" },
  { key: "accounts", label: "Accounts & Finance", description: "Access accounts and finance" },
  { key: "store_members", label: "Store Members", description: "Access store member management" },
  { key: "notices", label: "Notices", description: "Access notices" },
  { key: "results", label: "Results & Reports", description: "Access results and reports" },
];

const inventoryPermissionList: { key: keyof InventoryPermissions; label: string; description: string }[] = [
  { key: "view", label: "View / Search Items", description: "View active items, stock and item status" },
  { key: "add", label: "Add New Item", description: "Create a new inventory item" },
  { key: "edit", label: "Edit Item", description: "Update item information and stock values" },
  { key: "remove", label: "Remove Item", description: "Deactivate an inventory item" },
  { key: "sr_approval", label: "SR Approval", description: "Legacy Inventory SR approval capability" },
];

const itemSrPermissionList: { key: keyof ItemSrPermissions; label: string; description: string }[] = [
  { key: "view", label: "View / Search SR", description: "Access the Item SR workspace and search requests" },
  { key: "create", label: "Create SR", description: "Create and submit a new item service request" },
  { key: "history", label: "View Own SR History", description: "View submitted SRs and their status" },
  { key: "approve", label: "Approve / Reject SR", description: "Review pending requests and approve or reject them" },
  { key: "issue", label: "Issue / Process SR", description: "Issue approved items and complete partial requests" },
];

const emptyInventory = (): InventoryPermissions => ({ view: false, add: false, edit: false, remove: false, sr_approval: false });
const emptyItemSr = (): ItemSrPermissions => ({ view: false, create: false, history: false, approve: false, issue: false });
const emptyLegacy = (): Record<LegacyPermissionKey, boolean> => Object.fromEntries(legacyModules.map((item) => [item.key, false])) as Record<LegacyPermissionKey, boolean>;

export default function AdminRolesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState("");
  const [inventory, setInventory] = useState<InventoryPermissions>(emptyInventory());
  const [itemSr, setItemSr] = useState<ItemSrPermissions>(emptyItemSr());
  const [legacy, setLegacy] = useState<Record<LegacyPermissionKey, boolean>>(emptyLegacy());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRoles() {
    setLoading(true); setError("");
    const { data, error: loadError } = await supabase.rpc("store_admin_list_member_roles");
    if (loadError) setError(loadError.message); else setRoles((data ?? []) as Role[]);
    setLoading(false);
  }
  useEffect(() => { void loadRoles(); }, []);

  function resetForm() { setEditingId(null); setRoleName(""); setInventory(emptyInventory()); setItemSr(emptyItemSr()); setLegacy(emptyLegacy()); }
  function editRole(role: Role) {
    const inv = role.permissions?.inventory && typeof role.permissions.inventory === "object" ? role.permissions.inventory as Partial<InventoryPermissions> : {};
    const sr = role.permissions?.item_sr && typeof role.permissions.item_sr === "object" ? role.permissions.item_sr as Partial<ItemSrPermissions> : {};
    setEditingId(role.id); setRoleName(role.role_name); setInventory({ ...emptyInventory(), ...inv }); setItemSr({ ...emptyItemSr(), ...sr });
    setLegacy({ ...emptyLegacy(), ...(Object.fromEntries(legacyModules.map((item) => [item.key, Boolean(role.permissions?.[item.key])])) as Record<LegacyPermissionKey, boolean>) });
    setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggleAll(value: boolean) { setInventory({ view: value, add: value, edit: value, remove: value, sr_approval: value }); setItemSr({ view: value, create: value, history: value, approve: value, issue: value }); setLegacy(Object.fromEntries(legacyModules.map((item) => [item.key, value])) as Record<LegacyPermissionKey, boolean>); }

  async function saveRole() {
    setSaving(true); setMessage(""); setError("");
    const permissions: Record<string, unknown> = { ...legacy, inventory, item_sr: itemSr };
    const { error: saveError } = await supabase.rpc("store_admin_save_member_role", { p_id: editingId, p_role_name: roleName, p_permissions: permissions });
    if (saveError) setError(saveError.message); else { setMessage(editingId ? "Role updated successfully." : "Role created successfully."); resetForm(); await loadRoles(); }
    setSaving(false);
  }
  async function removeRole(role: Role) {
    if (role.is_system) { setError("System roles cannot be removed."); return; }
    if (!window.confirm(`Remove role “${role.role_name}”?`)) return;
    const { error: removeError } = await supabase.rpc("store_admin_remove_member_role", { p_id: role.id });
    if (removeError) setError(removeError.message); else { setMessage(`${role.role_name} removed.`); if (editingId === role.id) resetForm(); await loadRoles(); }
  }

  const inventoryEnabled = inventoryPermissionList.filter((item) => inventory[item.key]).length;
  const itemSrEnabled = itemSrPermissionList.filter((item) => itemSr[item.key]).length;

  return <AdminPageShell eyebrow="Access Control" title="Role Management" description="Build member roles from independent module permissions. Admin users retain full administrative access.">
    {error ? <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    {message ? <p className="mb-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm theme-primary">{message}</p> : null}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)]">
      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Permission Builder</p><h2 className="mt-1 text-xl font-black">{editingId ? "Edit Role" : "Create New Role"}</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Inventory and Item SR are finalized as independent categories. Other modules remain unchanged.</p></div>{editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}</div>
        <label className="mt-5 block"><span className="label">Role Name *</span><input className="field w-full" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Store Officer" /></label>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => toggleAll(true)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Enable All</button><button type="button" onClick={() => toggleAll(false)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Disable All</button></div>

        <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Finalized Category</p><h3 className="mt-1 text-base font-black">Inventory</h3><p className="mt-0.5 text-xs text-[var(--school-muted)]">Independent inventory capabilities.</p></div><span className="rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-2.5 py-1 text-[10px] font-black">{inventoryEnabled}/5</span></div><div className="mt-3 space-y-2">{inventoryPermissionList.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><input type="checkbox" checked={inventory[item.key]} onChange={() => setInventory((current) => ({ ...current, [item.key]: !current[item.key] }))} className="h-4 w-4 accent-[var(--school-primary)]" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-[11px] leading-4 text-[var(--school-muted)]">{item.description}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${inventory[item.key] ? "theme-primary-bg" : "border border-[var(--school-border)] text-[var(--school-muted)]"}`}>{inventory[item.key] ? "ON" : "OFF"}</span></label>)}</div></div>

        <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Finalized Category</p><h3 className="mt-1 text-base font-black">Item SR</h3><p className="mt-0.5 text-xs text-[var(--school-muted)]">Service Request creation, history, approval and issue workflow.</p></div><span className="rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-2.5 py-1 text-[10px] font-black">{itemSrEnabled}/5</span></div><div className="mt-3 space-y-2">{itemSrPermissionList.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><input type="checkbox" checked={itemSr[item.key]} onChange={() => setItemSr((current) => ({ ...current, [item.key]: !current[item.key] }))} className="h-4 w-4 accent-[var(--school-primary)]" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-[11px] leading-4 text-[var(--school-muted)]">{item.description}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${itemSr[item.key] ? "theme-primary-bg" : "border border-[var(--school-border)] text-[var(--school-muted)]"}`}>{itemSr[item.key] ? "ON" : "OFF"}</span></label>)}</div></div>

        <details className="mt-4 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)]"><summary className="cursor-pointer px-4 py-3 text-sm font-black">Other Permissions</summary><div className="space-y-2 border-t border-[var(--school-border)] p-4">{legacyModules.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--school-border)] p-3"><input type="checkbox" checked={legacy[item.key]} onChange={() => setLegacy((current) => ({ ...current, [item.key]: !current[item.key] }))} className="h-4 w-4 accent-[var(--school-primary)]" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-[11px] text-[var(--school-muted)]">{item.description}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${legacy[item.key] ? "theme-primary-bg" : "border border-[var(--school-border)] text-[var(--school-muted)]"}`}>{legacy[item.key] ? "ON" : "OFF"}</span></label>)}</div></details>
        <button type="button" disabled={saving || !roleName.trim()} onClick={() => void saveRole()} className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}</button>
      </section>

      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Role Library</p><h2 className="mt-1 text-xl font-black">Available Roles</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Each role can receive a different Inventory and Item SR capability set.</p></div><div className="mt-5 space-y-3">{loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading roles...</p> : null}{!loading && roles.map((role) => { const inv = role.permissions?.inventory && typeof role.permissions.inventory === "object" ? role.permissions.inventory as Partial<InventoryPermissions> : {}; const sr = role.permissions?.item_sr && typeof role.permissions.item_sr === "object" ? role.permissions.item_sr as Partial<ItemSrPermissions> : {}; const enabledLegacy = legacyModules.filter((item) => Boolean(role.permissions?.[item.key])).length; const enabledInventory = inventoryPermissionList.filter((item) => Boolean(inv[item.key])).length; const enabledItemSr = itemSrPermissionList.filter((item) => Boolean(sr[item.key])).length; return <article key={role.id} className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{role.role_name}</h3>{role.is_system ? <span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-bold theme-primary">SYSTEM</span> : <span className="rounded-full border border-[var(--school-border)] px-2 py-1 text-[10px] font-bold">CUSTOM</span>}</div><p className="mt-1 text-xs text-[var(--school-muted)]">Inventory {enabledInventory}/5 · Item SR {enabledItemSr}/5 · Other {enabledLegacy}</p></div><div className="flex gap-2"><button type="button" onClick={() => editRole(role)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button>{!role.is_system ? <button type="button" onClick={() => void removeRole(role)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button> : null}</div></div><div className="mt-3 flex flex-wrap gap-1.5">{itemSrPermissionList.filter((item) => Boolean(sr[item.key])).map((item) => <span key={item.key} className="rounded-lg bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-semibold theme-primary">SR: {item.label}</span>)}</div></article>; })}{!loading && !roles.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No roles found.</p> : null}</div></section>
    </div>
  </AdminPageShell>;
}
