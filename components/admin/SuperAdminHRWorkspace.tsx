"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  member_id: string;
  member_type: "teacher" | "staff";
  full_name: string;
  designation: string | null;
  department: string | null;
  subject: string | null;
  qualification: string | null;
  salary: number;
  phone: string | null;
  email: string | null;
  joining_date?: string | null;
  is_active: boolean;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default function SuperAdminHRWorkspace({ section }: { section: "Staff & Teachers" | "Attendance" | "Payroll" | "Monthly Salary Sheet" }) {
  const supabase = useMemo(() => createClient(), []);
  const [members, setMembers] = useState<Member[]>([]);
  const [idSearch, setIdSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [designationSearch, setDesignationSearch] = useState("");
  const [type, setType] = useState<"all" | "teacher" | "staff">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("store_hr_admin_list_members", { p_search: null });
    if (rpcError) {
      setError(rpcError.message);
      setMembers([]);
    } else {
      setMembers((data ?? []) as Member[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const filtered = useMemo(() => members.filter(member => {
    const matchesType = type === "all" || member.member_type === type;
    const matchesId = !idSearch || normalize(member.member_id).includes(normalize(idSearch));
    const matchesName = !nameSearch || normalize(member.full_name).includes(normalize(nameSearch));
    const matchesDepartment = !departmentSearch || normalize(member.department).includes(normalize(departmentSearch));
    const matchesDesignation = !designationSearch || normalize(member.designation).includes(normalize(designationSearch));
    return matchesType && matchesId && matchesName && matchesDepartment && matchesDesignation;
  }), [members, type, idSearch, nameSearch, departmentSearch, designationSearch]);

  const teachers = members.filter(member => member.member_type === "teacher").length;
  const staff = members.filter(member => member.member_type === "staff").length;

  if (section !== "Staff & Teachers") {
    return <div className="mt-5 rounded-3xl border border-[var(--school-border)] bg-[var(--school-background)] p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Human Resources</p><h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">{section}</h2><p className="mt-2 text-sm text-[var(--school-muted)]">This section is connected to the existing HR workflow. Open the dedicated HR workspace for attendance and payroll operations.</p><a href="/admin/hr" className="mt-5 inline-flex rounded-xl theme-primary-bg px-4 py-2.5 text-xs font-black">Open HR Workspace →</a></div>;
  }

  return <div className="mt-5 space-y-5">
    <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Live database</p><h2 className="mt-1 text-2xl font-black text-[var(--school-text)]">Staff & Teachers</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Live active Teacher and Staff records from the HR database.</p></div>
        <div className="grid grid-cols-3 gap-2 sm:w-[360px]"><Stat label="Teachers" value={teachers} /><Stat label="Staff" value={staff} /><Stat label="Showing" value={filtered.length} primary /></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SearchInput label="Member ID" value={idSearch} onChange={setIdSearch} placeholder="TCID / STID" />
        <SearchInput label="Name" value={nameSearch} onChange={setNameSearch} placeholder="Search name" />
        <SearchInput label="Department" value={departmentSearch} onChange={setDepartmentSearch} placeholder="Search department" />
        <SearchInput label="Designation" value={designationSearch} onChange={setDesignationSearch} placeholder="Search designation" />
        <label className="text-[10px] font-bold text-[var(--school-muted)]">Member Type<select value={type} onChange={e => setType(e.target.value as typeof type)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-3 text-xs font-bold text-[var(--school-text)]"><option value="all">All</option><option value="teacher">Teacher</option><option value="staff">Staff</option></select></label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3"><p className="text-[10px] text-[var(--school-muted)]">Multiple fields work together. ID + Name + Department can be searched at the same time.</p><button type="button" onClick={() => { setIdSearch(""); setNameSearch(""); setDepartmentSearch(""); setDesignationSearch(""); setType("all"); }} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] px-3 py-2 text-[10px] font-black text-[var(--school-muted)]">Clear</button></div>
    </section>

    <section className="overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm">
      <div className="border-b border-[var(--school-border)] px-5 py-4 sm:px-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Database records</p><p className="mt-1 text-xs text-[var(--school-muted)]">No demo or hardcoded member data.</p></div>
      {error ? <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</div> : loading ? <div className="p-10 text-center text-sm text-[var(--school-muted)]">Loading live staff and teacher records...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-[var(--school-muted)]">No matching active staff or teacher records found.</div> : <div className="overflow-x-auto"><table className="min-w-[980px] w-full"><thead><tr className="border-b border-[var(--school-border)] bg-[var(--school-background)] text-left text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]"><th className="px-5 py-3">ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Designation</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-[var(--school-border)]">{filtered.map(member => <tr key={`${member.member_type}-${member.member_id}`} className="hover:bg-[var(--school-background)]"><td className="px-5 py-4 text-xs font-black theme-primary">{member.member_id}</td><td className="px-5 py-4"><p className="text-xs font-black text-[var(--school-text)]">{member.full_name}</p><p className="mt-0.5 text-[10px] text-[var(--school-muted)]">{member.email || "No email"}</p></td><td className="px-5 py-4"><span className="rounded-full border border-[var(--school-border)] bg-[var(--school-background)] px-2.5 py-1 text-[9px] font-black capitalize text-[var(--school-muted)]">{member.member_type}</span></td><td className="px-5 py-4 text-xs text-[var(--school-muted)]">{member.designation || "—"}</td><td className="px-5 py-4 text-xs text-[var(--school-muted)]">{member.department || "—"}</td><td className="px-5 py-4 text-xs text-[var(--school-muted)]">{member.subject || "—"}</td><td className="px-5 py-4 text-xs text-[var(--school-muted)]">{member.phone || "—"}</td><td className="px-5 py-4"><span className="rounded-full border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">Active</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function SearchInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="text-[10px] font-bold text-[var(--school-muted)]">{label}<input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-3 text-xs font-bold text-[var(--school-text)] outline-none focus:border-[var(--school-primary-border)]" autoComplete="off" /></label>;
}

function Stat({ label, value, primary = false }: { label: string; value: number; primary?: boolean }) {
  return <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">{label}</p><p className={`mt-1 text-lg font-black ${primary ? "theme-primary" : "text-[var(--school-text)]"}`}>{value}</p></div>;
}
