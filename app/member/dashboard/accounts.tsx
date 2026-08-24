"use client";
import SalaryManager from "./salary-manager";

type Permissions = Record<string, boolean>;

export const accountsPermissionList = [
  { key: "salary_view", title: "View Salary Sheets", description: "View HR-submitted salary sheets and monthly payroll details." },
  { key: "salary_status", title: "View Salary Status", description: "View your own current salary, paid amount and due status." },
  { key: "salary_approval", title: "Approve Salary", description: "Approve submitted salary sheets before payment." },
  { key: "salary_payment", title: "Make Salary Payment", description: "Record salary payments and update paid/due amounts." },
  { key: "salary_history", title: "View Salary History", description: "View your own salary and payment history." },
] as const;

export default function AccountsModule({ permissions }: { permissions: Permissions; preview?: boolean }) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("ctms_store_token") : null;
  const canManage = Boolean(permissions.salary_view || permissions.salary_approval || permissions.salary_payment || permissions.__all);
  if (!canManage) {
    return (
      <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-6 text-center">
        <p className="text-sm font-black">Salary Management access is not enabled</p>
        <p className="mt-1 text-xs text-[var(--school-muted)]">Your role does not currently have a salary management permission.</p>
      </div>
    );
  }
  return <SalaryManager token={token} permissions={permissions} />;
}
