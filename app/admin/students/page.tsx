import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function StudentsPage() {
  return (
    <AdminPageShell
      eyebrow="Academic & People"
      title="Students"
      description="Student registration, records and academic identity will live here after the existing database relationships are mapped and verified."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Student records" description="Registration and core student information." />
        <AdminInfoCard label="Stage" value="Foundation" description="UI shell is ready without inventing database fields." />
        <AdminInfoCard label="Next" value="Schema mapping" description="Database relationships and permissions come first." />
      </div>
      <div className="mt-5">
        <AdminEmptyState title="Student data is not connected yet" description="The module is intentionally waiting for the verified student schema so the implementation does not guess fields, workflows or relationships." />
      </div>
    </AdminPageShell>
  );
}
