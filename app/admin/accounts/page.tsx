import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getCurrentAdminPermissions } from "@/lib/adminPermissions";
import AccountsWorkspace from "./accounts-workspace-v2";
import BillPaymentsWorkspace from "./bill-payments-workspace";
import StudentFeeManager from "./student-fee-manager";
import FinancialOverview from "./financial-overview";
import ProcurementWorkspace from "../inventory/procurement-workspace";

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
