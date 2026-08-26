"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Parent = { id: string; parent_id: string; full_name: string; relation_type: string; phone: string; email: string | null; nid: string | null; address: string; is_active: boolean; created_at: string };
type Link = { id: string; student_id: string; parent_id: string; relationship: string; is_primary: boolean; created_at: string };
type ParentRequest = { id: string; registration_no: string; full_name: string; relation_type: string; phone: string; email: string | null; nid: string | null; occupation: string | null; address: string; status: string; parent_id: string | null; created_at: string; admin_note: string | null };
type StudentRequest = { id: string; registration_no: string; parent_id: string; registration_source: string; requested_student_id: string | null; academic_year: string; admission_class: string; section: string | null; student_name: string; student_name_bn: string | null; status: string; student_id: string | null; created_at: string; admin_note: string | null };
type Student = { id: string; student_id: string; full_name: string; admission_class: string; section: string | null; status: string };

const formatDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date(value));
const formatStatus = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function SuperAdminParentWorkspace({ section }: { section: "Parent Accounts" | "Child Binding" | "Approvals" | "Parent Records" }) {
  const supabase = useMemo(() => createClient(), []);
  const [parents, setParents] = useState<Parent[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parentRequests, setParentRequests] = useState<ParentRequest[]>([]);
  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    const [parentsResult, linksResult, studentsResult, parentReqResult, studentReqResult] = await Promise.all([
      supabase.from("parents").select("id,parent_id,full_name,relation_type,phone,email,nid,address,is_active,created_at").order("created_at", { ascending: false }),
      supabase.from("student_parent_links").select("id,student_id,parent_id,relationship,is_primary,created_at").order("created_at", { ascending: false }),
      supabase.from("students").select("id,student_id,full_name,admission_class,section,status").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_parent_registrations", { p_status: null }),
      supabase.rpc("admin_list_parent_student_registrations", { p_status: null }),
    ]);
    const errors = [parentsResult.error, linksResult.error, studentsResult.error, parentReqResult.error, studentReqResult.error].filter(Boolean);
    if (errors.length) setError(errors.map(e => e!.message).join(" • "));
    setParents((parentsResult.data ?? []) as Parent[]);
    setLinks((linksResult.data ?? []) as Link[]);
    setStudents((studentsResult.data ?? []) as Student[]);
    setParentRequests((parentReqResult.data ?? []) as ParentRequest[]);
    setStudentRequests((studentReqResult.data ?? []) as StudentRequest[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function approveParent(id: string) {
    setBusy(id); setError(""); setMessage("");
    const { data, error: rpcError } = await supabase.rpc("parent_approve_registration", { p_request_id: id, p_admin_note: null });
    if (rpcError) setError(rpcError.message); else setMessage(`Parent approved. Permanent Parent ID: ${(data as { parent_id: string }).parent_id}`);
    setBusy(null); await load();
  }

  async function rejectParent(id: string) {
    const note = window.prompt("Reason / note (optional):", ""); if (note === null) return;
    setBusy(id); setError(""); setMessage("");
    const { error: rpcError } = await supabase.rpc("parent_reject_registration", { p_request_id: id, p_note: note || null });
    if (rpcError) setError(rpcError.message); else setMessage("Parent registration rejected.");
    setBusy(null); await load();
  }

  async function approveStudent(id: string) {
    setBusy(id); setError(""); setMessage("");
    const { data, error: rpcError } = await supabase.rpc("admin_approve_parent_student_registration", { p_request_id: id, p_admin_note: null });
    if (rpcError) setError(rpcError.message); else { const result = data as { student_id: string; action?: string }; setMessage(result.action === "bound" ? `Student approved and bound to Student ID: ${result.student_id}` : `Student approved and Student ID created: ${result.student_id}`); }
    setBusy(null); await load();
  }

  async function rejectStudent(id: string) {
    const note = window.prompt("Reason / note (optional):", ""); if (note === null) return;
    setBusy(id); setError(""); setMessage("");
    const { error: rpcError } = await supabase.rpc("admin_reject_parent_student_registration", { p_request_id: id, p_note: note || null });
    if (rpcError) setError(rpcError.message); else setMessage("Child registration rejected.");
    setBusy(null); await load();
  }

  const activeParents = parents.filter(p => p.is_active);
  const pendingParents = parentRequests.filter(r => !["approved", "rejected"].includes(r.status));
  const pendingStudents = studentRequests.filter(r => !["approved", "rejected"].includes(r.status));

  if (loading) return <div className="mt-6 rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-background)] p-10 text-center text-sm text-[var(--school-muted)]">Loading existing database records...</div>;

  return <div className="mt-6 space-y-5">
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
    {message && <div className="rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-bold theme-primary">{message}</div>}

    {section === "Parent Accounts" && <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Live database</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black text-[var(--school-text)]">Parent Accounts</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Approved parent accounts from the existing <code>parents</code> records.</p></div><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-xs font-black theme-primary">{activeParents.length} active</span></div></div>
      {activeParents.length === 0 ? <Empty text="No parent accounts found in the database." /> : <div className="grid gap-4 xl:grid-cols-2">{activeParents.map(parent => <article key={parent.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider theme-primary">{parent.parent_id}</p><h3 className="mt-1 text-lg font-black text-[var(--school-text)]">{parent.full_name}</h3><p className="mt-1 text-xs text-[var(--school-muted)]">{parent.relation_type} • {parent.phone}</p></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">ACTIVE</span></div><div className="mt-4 grid gap-2 text-xs text-[var(--school-muted)]"><p><b className="text-[var(--school-text)]">Email:</b> {parent.email || "-"}</p><p><b className="text-[var(--school-text)]">NID:</b> {parent.nid || "-"}</p><p><b className="text-[var(--school-text)]">Address:</b> {parent.address || "-"}</p><p><b className="text-[var(--school-text)]">Created:</b> {formatDate(parent.created_at)}</p></div></article>)}</div>}
    </div>}

    {section === "Child Binding" && <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Live relationship records</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black text-[var(--school-text)]">Child Binding</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Current Parent–Student links from <code>student_parent_links</code>.</p></div><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-xs font-black theme-primary">{links.length} links</span></div></div>
      {links.length === 0 ? <Empty text="No Parent–Student binding records found." /> : <div className="overflow-hidden rounded-2xl border border-[var(--school-border)]"><div className="grid grid-cols-[1.1fr_1.1fr_0.8fr_0.7fr] gap-4 bg-[var(--school-background)] px-5 py-3 text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]"><span>Parent</span><span>Student</span><span>Relationship</span><span>Primary</span></div><div className="divide-y divide-[var(--school-border)]">{links.map(link => { const parent = parents.find(p => p.id === link.parent_id); const student = students.find(s => s.id === link.student_id); return <div key={link.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.1fr_1.1fr_0.8fr_0.7fr] md:items-center"><div><p className="text-xs font-black text-[var(--school-text)]">{parent?.full_name || "Unknown parent"}</p><p className="mt-1 text-[10px] theme-primary">{parent?.parent_id || link.parent_id}</p></div><div><p className="text-xs font-black text-[var(--school-text)]">{student?.full_name || "Unknown student"}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{student?.student_id || link.student_id}{student?.admission_class ? ` • Class ${student.admission_class}` : ""}</p></div><span className="text-xs font-bold text-[var(--school-muted)]">{link.relationship || "-"}</span><span className="w-fit rounded-full px-2.5 py-1 text-[9px] font-black theme-primary-bg">{link.is_primary ? "YES" : "NO"}</span></div>; })}</div></div>}
    </div>}

    {section === "Approvals" && <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Action queue</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black text-[var(--school-text)]">Approvals</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Only existing registration requests that still require admin action.</p></div><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-xs font-black theme-primary">{pendingParents.length + pendingStudents.length} pending</span></div></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-3"><h3 className="text-sm font-black text-[var(--school-text)]">Parent registrations ({pendingParents.length})</h3>{pendingParents.length === 0 ? <Empty text="No pending parent registrations." /> : pendingParents.map(r => <article key={r.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-wider theme-primary">{r.registration_no}</p><h4 className="mt-1 text-lg font-black">{r.full_name}</h4><p className="mt-1 text-xs text-[var(--school-muted)]">{r.relation_type} • {r.phone}</p></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">{formatStatus(r.status)}</span></div><p className="mt-3 text-xs text-[var(--school-muted)]">{r.email || "No email"} • {r.occupation || "Occupation not provided"}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy === r.id} onClick={() => void approveParent(r.id)} className="rounded-xl px-4 py-2.5 text-xs font-black theme-primary-bg">{busy === r.id ? "Processing..." : "Approve & Create Parent ID"}</button><button disabled={busy === r.id} onClick={() => void rejectParent(r.id)} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black text-red-600">Reject</button></div></article>)}</div>
        <div className="space-y-3"><h3 className="text-sm font-black text-[var(--school-text)]">Child registrations ({pendingStudents.length})</h3>{pendingStudents.length === 0 ? <Empty text="No pending child registrations." /> : pendingStudents.map(r => <article key={r.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-wider theme-primary">{r.registration_no}</p><h4 className="mt-1 text-lg font-black">{r.student_name}</h4><p className="mt-1 text-xs text-[var(--school-muted)]">Class {r.admission_class}{r.section ? ` • Section ${r.section}` : ""} • {r.academic_year}</p></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">{formatStatus(r.status)}</span></div><p className="mt-3 text-xs text-[var(--school-muted)]">Parent: {parents.find(p => p.id === r.parent_id)?.full_name || r.parent_id}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy === r.id} onClick={() => void approveStudent(r.id)} className="rounded-xl px-4 py-2.5 text-xs font-black theme-primary-bg">{busy === r.id ? "Processing..." : "Approve & Create / Bind Student ID"}</button><button disabled={busy === r.id} onClick={() => void rejectStudent(r.id)} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black text-red-600">Reject</button></div></article>)}</div>
      </div>
    </div>}

    {section === "Parent Records" && <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Complete parent view</p><h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">Parent Records</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Existing parent accounts with their current child-binding count.</p></div>
      {parents.length === 0 ? <Empty text="No parent records found in the database." /> : <div className="grid gap-4 xl:grid-cols-2">{parents.map(parent => { const childCount = links.filter(l => l.parent_id === parent.id).length; return <article key={parent.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider theme-primary">{parent.parent_id}</p><h3 className="mt-1 text-xl font-black text-[var(--school-text)]">{parent.full_name}</h3><p className="mt-1 text-xs text-[var(--school-muted)]">{parent.relation_type} • {parent.phone}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${parent.is_active ? "theme-primary-bg" : "bg-[var(--school-background)] text-[var(--school-muted)]"}`}>{parent.is_active ? "ACTIVE" : "INACTIVE"}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Children</p><p className="mt-1 text-lg font-black theme-primary">{childCount}</p></div><div className="rounded-xl bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Created</p><p className="mt-1 text-xs font-black text-[var(--school-text)]">{formatDate(parent.created_at)}</p></div></div><div className="mt-3 space-y-1 text-xs text-[var(--school-muted)]"><p>Email: {parent.email || "-"}</p><p>NID: {parent.nid || "-"}</p><p>Address: {parent.address || "-"}</p></div></article>; })}</div>}
    </div>}
  </div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-background)] p-10 text-center text-sm text-[var(--school-muted)]">{text}</div>; }
