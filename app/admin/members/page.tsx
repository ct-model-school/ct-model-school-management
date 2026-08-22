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
  password_text: string;
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
};

type FormState = {
  id: string | null;
  member_type: MemberType;
  full_name: string;
  password: string;
  designation: string;
  department: string;
  subject: string;
  qualification: string;
  account_role: string;
  role_title: string;
  phone: string;
  email: string;
  details: string;
  access_role: string;
};

const emptyForm: FormState = {
  id: null,
  member_type: "staff",
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

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function MembersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | MemberType>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMembers() {
    setLoading(true);
    const { data, error } = await supabase.rpc("store_admin_list_members");
    if (error) setMessage(error.message);
    else setMembers((data ?? []) as Member[]);
    setLoading(false);
  }

  useEffect(() => { void loadMembers(); }, []);

  function changeType(memberType: MemberType) {
    setForm((current) => ({ ...current, member_type: memberType, access_role: memberType }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.rpc("store_admin_save_member", {
      p_member_type: form.member_type,
      p_id: form.id,
      p_full_name: form.full_name,
      p_password: form.password || null,
      p_designation: form.designation || null,
      p_department: form.department || null,
      p_subject: form.subject || null,
      p_qualification: form.qualification || null,
      p_account_role: form.account_role || null,
      p_role_title: form.role_title || null,
      p_phone: form.phone || null,
      p_email: form.email || null,
      p_details: form.details || null,
      p_access_role: form.access_role || form.member_type,
    });
    if (error) setMessage(error.message);
    else {
      const result = data as { member_id: string };
      setMessage(form.id ? "Member updated successfully." : `Member created: ${result.member_id}`);
      setForm(emptyForm);
      await loadMembers();
    }
    setSaving(false);
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remove ${member.full_name} (${member.member_id}) from active users?`)) return;
    const { error } = await supabase.rpc("store_admin_deactivate_member", { p_member_type: member.member_type, p_id: member.id });
    if (error) setMessage(error.message);
    else { setMessage("Member removed from active users."); await loadMembers(); }
  }

  const visible = members.filter((member) => {
    if (!member.is_active) return false;
    if (filter !== "all" && member.member_type !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [member.member_id, member.full_name, member.designation, member.department, member.email, member.phone].some((value) => value?.toLowerCase().includes(q));
  });

  return (
    <AdminPageShell eyebrow="Store User Accounts" title="Community Members" description="Create long-term Store IDs for Staff, Teachers, Accounts and Other members. Parents, Students and Committee members are not created here.">
      {message ? <p className="mb-5 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,.75fr)_minmax(0,1.25fr)]">
        <form onSubmit={save} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Admin Add / Edit</p><h2 className="mt-1 text-xl font-black">{form.id ? "Edit Member" : "Create Member ID"}</h2></div>
            {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}
          </div>

          <div className="mt-6 space-y-4">
            <label><span className="label">Member Type *</span><select className="field" value={form.member_type} onChange={(e) => changeType(e.target.value as MemberType)}><option value="staff">Staff</option><option value="teacher">Teacher</option><option value="accounts">Accounts</option><option value="other">Other</option></select></label>
            <label><span className="label">Full Name *</span><input className="field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></label>

            {form.member_type === "teacher" ? <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Assistant Teacher" /></label><label><span className="label">Subject</span><input className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label><label><span className="label">Qualification</span><input className="field" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></label><label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label></div> : null}

            {form.member_type === "accounts" ? <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></label><label><span className="label">Accounts Role *</span><select className="field" value={form.account_role} onChange={(e) => setForm({ ...form, account_role: e.target.value })} required><option value="">Select role</option><option>Accounts Officer</option><option>Accountant</option><option>Cashier</option><option>Billing</option><option>Other Accounts</option></select></label><label className="sm:col-span-2"><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} value={form.department} /></label></div> : null}

            {form.member_type === "staff" ? <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Designation *</span><input className="field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Office Staff / Support Staff" /></label><label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label></div> : null}

            {form.member_type === "other" ? <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Role / Position *</span><input className="field" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} placeholder="ICT / Librarian / Maintenance" /></label><label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label></div> : null}

            <label><span className="label">Access Role *</span><select className="field" value={form.access_role} onChange={(e) => setForm({ ...form, access_role: e.target.value })}>{form.member_type === "accounts" ? <><option>accounts</option><option>store</option></> : null}{form.member_type === "teacher" ? <><option>teacher</option><option>store</option></> : null}{form.member_type === "staff" ? <><option>staff</option><option>store</option></> : null}{form.member_type === "other" ? <><option>other</option><option>store</option></> : null}</select></label>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><label><span className="label">Password {form.id ? "(leave blank to keep current)" : "*"}</span><input className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!form.id} /></label><button type="button" onClick={() => setForm({ ...form, password: generatePassword() })} className="rounded-xl border border-[var(--school-border)] px-4 py-3 text-sm font-bold">Generate</button></div>

            <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Phone</span><input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label><span className="label">Email</span><input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label></div>
            <label><span className="label">Other Details</span><textarea className="field min-h-24 py-3" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></label>
          </div>
          <button disabled={saving} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : form.id ? "Update Member" : "Create Member ID"}</button>
        </form>

        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Active Store Users</p><h2 className="mt-1 text-xl font-black">Member IDs & Passwords</h2></div><div className="flex gap-2"><select className="field w-32" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">All</option><option value="staff">Staff</option><option value="teacher">Teacher</option><option value="accounts">Accounts</option><option value="other">Other</option></select><input className="field min-w-0 sm:w-56" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID / name" /></div></div>
          <div className="mt-5 space-y-3">
            {loading ? <p className="p-6 text-center text-sm text-[var(--school-muted)]">Loading...</p> : null}
            {visible.map((member) => <article key={`${member.member_type}-${member.id}`} className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-black uppercase theme-primary">{member.member_type}</span><b className="theme-primary">{member.member_id}</b></div><h3 className="mt-2 font-black">{member.full_name}</h3><p className="mt-1 text-xs text-[var(--school-muted)]">{member.designation || member.role_title || member.account_role || ""}{member.department ? ` • ${member.department}` : ""}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2 font-mono text-xs">Pass: {member.password_text}</span><button onClick={() => setForm({ id: member.id, member_type: member.member_type, full_name: member.full_name, password: "", designation: member.designation || "", department: member.department || "", subject: member.subject || "", qualification: member.qualification || "", account_role: member.account_role || "", role_title: member.role_title || "", phone: member.phone || "", email: member.email || "", details: member.details || "", access_role: member.access_role || member.member_type })} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => void remove(member)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button></div></div></article>)}
            {!loading && !visible.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No active members found.</p> : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
