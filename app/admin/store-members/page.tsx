"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type MemberType = "staff" | "teacher" | "accounts" | "other";
type Member = {
  id: string;
  member_id: string;
  member_type: MemberType;
  full_name: string;
  designation: string | null;
  department: string | null;
  subject: string | null;
  qualification: string | null;
  account_role: string | null;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  details: string | null;
  access_role: string;
  is_active: boolean;
  created_at: string;
};

type CredentialResult = { member_id: string; password: string };

const emptyForm = {
  id: null as string | null,
  member_type: "staff" as MemberType,
  full_name: "",
  password: "",
  designation: "",
  department: "",
  subject: "",
  qualification: "",
  account_role: "",
  role_title: "",
  phone: "",
  email: "",
  details: "",
  access_role: "staff",
};

const roleOptions = [
  { value: "staff", label: "Staff" },
  { value: "teacher", label: "Teacher" },
  { value: "accounts", label: "Accounts" },
  { value: "other", label: "Other" },
];

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  const values = new Uint32Array(12);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

export default function StoreMembersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState(emptyForm);
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<MemberType | "all">("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [issuedCredential, setIssuedCredential] = useState<CredentialResult | null>(null);

  async function loadMembers() {
    setLoading(true);
    const { data, error } = await supabase.rpc("store_admin_list_members");
    if (error) setMessage(error.message);
    else setMembers((data ?? []) as Member[]);
    setLoading(false);
  }

  useEffect(() => { void loadMembers(); }, []);

  function resetForm() {
    setForm({ ...emptyForm });
  }

  function changeType(value: MemberType) {
    setForm((current) => ({ ...current, member_type: value, access_role: value, password: "" }));
  }

  function fillGeneratedPassword() {
    setForm((current) => ({ ...current, password: generatePassword() }));
  }

  async function saveMember(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIssuedCredential(null);

    const { data, error } = await supabase.rpc("store_admin_save_member", {
      p_member_type: form.member_type,
      p_id: form.id,
      p_full_name: form.full_name,
      p_password: form.password || null,
      p_designation: form.designation,
      p_department: form.department,
      p_subject: form.subject,
      p_qualification: form.qualification,
      p_account_role: form.account_role,
      p_role_title: form.role_title,
      p_phone: form.phone,
      p_email: form.email,
      p_details: form.details,
      p_access_role: form.access_role,
    });

    if (error) {
      setMessage(error.message);
    } else {
      const result = data as { member_id: string; password?: string | null };
      setMessage(form.id ? "Member updated successfully." : `Member created: ${result.member_id}`);
      if (result.password) setIssuedCredential({ member_id: result.member_id, password: result.password });
      resetForm();
      await loadMembers();
    }
    setSaving(false);
  }

  function editMember(member: Member) {
    setIssuedCredential(null);
    setForm({
      id: member.id,
      member_type: member.member_type,
      full_name: member.full_name,
      password: "",
      designation: member.designation || "",
      department: member.department || "",
      subject: member.subject || "",
      qualification: member.qualification || "",
      account_role: member.account_role || "",
      role_title: member.role_title || "",
      phone: member.phone || "",
      email: member.email || "",
      details: member.details || "",
      access_role: member.access_role,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function resetMemberPassword(member: Member) {
    if (!window.confirm(`Generate a new password for ${member.member_id} (${member.full_name})? The current password will stop working.`)) return;
    setSaving(true);
    setMessage("");
    setIssuedCredential(null);
    const { data, error } = await supabase.rpc("store_admin_reset_member_password", {
      p_member_type: member.member_type,
      p_id: member.id,
    });
    if (error) setMessage(error.message);
    else {
      const result = data as CredentialResult;
      setIssuedCredential(result);
      setMessage(`${result.member_id} password reset successfully.`);
      await loadMembers();
    }
    setSaving(false);
  }

  async function deactivateMember(member: Member) {
    if (!window.confirm(`Remove ${member.member_id} (${member.full_name}) from active Store users?`)) return;
    setSaving(true);
    const { error } = await supabase.rpc("store_admin_deactivate_member", { p_member_type: member.member_type, p_id: member.id });
    if (error) setMessage(error.message);
    else { setMessage(`${member.member_id} deactivated.`); await loadMembers(); }
    setSaving(false);
  }

  const visibleMembers = members.filter((member) => {
    if (filter !== "all" && member.member_type !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [member.member_id, member.full_name, member.designation, member.department, member.access_role, member.email, member.phone].some((value) => value?.toLowerCase().includes(q));
  });

  const isTeacher = form.member_type === "teacher";
  const isAccounts = form.member_type === "accounts";
  const isOther = form.member_type === "other";

  return (
    <AdminPageShell
      eyebrow="Store & Community Access"
      title="Store User Management"
      description="Create and manage Store login accounts for Staff, Teachers, Accounts and other authorized community members. Parents, Students and Committee members are intentionally excluded here."
    >
      {issuedCredential ? (
        <section className="mb-6 rounded-3xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Credential issued once</p>
          <h2 className="mt-1 text-lg font-black">Provide this credential to the user now</h2>
          <p className="mt-1 text-sm text-[var(--school-muted)]">For security, the password is not saved in plaintext and will not appear in the member list again. If it is lost later, use Reset Password to issue a new one.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4"><span className="label">Store ID</span><p className="mt-1 font-mono text-lg font-black theme-primary">{issuedCredential.member_id}</p></div>
            <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4"><span className="label">New Password</span><p className="mt-1 break-all font-mono text-lg font-black">{issuedCredential.password}</p></div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,.75fr)_minmax(0,1.25fr)]">
        <form onSubmit={saveMember} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Authorized Community</p>
              <h2 className="mt-1 text-xl font-black">{form.id ? "Edit Member" : "Create Member ID"}</h2>
              <p className="mt-1 text-sm text-[var(--school-muted)]">ID is generated automatically from the selected role.</p>
            </div>
            {form.id ? <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Member Type *</span><select className="field" value={form.member_type} onChange={(e) => changeType(e.target.value as MemberType)}>{roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            {form.id ? <label className="sm:col-span-2"><span className="label">Member ID</span><input className="field bg-[var(--school-background)] font-bold" value={members.find((m) => m.id === form.id)?.member_id || ""} readOnly /></label> : null}
            <label className="sm:col-span-2"><span className="label">Full Name *</span><input className="field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></label>
            <div className="sm:col-span-2">
              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1"><span className="label">Password {form.id ? "(leave blank to keep)" : "*"}</span><input className="field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required={!form.id} autoComplete="new-password" /></label>
                <button type="button" onClick={fillGeneratedPassword} className="rounded-xl border border-[var(--school-border)] px-4 py-3 text-xs font-bold">Generate</button>
              </div>
            </div>
            <label><span className="label">Access Role *</span><select className="field" value={form.access_role} onChange={(e) => setForm({ ...form, access_role: e.target.value })}>{roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}<option value="store">Store</option></select></label>

            {isTeacher ? <>
              <label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Assistant Teacher / Lecturer" /></label>
              <label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
              <label><span className="label">Subject</span><input className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
              <label><span className="label">Qualification</span><input className="field" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></label>
            </> : null}

            {form.member_type === "staff" ? <>
              <label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Office Staff / Lab Assistant" /></label>
              <label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
            </> : null}

            {isAccounts ? <>
              <label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></label>
              <label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
              <label className="sm:col-span-2"><span className="label">Accounts Role</span><input className="field" value={form.account_role} onChange={(e) => setForm({ ...form, account_role: e.target.value })} placeholder="Accountant / Cashier / Finance Officer" /></label>
            </> : null}

            {isOther ? <>
              <label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></label>
              <label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
              <label className="sm:col-span-2"><span className="label">Role Title</span><input className="field" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} placeholder="Authorized community role" /></label>
            </> : null}

            <label><span className="label">Phone</span><input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label><span className="label">Email</span><input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="sm:col-span-2"><span className="label">Other Details</span><textarea className="field min-h-24 py-3" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></label>
          </div>

          <button disabled={saving} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : form.id ? "Update Member" : "Create Member ID"}</button>
          {message ? <p className="mt-4 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
        </form>

        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div><h2 className="text-xl font-black">All Store Members</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Passwords are never displayed or stored in plaintext. Admin can issue a new password whenever needed.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><select className="field sm:w-36" value={filter} onChange={(e) => setFilter(e.target.value as MemberType | "all")}><option value="all">All</option>{roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><input className="field sm:w-64" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID / name / role" /></div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead><tr className="border-b border-[var(--school-border)]"><th className="px-3 py-3">ID</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">Type / Role</th><th className="px-3 py-3">Department</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead>
              <tbody>
                {visibleMembers.map((member) => <tr key={member.id} className="border-b border-[var(--school-border)] last:border-0"><td className="px-3 py-4 font-black theme-primary">{member.member_id}</td><td className="px-3 py-4"><b>{member.full_name}</b><div className="text-xs text-[var(--school-muted)]">{member.designation || member.role_title || ""}</div></td><td className="px-3 py-4 capitalize">{member.member_type}<div className="text-xs text-[var(--school-muted)]">{member.access_role}</div></td><td className="px-3 py-4">{member.department || "-"}</td><td className="px-3 py-4"><span className="rounded-full border border-[var(--school-border)] px-2 py-1 text-xs font-bold">{member.is_active ? "Active" : "Inactive"}</span></td><td className="px-3 py-4"><div className="flex flex-wrap gap-2"><button onClick={() => editMember(member)} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button>{member.is_active ? <button disabled={saving} onClick={() => void resetMemberPassword(member)} className="rounded-lg border border-[var(--school-primary-border)] px-3 py-2 text-xs font-bold theme-primary disabled:opacity-50">Reset Password</button> : null}{member.is_active ? <button disabled={saving} onClick={() => void deactivateMember(member)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">Remove</button> : null}</div></td></tr>)}
              </tbody>
            </table>
            {!loading && !visibleMembers.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No Store members found.</p> : null}
            {loading ? <p className="p-8 text-center text-sm text-[var(--school-muted)]">Loading members...</p> : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
