import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AccountsWorkspace from "./accounts-workspace";

export default function AccountsPage() {
  return (
    <AdminPageShell
      eyebrow="Finance & Operations"
      title="Accounts"
      description="Complete school accounts workspace. HR prepares approved salary sheets; Accounts processes financial payments, vouchers, cash, bank and reporting."
      action={{ href: "/admin/roles", label: "Role Management" }}
    >
      <AccountsWorkspace />
      <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 text-xs leading-5 text-[var(--school-muted)]">
        <strong className="text-[var(--school-text)]">Workflow boundary:</strong> HR prepares and approves salary sheets. Accounts only processes payment against an approved salary sheet and records the financial transaction. Inventory owns stock and Item SR approval; Accounts owns the financial payment record.
      </div>
    </AdminPageShell>
  );
}
