import Link from "next/link";
import { AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function StudentsPage() {
  return (
    <AdminPageShell
      eyebrow="Academic & People"
      title="Students"
      description="Student master records are created from approved admission applications, with parent relationships and a ready fee ledger."
      action={{ href: "/admin/students/registrations", label: "Admission Applications" }}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Admission" value="Review → Approve" description="Every online application remains pending until an administrator approves it." />
        <AdminInfoCard label="Identity" value="STU-YYYY-0001" description="Approval generates a unique student ID for the master record." />
        <AdminInfoCard label="Family" value="Parent linked" description="Father, mother and optional guardian records are linked to the student." />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Link href="/admin/students/registrations" className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-black uppercase tracking-[.15em] theme-primary">Admissions</p>
          <h2 className="mt-2 text-xl font-black text-[var(--school-text)]">Student Registration Applications</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Review submitted applications, inspect family information, approve admission or reject with a reason.</p>
          <span className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-black theme-primary-bg">Open Applications →</span>
        </Link>
        <div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[.15em] theme-primary">Post Approval</p>
          <h2 className="mt-2 text-xl font-black text-[var(--school-text)]">Controlled Student Creation</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--school-muted)]">
            <li>• Creates the student master record.</li>
            <li>• Generates the Student ID.</li>
            <li>• Creates Father/Mother/Guardian parent records as applicable.</li>
            <li>• Links parents to the student.</li>
            <li>• Keeps a dedicated fee ledger ready for future charges and payments.</li>
          </ul>
        </div>
      </div>
    </AdminPageShell>
  );
}
