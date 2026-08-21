import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function AccountsPage() {
  return (
    <AdminPageShell eyebrow="Finance & Operations" title="Accounts" description="Income, expenses, fees and payroll will be implemented after the existing financial schema and permissions are verified.">
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Finance" description="Income, expense, fees and payroll areas." />
        <AdminInfoCard label="Stage" value="Foundation" description="No financial calculations are invented in this shell." />
        <AdminInfoCard label="Dependency" value="Schema" description="Existing ledger and account relationships must be mapped first." />
      </div>
      <div className="mt-5"><AdminEmptyState title="Financial data is not connected yet" description="The financial module is intentionally waiting for the verified data model and access rules." /></div>
    </AdminPageShell>
  );
}
