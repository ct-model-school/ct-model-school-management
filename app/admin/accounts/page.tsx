import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsWorkspace from "./accounts-workspace-v2";
import BillPaymentsWorkspace from "./bill-payments-workspace";
import StudentIncomeWorkspace from "./student-income-workspace";

export default function AccountsPage() {
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="Manage salary, Student Fees & Collections, and school Bill Payments as separate accounting workflows."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <AccountsWorkspace />
      <StudentIncomeWorkspace adminMode />
      <BillPaymentsWorkspace adminMode />
    </AdminPageShell>
  );
}
