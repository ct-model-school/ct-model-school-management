"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Role = {
  id: string;
  role_name: string;
  permissions: Record<string, boolean>;
  is_system: boolean;
  is_active: boolean;
};

type PermissionKey = "dashboard" | "students" | "parents" | "people" | "teachers" | "accounts" | "store_members" | "inventory" | "notices" | "results";

const permissionModules: { key: PermissionKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Dashboard", description: "View the administration dashboard" },
  { key: "students", label: "Students", description: "Access student records and management" },
  { key: "parents", label: "Parents & Guardians", description: "Access parent and guardian records" },
  { key: "people", label: "People & Achievements", description: "Access people and achievements" },
  { key: "teachers", label: "Teachers & Staff", description: "Access teacher and staff management" },
  { key: "accounts", label: "Accounts & Finance", description: "Access accounts and finance" },
  { key: "store_members", label: "Store Members", description: "Access store member management" },
  { key: "inventory", label: "Inventory", description: "Access inventory and stock" },
  { key: "notices", label: "Notices", description: "Access notices" },
  { key: "results", label: "Results & Reports", description: "Access results and reports" },
];

const emptyPermissions = (): Record<PermissionKey, boolean> => Object.fromEntries(permissionModules.map((item) => [item.key, false])) as Record<PermissionKey, boolean>;

export default function AdminRolesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(emptyPermissions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRoles() {
    setLoading(true); setError("");
    const { data, error: loadError } = await supabase.rpc("store_admin_list_member_roles");
    if (loadError) setError(loadError.message);
    else setRoles((data ?? []) as Role[]);
    setLoading(false);
  }

  useEffect(() => { void loadRoles(); }, []);

  function resetForm() {
    setEditingId(null);
    setRoleName("");
    setPermissions(emptyPermissions());
  }

  function editRole(role: Role) {
    setEditingId(role.id);
    setRoleName(role.role_name);
    setPermissions({ ...emptyPermissions(), ...(role.permissions ?? {}) });
    setMessage(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function togglePermission(key: PermissionKey) {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleAll(value: boolean) {
    setPermissions(Object.fromEntries(permissionModules.map((item) => [item.key, value])) as Record<PermissionKey, boolean>);
  }

  async function saveRole() {
    setSaving(true); setMessage(""); setError("");
    const { error: saveError } = await supabase.rpc("store_admin_save_member_role", {
      p_id: editingId,
      p_role_name: roleName,
      p_permissions: permissions,
    });
    if (saveError) setError(saveError.message);
    else {
      setMessage(editingId ? "Role updated successfully." : "Role created successfully.");
      resetForm();
      await loadRoles();
    }
    setSaving(false);
  }

  async function removeRole(role: Role) {
    if (role.is_system) {
      setError("System roles cannot be removed.");
      return;
    }
    if (!window.confirm(`Remove role “${role.role_name}”?`)) return;
    const { error: removeError } = await supabase.rpc("store_admin_remove_member_role", { p_id: role.id });
    if (removeError) setError(removeError.message);
    else { setMessage(`${role.role_name} removed.`); if (editingId === role.id) resetForm(); await loadRoles(); }
  }

  return (
    <AdminPageShell
      eyebrow="Access Control"
      title="Role Management"
      description="Create custom member roles and control which school modules each role can access."
    >
      {error ? <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm theme-primary">{message}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">
        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{editingId ? "Edit Role" : "Create New Role"}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Enable or disable access with the check marks below.</p>
            </div>
            {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}
          </div>

          <label className="mt-5 block">
            <span className="label">Role Name *</span>
            <input className="field w-full" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Librarian, Class Teacher, Store Officer" />
          </label>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => toggleAll(true)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Enable All</button>
            <button type="button" onClick={() => toggleAll(false)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Disable All</button>
          </div>

          <div className="mt-5 space-y-2">
            {permissionModules.map((item) => (
              <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--school-border)] p-3.5 hover:bg-[var(--school-primary-soft)]">
                <input type="checkbox" checked={Boolean(permissions[item.key])} onChange={() => togglePermission(item.key)} className="h-4 w-4 accent-[var(--school-primary)]" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-xs text-[var(--school-muted)]">{item.description}</span></span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${permissions[item.key] ? "theme-primary-bg" : "border border-[var(--school-border)] text-[var(--school-muted)]"}`}>{permissions[item.key] ? "ON" : "OFF"}</span>
              </label>
            ))}
          </div>

          <button type="button" disabled={saving || !roleName.trim()} onClick={() => void saveRole()} className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
          </button>
        </section>

        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-black">Available Roles</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">System roles are protected. Custom roles can be edited or removed.</p>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading roles...</p> : null}
            {!loading && roles.map((role) => {
              const enabled = permissionModules.filter((item) => role.permissions?.[item.key]).length;
              return (
                <article key={role.id} className="rounded-2xl border border-[var(--school-border)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{role.role_name}</h3>{role.is_system ? <span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-bold theme-primary">SYSTEM</span> : <span className="rounded-full border border-[var(--school-border)] px-2 py-1 text-[10px] font-bold">CUSTOM</span>}</div>
                      <p className="mt-1 text-xs text-[var(--school-muted)]">{enabled} of {permissionModules.length} modules enabled</p>
                    </div>
                    <div className="flex gap-2"><button type="button" onClick={() => editRole(role)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button>{!role.is_system ? <button type="button" onClick={() => void removeRole(role)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button> : null}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{permissionModules.filter((item) => role.permissions?.[item.key]).map((item) => <span key={item.key} className="rounded-lg bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-semibold theme-primary">{item.label}</span>)}</div>
                </article>
              );
            })}
            {!loading && !roles.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No roles found.</p> : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
