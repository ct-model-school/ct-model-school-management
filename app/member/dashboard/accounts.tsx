"use client";
import SalaryManager from "./salary-manager";

type Permissions = Record<string, boolean>;

export const accountsPermissionList = [
  {
    key: "salary_payment",
    title: "Salary & Salary Due",
    description: "View HR-submitted salary sheets, payment status and outstanding salary due.",
  },
] as const;

export default function AccountsModule({ permissions }: { permissions: Permissions; preview?: boolean }) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("ctms_store_token") : null;
  if (!permissions.salary_payment && !permissions.__all) {
    return (
      <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-6 text-center">
        <p className="text-sm font-black">Salary & Accounts access is not enabled</p>
        <p className="mt-1 text-xs text-[var(--school-muted)]">Your role does not currently have the salary payment permission.</p>
      </div>
    );
  }
  return <SalaryManager token={token} />;
}
