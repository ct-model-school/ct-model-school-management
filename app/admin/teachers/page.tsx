import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function TeachersPage() {
  return (
    <AdminPageShell eyebrow="Academic & People" title="Teachers & Staff" description="Teacher and staff management will be implemented from the verified personnel and role model.">
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Staff records" description="Teacher and staff identity management." />
        <AdminInfoCard label="Stage" value="Foundation" description="Module presentation is ready for the data layer." />
        <AdminInfoCard label="Dependency" value="Roles" description="Existing role and permission structures will guide access." />
      </div>
      <div className="mt-5"><AdminEmptyState title="Staff data is not connected yet" description="The next step is schema and permission mapping, not invented forms or database columns." /></div>
    </AdminPageShell>
  );
}
