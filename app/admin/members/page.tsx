"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type MemberType = "staff" | "teacher" | "accounts" | "other";
type Member = {
  member_type: MemberType; id: string; member_id: string; full_name: string; role: string;
  designation: string | null; department: string | null; subject: string | null; qualification: string | null;
  qualification_point: number | null; grade: string | null; institute_name: string | null; account_role: string | null;
  role_title: string | null; salary: number | null; phone: string | null; email: string | null; whatsapp: string | null;
  nid: string | null; address: string | null; joining_date: string | null; photo_url: string | null; details: string | null; is_active: boolean;
};
type FormState = {
  id: string | null; type: MemberType; full_name: string; password: string; role: string; designation: string; department: string;
  subject: string; account_role: string; role_title: string; salary: string; qualification: string; qualification_point: string;
  grade: string; institute_name: string; email: string; phone: string; whatsapp: string; nid: string; address: string;
  joining_date: string; photo_url: string; details: string;
};
const blank: FormState = { id: null, type: "staff", full_name: "", password: "", role: "Staff", designation: "", department: "", subject: "", account_role: "Accounts Manager", role_title: "", salary: "", qualification: "", qualification_point: "", grade: "", institute_name: "", email: "", phone: "", whatsapp: "", nid: "", address: "", joining_date: "", photo_url: "", details: "" };
const defaults = (t: MemberType): Partial<FormState> => t === "teacher" ? { role: "Teacher", designation: "Teacher", department: "Academic" } : t === "accounts" ? { role: "Accounts", designation: "Accounts", department: "Accounts", account_role: "Accounts Manager" } : t === "other" ? { role: "Other", designation: "", department: "" } : { role: "Staff", designation: "", department: "" };
const idPrefix = (t: MemberType) => t === "staff" ? "STID00001" : t === "teacher" ? "TCID00001" : t === "accounts" ? "ACID00001" : "OTID00001";
const departments = ["Administration", "Academic", "Accounts", "Examination", "Library", "ICT", "Maintenance", "Store", "Other"];
const accountRoles = ["Accounts Manager", "Accounts Officer", "Accountant", "Cashier", "Billing Officer", "Finance Officer", "Other Accounts"];

