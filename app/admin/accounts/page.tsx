import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsWorkspace from "./accounts-workspace-v2";
import BillPaymentsWorkspace from "./bill-payments-workspace";
import StudentFeeManager from "./student-fee-manager";
import FinancialOverview from "./financial-overview";

export default function AccountsPage() {
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="School-wide financial overview plus the existing Salary, Student Fees & Collections, and Bill Payments workflows."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <FinancialOverview />
      <AccountsWorkspace />
      <StudentFeeManager adminMode />
      <BillPaymentsWorkspace adminMode />
    </AdminPageShell>
  );
}
