"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Registration = {
  id: string;
  application_no: string;
  academic_year: string;
  admission_class: string;
  student_name: string;
  student_name_bn: string | null;
  date_of_birth: string | null;
  gender: string | null;
  father_name: string;
  father_phone: string | null;
  mother_name: string;
  mother_phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  present_address: string;
  permanent_address: string | null;
  email: string | null;
  status: string;
  created_at: string;
};

export default function StudentRegistrationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Registration[]>([]);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("list_student_registration_requests", { p_status: status || null });
    if (rpcError) setError(rpcError.message);
    else setRows((data || []) as Registration[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function approve() {
    if (!selected) return;
    setBusy(true); setError(""); setMessage("");
    const { data, error: rpcError } = await supabase.rpc("approve_student_registration", { p_application_id: selected.id });
    if (rpcError) setError(rpcError.message);
    else {
      const result = Array.isArray(data) ? data[0] : data;
      setMessage(`Approved. Student ID: ${result?.student_id || "created"}`);
      setSelected(null);
      await load();
    }
    setBusy(false);
  }

  async function reject() {
    if (!selected) return;
    const note = window.prompt("Reason for rejection (optional):", "") || "";
    setBusy(true); setError(""); setMessage("");
    const { error: rpcError } = await supabase.rpc("reject_student_registration", { p_application_id: selected.id, p_note: note });
    if (rpcError) setError(rpcError.message);
    else { setMessage("Application rejected."); setSelected(null); await load(); }
    setBusy(false);
  }

  return (
    <AdminPageShell
      eyebrow="Admissions"
      title="Student Registration Review"
      description="Review online admission applications. Approval creates the student master record, parent records and their relationship in one controlled transaction."
      action={{ href: "/register?type=student", label: "Open Registration Form" }}
    >
      {message && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{message}</div>}
      {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {["pending", "reviewing", "approved", "rejected"].map(item => (
          <button key={item} onClick={() => setStatus(item)} className={status === item ? "rounded-full px-4 py-2 text-xs font-black theme-primary-bg" : "rounded-full border border-[var(--school-border)] px-4 py-2 text-xs font-bold text-[var(--school-muted)]"}>{item}</button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-3">
          {loading ? <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-8 text-sm text-[var(--school-muted)]">Loading applications...</div> : null}
          {!loading && rows.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-8 text-center text-sm text-[var(--school-muted)]">No {status} applications.</div> : null}
          {rows.map(row => (
            <button key={row.id} onClick={() => setSelected(row)} className={`w-full rounded-2xl border bg-[var(--school-surface)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selected?.id === row.id ? "border-[var(--school-primary-border)] ring-2 ring-[var(--school-primary-soft)]" : "border-[var(--school-border)]"}`}>
              <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.14em] theme-primary">{row.application_no}</p><h2 className="mt-1 text-base font-black text-[var(--school-text)]">{row.student_name}</h2><p className="mt-1 text-xs text-[var(--school-muted)]">{row.admission_class} · {row.academic_year} · {row.father_name}</p></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-black capitalize theme-primary">{row.status}</span></div>
              <p className="mt-3 text-xs text-[var(--school-muted)]">Submitted {new Date(row.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {!selected ? <div className="rounded-2xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-7 text-sm text-[var(--school-muted)]">Select an application to review the full admission information.</div> : (
            <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] theme-primary">{selected.application_no}</p><h2 className="mt-1 text-xl font-black text-[var(--school-text)]">{selected.student_name}</h2></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-black capitalize theme-primary">{selected.status}</span></div>
              <div className="mt-5 grid gap-4 text-sm">
                <Info label="Admission" value={`${selected.admission_class} · ${selected.academic_year}`} />
                <Info label="Date of Birth" value={selected.date_of_birth || "Not provided"} />
                <Info label="Gender" value={selected.gender || "Not provided"} />
                <Info label="Father" value={`${selected.father_name}${selected.father_phone ? ` · ${selected.father_phone}` : ""}`} />
                <Info label="Mother" value={`${selected.mother_name}${selected.mother_phone ? ` · ${selected.mother_phone}` : ""}`} />
                <Info label="Guardian" value={selected.guardian_name ? `${selected.guardian_name}${selected.guardian_phone ? ` · ${selected.guardian_phone}` : ""}` : "Not provided"} />
                <Info label="Present Address" value={selected.present_address} />
                <Info label="Permanent Address" value={selected.permanent_address || "Not provided"} />
                <Info label="Email" value={selected.email || "Not provided"} />
              </div>
              {(selected.status === "pending" || selected.status === "reviewing") && <div className="mt-6 grid grid-cols-2 gap-3"><button disabled={busy} onClick={reject} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-50">Reject</button><button disabled={busy} onClick={approve} className="rounded-xl px-4 py-3 text-sm font-black theme-primary-bg disabled:opacity-50">{busy ? "Processing..." : "Approve Admission"}</button></div>}
              {selected.status === "approved" && <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800">This application has been converted into a student master record and parent links.</div>}
            </div>
          )}
        </aside>
      </div>
    </AdminPageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[.12em] text-[var(--school-muted)]">{label}</p><p className="mt-1 whitespace-pre-line text-sm font-semibold text-[var(--school-text)]">{value}</p></div>;
}