export default function MembersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [type, setType] = useState<MemberType>("staff"); const [members, setMembers] = useState<Member[]>([]); const [form, setForm] = useState<FormState>({ ...blank });
  const [search, setSearch] = useState(""); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  async function load() { setLoading(true); const { data, error } = await supabase.rpc("store_admin_list_members", { p_member_type: type, p_search: search || null }); if (error) setMessage(error.message); else setMembers((data ?? []) as Member[]); setLoading(false); }
  useEffect(() => { void load(); }, [type]);
  function changeType(t: MemberType) { setType(t); setForm({ ...blank, type: t, ...defaults(t) }); setMessage(""); }
  function edit(m: Member) { setForm({ ...blank, type: m.member_type, id: m.id, full_name: m.full_name, password: "", role: m.role, designation: m.designation || "", department: m.department || "", subject: m.subject || "", account_role: m.account_role || "Accounts Manager", role_title: m.role_title || "", salary: m.salary == null ? "" : String(m.salary), qualification: m.qualification || "", qualification_point: m.qualification_point == null ? "" : String(m.qualification_point), grade: m.grade || "", institute_name: m.institute_name || "", email: m.email || "", phone: m.phone || "", whatsapp: m.whatsapp || "", nid: m.nid || "", address: m.address || "", joining_date: m.joining_date || "", photo_url: m.photo_url || "", details: m.details || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("");
    const { data, error } = await supabase.rpc("store_admin_save_member", {
      p_member_type: form.type, p_id: form.id, p_full_name: form.full_name, p_password: form.password || null,
      p_designation: form.designation, p_department: form.department, p_subject: form.subject || null, p_qualification: form.qualification || null,
      p_qualification_point: form.qualification_point === "" ? null : Number(form.qualification_point), p_grade: form.grade || null,
      p_institute_name: form.institute_name || null, p_salary: form.salary === "" ? null : Number(form.salary), p_account_role: form.account_role || null,
      p_role_title: form.role_title || null, p_phone: form.phone, p_email: form.email, p_whatsapp: form.whatsapp, p_nid: form.nid,
      p_address: form.address, p_joining_date: form.joining_date || null, p_photo_url: form.photo_url, p_details: form.details, p_access_role: form.role,
    });
    if (error) setMessage(error.message); else { setMessage(form.id ? "Member updated successfully." : `Member created: ${(data as { member_id: string }).member_id}`); setForm({ ...blank, type: form.type, ...defaults(form.type) }); await load(); }
    setSaving(false);
  }
  async function remove(m: Member) { if (!window.confirm(`Remove ${m.full_name} (${m.member_id})?`)) return; const { error } = await supabase.rpc("store_admin_remove_member", { p_member_type: m.member_type, p_id: m.id }); if (error) setMessage(error.message); else { setMessage(`${m.member_id} removed.`); await load(); } }
  const visible = members.filter((m) => { const q = search.trim().toLowerCase(); return !q || [m.member_id, m.full_name, m.role, m.designation, m.department, m.qualification, m.institute_name, m.email, m.phone].some((v) => v?.toLowerCase().includes(q)); });
  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <AdminPageShell eyebrow="Community Access" title="Staff, Teachers, Accounts & Others" description="Admin-created internal members only. Parents, Students and Management Committee are excluded because they use their own registration/profile flows.">
    <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{(["staff", "teacher", "accounts", "other"] as MemberType[]).map((t) => <button key={t} onClick={() => changeType(t)} className={`rounded-xl px-4 py-3 text-sm font-bold capitalize ${type === t ? "theme-primary-bg" : "border border-[var(--school-border)] bg-[var(--school-surface)]"}`}>{t}</button>)}</div>
    {message ? <p className="mb-5 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(360px,.72fr)_minmax(0,1.28fr)]">
      <form onSubmit={save} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 md:p-7">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black sm:text-2xl">{form.id ? "Edit" : "Add"} {type}</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)] sm:text-sm">ID is generated automatically: {idPrefix(type)} and increases for every new member.</p></div>{form.id ? <button type="button" onClick={() => setForm({ ...blank, type, ...defaults(type) })} className="shrink-0 rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}</div>
        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
          <label className="sm:col-span-2"><span className="label">Full Name *</span><input className="field w-full" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></label>
          <label><span className="label">Password {form.id ? "(leave blank to keep current)" : "*"}</span><input className="field w-full" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required={!form.id} minLength={8} /></label>
          <label><span className="label">Role *</span><input className="field w-full" value={form.role} onChange={(e) => set("role", e.target.value)} required /></label>
          {type === "teacher" ? <label className="sm:col-span-2"><span className="label">Subject</span><input className="field w-full" value={form.subject} onChange={(e) => set("subject", e.target.value)} /></label> : null}
          {type === "accounts" ? <label className="sm:col-span-2"><span className="label">Accounts Role</span><select className="field w-full" value={form.account_role} onChange={(e) => set("account_role", e.target.value)}>{accountRoles.map((x) => <option key={x}>{x}</option>)}</select></label> : null}
          {type === "other" ? <label className="sm:col-span-2"><span className="label">Role / Position</span><input className="field w-full" value={form.role_title} onChange={(e) => set("role_title", e.target.value)} placeholder="ICT / Maintenance / Librarian" /></label> : null}
          <label><span className="label">Designation</span><input className="field w-full" value={form.designation} onChange={(e) => set("designation", e.target.value)} /></label>
          <label><span className="label">Department</span><select className="field w-full" value={form.department} onChange={(e) => set("department", e.target.value)}><option value="">Select</option>{departments.map((x) => <option key={x}>{x}</option>)}</select></label>
          {(type === "staff" || type === "teacher" || type === "accounts") ? <label><span className="label">Salary</span><input className="field w-full" type="number" min="0" step="0.01" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="Monthly salary" /></label> : null}
          {(type === "teacher" || type === "accounts") ? <><label><span className="label">Qualification</span><input className="field w-full" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="B.Sc / M.A / MBA" /></label><label><span className="label">Qualification Point</span><input className="field w-full" type="number" min="0" step="0.01" value={form.qualification_point} onChange={(e) => set("qualification_point", e.target.value)} /></label><label><span className="label">Grade</span><input className="field w-full" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="A+ / First Class" /></label><label><span className="label">Institute Name</span><input className="field w-full" value={form.institute_name} onChange={(e) => set("institute_name", e.target.value)} /></label></> : null}
          <label><span className="label">Email</span><input className="field w-full" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label><label><span className="label">Phone</span><input className="field w-full" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label><label><span className="label">WhatsApp</span><input className="field w-full" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></label><label><span className="label">NID</span><input className="field w-full" value={form.nid} onChange={(e) => set("nid", e.target.value)} /></label><label><span className="label">Joining Date</span><input className="field w-full" type="date" value={form.joining_date} onChange={(e) => set("joining_date", e.target.value)} /></label><label><span className="label">Photo URL</span><input className="field w-full" value={form.photo_url} onChange={(e) => set("photo_url", e.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Address</span><textarea className="field min-h-28 w-full py-3" value={form.address} onChange={(e) => set("address", e.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Other Details</span><textarea className="field min-h-28 w-full py-3" value={form.details} onChange={(e) => set("details", e.target.value)} placeholder="Write any additional information here..." /></label>
        </div>
        <button disabled={saving} className="mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : form.id ? "Update Member" : "Create Member & Generate ID"}</button>
      </form>
      <section className="min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black capitalize sm:text-2xl">{type} Members</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)] sm:text-sm">Admin-only member records.</p></div><div className="flex w-full gap-2 sm:w-auto"><input className="field min-w-0 flex-1 sm:w-64" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID / name" /><button onClick={() => void load()} className="rounded-xl px-4 py-3 text-sm font-bold theme-primary-bg">Search</button></div></div>
        <div className="mt-5 space-y-3">{loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading...</p> : null}{visible.map((m) => <article key={m.id} className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><p className="text-xs font-black theme-primary">{m.member_id}</p><h3 className="mt-1 break-words font-black">{m.full_name}</h3><p className="break-words text-xs text-[var(--school-muted)]">{m.role}{m.designation ? ` • ${m.designation}` : ""}{m.department ? ` • ${m.department}` : ""}{m.subject ? ` • ${m.subject}` : ""}</p>{(m.salary != null || m.qualification || m.grade || m.institute_name) ? <p className="mt-2 break-words text-xs text-[var(--school-muted)]">{m.salary != null ? `Salary: ${m.salary}` : ""}{m.qualification ? ` • ${m.qualification}` : ""}{m.grade ? ` • ${m.grade}` : ""}{m.institute_name ? ` • ${m.institute_name}` : ""}</p> : null}</div><div className="flex gap-2"><button onClick={() => edit(m)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => void remove(m)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button></div></div></article>)}{!loading && !visible.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No members found.</p> : null}</div>
      </section>
    </div>
  </AdminPageShell>;
}
