"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type BoolMap = Record<string, boolean>;
type Role = { id: string; role_name: string; role_category: string; permissions: Record<string, unknown>; is_system: boolean; is_active: boolean };

const categories = ["Administration", "Finance & Accounts", "Academic", "Human Resources", "Student / Parent", "Inventory & Store", "Procurement", "Library", "Transport", "Laboratory", "Operations", "Other Members"];
const legacy = [["dashboard", "Dashboard"], ["profile", "Profile"], ["attendance", "Attendance"], ["parents", "Parents & Guardians"], ["people", "People & Achievements"], ["teachers", "Teachers & Staff"], ["store_members", "Store Members"], ["notices", "Notices"], ["results", "Results & Reports"]] as const;
const parentList = [["dashboard", "Dashboard"], ["profile", "My Profile"], ["parents", "My Children / Registration Status"], ["notices", "Notices"], ["results", "Results"], ["attendance", "Attendance"], ["fees", "Fees & Payment Status"], ["routine", "Class Routine"], ["exam_schedule", "Exam Schedule"], ["documents", "Documents"], ["transport", "Transport"], ["notifications", "Notifications"]] as const;
const studentList = [["dashboard", "Dashboard"], ["profile", "My Profile"], ["notices", "Notices"], ["results", "My Results"], ["attendance", "My Attendance"], ["fees", "My Fees"], ["routine", "Class Routine"], ["exam_schedule", "Exam Schedule"], ["documents", "My Documents"], ["library", "Library"], ["transport", "Transport"], ["notifications", "Notifications"]] as const;
const inventoryList = [["view", "View / Search Items"], ["add", "Add New Item"], ["edit", "Edit Item"], ["remove", "Remove Item"], ["sr_approval", "SR Approval"]] as const;
const itemSrList = [["view", "View / Search Items"], ["create", "Create SR"], ["history", "View Own SR History"]] as const;
const salaryList = [["salary_view", "View Salary Sheets"], ["salary_status", "View Salary Status"], ["salary_approval", "Approve Salary"], ["salary_payment", "Make Salary Payment"], ["salary_history", "View Salary History"]] as const;
const billList = [["bill_view", "View Bill Payments"], ["bill_create", "Create Bill"], ["bill_edit", "Edit Bill"], ["bill_approve", "Approve Bill"], ["bill_payment", "Make Payment"], ["bill_history", "View Payment History"], ["bill_cancel", "Cancel / Void Bill"], ["bill_reports", "View Reports"]] as const;

const empty = (keys: readonly string[]): BoolMap => Object.fromEntries(keys.map(key => [key, false]));
const allKeys = (...lists: readonly (readonly [string, string])[][]) => lists.flatMap(list => list.map(([key]) => key));

