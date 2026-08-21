import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function ResultsPage() {
  return (
    <AdminPageShell eyebrow="Academic" title="Results & Reports" description="Academic results and reporting will be built after the underlying academic records and assessment relationships are verified.">
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Academic results" description="Result records and reporting workflows." />
        <AdminInfoCard label="Stage" value="Foundation" description="The route is prepared without inventing grading logic." />
        <AdminInfoCard label="Dependency" value="Academic schema" description="Student, subject and assessment relationships come first." />
      </div>
      <div className="mt-5"><AdminEmptyState title="Results data is not connected yet" description="The system will not assume marks, grades or report formats until the project's verified academic model establishes them." /></div>
    </AdminPageShell>
  );
}
