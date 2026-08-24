import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsWorkspace from "./accounts-workspace-v2";

export default function AccountsPage() {
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="Current Accounts workspace: receive HR-approved salary sheets, review employee outstanding balances, and complete salary payments. Other Accounts workflows remain preserved in the database and will be exposed when their section is ready."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <AccountsWorkspace />
    </AdminPageShell>
  );
}
