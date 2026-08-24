import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsWorkspace from "./accounts-workspace-v2";

export default function AccountsPage() {
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="Owner-level school accounts: collection, salary, vendor bills, cash, bank, receivable/payable, vouchers, reports and audit history."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <AccountsWorkspace />
      <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 text-xs leading-5 text-[var(--school-muted)]">
        <strong className="text-[var(--school-text)]">Control boundary:</strong> Accounts owns financial records and payments. HR remains responsible for preparing and approving salary sheets; Inventory remains responsible for stock and Item SR workflows. Accounts records the financial settlement without duplicating those source records.
      </div>
    </AdminPageShell>
  );
}
