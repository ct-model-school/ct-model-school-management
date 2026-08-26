import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getCurrentAdminPermissions } from "@/lib/adminPermissions";
import { AccountsWorkspace, BillPaymentsWorkspace, StudentFeeManager, FinancialOverview, ProcurementWorkspace } from "@/components/workspaces";

export default async function AccountsPage() {
  const access = await getCurrentAdminPermissions();
  const roleName = access?.profile.role.name?.toLowerCase().replace(/_/g, " ") || "";
  const adminMode = ["admin", "administrator", "super admin"].includes(roleName);
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="School-wide financial overview plus Salary, Student Fees, Bill Payments and Purchase Order expense/payment workflows."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <FinancialOverview />
      <AccountsWorkspace />
      <StudentFeeManager adminMode />
      <BillPaymentsWorkspace adminMode />
      <ProcurementWorkspace permissions={access?.permissions || {}} adminMode={adminMode} />
    </AdminPageShell>
  );
}
