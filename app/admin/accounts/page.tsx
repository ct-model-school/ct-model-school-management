import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsModule, { accountsPermissionList } from "@/app/member/dashboard/accounts";

export default function AccountsPage() {
  const permissions = Object.fromEntries(accountsPermissionList.map((area) => [area.key, true]));
  return (
    <AdminPageShell eyebrow="Finance & Operations" title="Accounts" description="Accounts is an independent permission category. Admin can inspect the complete module here; member access is distributed by individual Accounts permissions from Role Management."
      action={{ href: "/admin/roles", label: "Role Management" }}>
      <AccountsModule permissions={permissions} preview />
      <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 text-xs leading-5 text-[var(--school-muted)]">
        <strong className="text-[var(--school-text)]">Workflow boundary:</strong> HR prepares and approves salary sheets. Accounts only processes payment against an approved salary sheet and records the financial transaction. Inventory owns stock and Item SR approval; Accounts owns the financial payment record.
      </div>
    </AdminPageShell>
  );
}
