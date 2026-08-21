import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function ParentsPage() {
  return (
    <AdminPageShell eyebrow="Academic & People" title="Parents & Guardians" description="Parent and guardian records will be connected after the verified relationship model is mapped.">
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Guardians" description="Parent and guardian identity records." />
        <AdminInfoCard label="Stage" value="Foundation" description="Responsive module shell is ready." />
        <AdminInfoCard label="Dependency" value="Relationships" description="Student-to-guardian relationships must be verified first." />
      </div>
      <div className="mt-5"><AdminEmptyState title="Guardian data is not connected yet" description="No fields or workflows are being guessed until the existing database schema is inspected." /></div>
    </AdminPageShell>
  );
}