function PermissionSection({ title, description, entries, values, setValues }: { title: string; description: string; entries: readonly (readonly [string, string])[]; values: BoolMap; setValues: Dispatch<SetStateAction<BoolMap>> }) {
  const enabled = entries.reduce((count, [key]) => count + (values[key] ? 1 : 0), 0);
  return (
    <section className="mt-5 w-full rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4">
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Permission Category</p>
          <h3 className="mt-1 text-base font-black break-words">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-[var(--school-muted)] break-words">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-2.5 py-1 text-[10px] font-black">{enabled}/{entries.length}</span>
      </div>
      <div className="mt-3 grid w-full grid-cols-1 gap-2 md:grid-cols-2">
        {entries.map(([key, label]) => (
          <label key={key} className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3">
            <input type="checkbox" checked={Boolean(values[key])} onChange={() => setValues(current => ({ ...current, [key]: !current[key] }))} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words text-sm font-bold leading-5">{label}</span>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${values[key] ? "theme-primary-bg" : "border border-[var(--school-border)] text-[var(--school-muted)]"}`}>{values[key] ? "ON" : "OFF"}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export default function AdminRolesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleCategory, setRoleCategory] = useState("Other Members");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<BoolMap>(() => empty(inventoryList.map(x => x[0])));
  const [itemSr, setItemSr] = useState<BoolMap>(() => empty(itemSrList.map(x => x[0])));
  const [salary, setSalary] = useState<BoolMap>(() => empty(salaryList.map(x => x[0])));
  const [bill, setBill] = useState<BoolMap>(() => empty(billList.map(x => x[0])));
  const [other, setOther] = useState<BoolMap>(() => empty(legacy.map(x => x[0])));
  const [parentPerm, setParentPerm] = useState<BoolMap>(() => empty(parentList.map(x => x[0])));
  const [studentPerm, setStudentPerm] = useState<BoolMap>(() => empty(studentList.map(x => x[0])));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRoles() {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("store_admin_list_member_roles");
    if (rpcError) setError(rpcError.message); else setRoles((data ?? []) as Role[]);
    setLoading(false);
  }

  useEffect(() => { void loadRoles(); }, []);

  function reset() {
    setEditingId(null); setRoleName(""); setRoleCategory("Other Members");
    setInventory(empty(inventoryList.map(x => x[0]))); setItemSr(empty(itemSrList.map(x => x[0])));
    setSalary(empty(salaryList.map(x => x[0]))); setBill(empty(billList.map(x => x[0])));
    setOther(empty(legacy.map(x => x[0]))); setParentPerm(empty(parentList.map(x => x[0]))); setStudentPerm(empty(studentList.map(x => x[0])));
  }

  function editRole(role: Role) {
    const permissions = role.permissions ?? {};
    const objectMap = (value: unknown): BoolMap => value && typeof value === "object" ? value as BoolMap : {};
    const accounts = objectMap(permissions.accounts);
    setEditingId(role.id); setRoleName(role.role_name); setRoleCategory(role.role_category || "Other Members");
    setInventory({ ...empty(inventoryList.map(x => x[0])), ...objectMap(permissions.inventory) });
    setItemSr({ ...empty(itemSrList.map(x => x[0])), ...objectMap(permissions.item_sr) });
    setSalary({ ...empty(salaryList.map(x => x[0])), ...accounts }); setBill({ ...empty(billList.map(x => x[0])), ...accounts });
    setOther(Object.fromEntries(legacy.map(([key]) => [key, Boolean(permissions[key])] )));
    setParentPerm({ ...empty(parentList.map(x => x[0])), ...objectMap(permissions.parent_portal) });
    setStudentPerm({ ...empty(studentList.map(x => x[0])), ...objectMap(permissions.student_portal) });
    setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleAll(value: boolean) {
    setInventory(Object.fromEntries(inventoryList.map(([key]) => [key, value])));
    setItemSr(Object.fromEntries(itemSrList.map(([key]) => [key, value])));
    setSalary(Object.fromEntries(salaryList.map(([key]) => [key, value])));
    setBill(Object.fromEntries(billList.map(([key]) => [key, value])));
    setOther(Object.fromEntries(legacy.map(([key]) => [key, value])));
    setParentPerm(Object.fromEntries(parentList.map(([key]) => [key, value])));
    setStudentPerm(Object.fromEntries(studentList.map(([key]) => [key, value])));
  }

  async function save() {
    if (!roleName.trim()) return;
    setSaving(true); setError(""); setMessage("");
    const permissions = { ...other, inventory, item_sr: itemSr, accounts: { ...salary, ...bill }, parent_portal: parentPerm, student_portal: studentPerm };
    const { error: rpcError } = await supabase.rpc("store_admin_save_member_role", { p_id: editingId, p_role_name: roleName.trim(), p_permissions: permissions, p_role_category: roleCategory });
    if (rpcError) setError(rpcError.message); else { setMessage(editingId ? "Role updated successfully." : "Role created successfully."); reset(); await loadRoles(); }
    setSaving(false);
  }

  async function remove(role: Role) {
    if (role.is_system) return setError("System roles cannot be removed.");
    if (!window.confirm(`Remove role “${role.role_name}”?`)) return;
    const { error: rpcError } = await supabase.rpc("store_admin_remove_member_role", { p_id: role.id });
    if (rpcError) setError(rpcError.message); else { setMessage(`${role.role_name} removed.`); await loadRoles(); }
  }

  const totalPermissions = allKeys(parentList, studentList, inventoryList, itemSrList, salaryList, billList, legacy).length;

  return (
    <AdminPageShell eyebrow="Access Control" title="Role Management" description="Create and manage granular access roles without hard-coding modules to a user type.">
      {error && <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p>}
      <div className="grid w-full min-w-0 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)]">
        <section className="min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Permission Builder</p><h2 className="mt-1 text-xl font-black">{editingId ? "Edit Role" : "Create New Role"}</h2></div>
            {editingId && <button type="button" onClick={reset} className="shrink-0 rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button>}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label><span className="text-xs font-bold text-[var(--school-muted)]">Role Name *</span><input className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-sm" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Parent Coordinator" /></label>
            <label><span className="text-xs font-bold text-[var(--school-muted)]">Role Category</span><select value={roleCategory} onChange={e => setRoleCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-sm">{categories.map(category => <option key={category}>{category}</option>)}</select></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => toggleAll(true)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Enable All</button><button type="button" onClick={() => toggleAll(false)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Disable All</button></div>
          <PermissionSection title="Parent Portal" description="What a Parent can see and do in the portal." entries={parentList} values={parentPerm} setValues={setParentPerm} />
          <PermissionSection title="Student Portal" description="What a Student can see and do in the portal." entries={studentList} values={studentPerm} setValues={setStudentPerm} />
          <PermissionSection title="Inventory" description="Items, stock and SR processing." entries={inventoryList} values={inventory} setValues={setInventory} />
          <PermissionSection title="Item SR" description="Member-side Service Request permissions." entries={itemSrList} values={itemSr} setValues={setItemSr} />
          <PermissionSection title="Accounts • Salary" description="Salary access remains independent from Bill Payments." entries={salaryList} values={salary} setValues={setSalary} />
          <PermissionSection title="Accounts • Bill Payments" description="View, create, edit, approve, pay, history, cancel and report permissions." entries={billList} values={bill} setValues={setBill} />
          <PermissionSection title="Other Permissions" description="Existing non-Accounts permissions remain independent." entries={legacy} values={other} setValues={setOther} />
          <button type="button" disabled={saving || !roleName.trim()} onClick={() => void save()} className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}</button>
          <p className="mt-3 text-center text-[11px] text-[var(--school-muted)]">{totalPermissions} granular permissions available</p>
        </section>

        <section className="min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Role Library</p><h2 className="mt-1 text-xl font-black">Available Roles</h2>
          <div className="mt-5 space-y-3">
            {loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading roles...</p> : roles.length === 0 ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No roles found.</p> : roles.map(role => (
              <article key={role.id} className="w-full rounded-2xl border border-[var(--school-border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="break-words text-sm font-black">{role.role_name}</h3><p className="mt-1 text-[10px] text-[var(--school-muted)]">{role.role_category || "Other Members"}</p></div>
                  <div className="flex shrink-0 gap-2"><button type="button" onClick={() => editRole(role)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button>{!role.is_system && <button type="button" onClick={() => void remove(role)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button>}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
