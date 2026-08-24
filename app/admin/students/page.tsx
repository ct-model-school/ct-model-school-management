import Link from "next/link";
import { AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function StudentsPage() {
  return (
    <AdminPageShell
      eyebrow="Academic & People"
      title="Students"
      description="Student master records, New Student Admission approvals and Existing Student Registration updates are managed from one Admin area."
      action={{ href: "/admin/students/registrations", label: "Admission Applications" }}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Admission" value="Review → Approve" description="New student applications remain pending until an administrator approves them." />
        <AdminInfoCard label="Existing Student" value="Update → Approve" description="Existing students can submit registration updates without creating a duplicate student." />
        <AdminInfoCard label="Identity" value="STU-YYYY-0001" description="Approved admission creates a unique Student ID for the master record." />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Link href="/admin/students/registrations" className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-black uppercase tracking-[.15em] theme-primary">New Student Admission</p>
          <h2 className="mt-2 text-xl font-black text-[var(--school-text)]">Admission Applications</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Review submitted applications, inspect family information, approve admission or reject with a reason.</p>
          <span className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-black theme-primary-bg">Open Applications →</span>
        </Link>
        <Link href="/admin/students/existing-registrations" className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-black uppercase tracking-[.15em] theme-primary">Existing Student</p>
          <h2 className="mt-2 text-xl font-black text-[var(--school-text)]">Existing Registration Updates</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Review updates submitted using an existing Student ID and approve changes to contact, address and class information.</p>
          <span className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-black theme-primary-bg">Open Existing Requests →</span>
        </Link>
      </div>

      <div className="mt-5 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.15em] theme-primary">Post Approval</p>
        <h2 className="mt-2 text-xl font-black text-[var(--school-text)]">Controlled Student Data Flow</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--school-muted)] text-[var(--school-muted)]">
          <li>• New admission approval creates the student master record and Student ID.</li>
          <li>• Father, Mother and optional Guardian records are created and linked where applicable.</li>
          <li>• Existing Student Registration updates the existing record only after Admin approval.</li>
          <li>• No duplicate student is created from an existing Student ID registration.</li>
        </ul>
      </div>
    </AdminPageShell>
  );
}
