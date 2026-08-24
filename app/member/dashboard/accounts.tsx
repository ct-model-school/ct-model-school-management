"use client";
import MemberAccountsV2 from "./member-accounts-v2";

type Permissions = Record<string, boolean>;

// Member Accounts is intentionally limited to the salary workflow that is ready now.
// Other Accounts workflows remain in the database and admin workspace for later sections.
export const accountsPermissionList = [
  {
    key: "salary_payment",
    title: "Salary & Salary Due",
    description: "View HR-submitted salary sheets, payment status and outstanding salary due.",
  },
] as const;

export default function AccountsModule({ permissions }: { permissions: Permissions; preview?: boolean }) {
  const canViewSalary = Boolean(permissions.salary_payment || permissions.__all);

  if (!canViewSalary) {
    return (
      <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-6 text-center">
        <p className="text-sm font-black">Salary & Accounts access is not enabled</p>
        <p className="mt-1 text-xs text-[var(--school-muted)]">Your role does not currently have the salary payment permission.</p>
      </div>
    );
  }

  return <MemberAccountsV2 />;
}
