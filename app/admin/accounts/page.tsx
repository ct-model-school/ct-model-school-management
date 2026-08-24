import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsWorkspace from "./accounts-workspace-v2";
import BillPaymentsWorkspace from "./bill-payments-workspace";

export default function AccountsPage() {
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="Manage HR salary workflows and school Bill Payments. Bill Payments follow a separate bill → verification → approval → payment → history workflow."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <AccountsWorkspace />
      <BillPaymentsWorkspace adminMode />
    </AdminPageShell>
  );
}
