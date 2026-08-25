"use client";
import SalaryManager from "./salary-manager";
import BillPaymentsWorkspace from "@/app/admin/accounts/bill-payments-workspace";
import StudentFeeManager from "@/app/admin/accounts/student-fee-manager";

type Permissions = Record<string, boolean>;
export const accountsPermissionList = [
  { key: "salary_view", title: "View Salary Sheets", description: "View HR-submitted salary sheets and monthly payroll details." },
  { key: "salary_status", title: "View Salary Status", description: "View your own current salary, paid amount and due status." },
  { key: "salary_approval", title: "Approve Salary", description: "Approve submitted salary sheets before payment." },
  { key: "salary_payment", title: "Make Salary Payment", description: "Record salary payments and update paid/due amounts." },
  { key: "salary_history", title: "View Salary History", description: "View your own salary and payment history." },
  { key: "bill_view", title: "View Bill Payments", description: "View school bills, amounts, statuses and bill details." },
  { key: "bill_create", title: "Create Bill", description: "Create utility, supplier/vendor and other school bills." },
  { key: "bill_edit", title: "Edit Bill", description: "Edit bills before approval or payment." },
  { key: "bill_approve", title: "Approve Bill", description: "Approve submitted bills before payment." },
  { key: "bill_payment", title: "Make Payment", description: "Record bill payments and update remaining due." },
  { key: "bill_history", title: "View Payment History", description: "View every payment transaction against a bill." },
  { key: "bill_cancel", title: "Cancel/Void Bill", description: "Cancel eligible bills without deleting their records." },
  { key: "bill_reports", title: "View Reports", description: "Access bill payment reporting when reporting views are enabled." },
  { key: "student_income_view", title: "View Student Income", description: "View student fee charges, collections, dues and income history." },
  { key: "student_income_charge", title: "Send Student Fee", description: "Send an individual fee charge to a Student ID and its linked Parent." },
  { key: "student_income_collect", title: "Update Student Payment", description: "Update payment only against the specific fee that was paid." },
  { key: "student_income_edit", title: "Edit Student Income", description: "Edit eligible student fee income records when the workflow supports editing." },
  { key: "student_income_reports", title: "Student Income Reports", description: "Access student income and collection reporting." },
] as const;
export default function AccountsModule({ permissions }: { permissions: Permissions; preview?: boolean }) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("ctms_store_token") : null;
  const canManageSalary=Boolean(permissions.salary_view||permissions.salary_approval||permissions.salary_payment||permissions.__all);
  const canManageBills=Boolean(permissions.bill_view||permissions.bill_create||permissions.bill_edit||permissions.bill_approve||permissions.bill_payment||permissions.bill_history||permissions.bill_cancel||permissions.bill_reports||permissions.__all);
  const canManageStudentIncome=Boolean(permissions.student_income_view||permissions.student_income_charge||permissions.student_income_collect||permissions.student_income_edit||permissions.student_income_reports||permissions.__all);
  if(!canManageSalary&&!canManageBills&&!canManageStudentIncome)return <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-6 text-center"><p className="text-sm font-black">Accounts access is not enabled</p><p className="mt-1 text-xs text-[var(--school-muted)]">Your role does not currently have salary, Bill Payments or Student Income permission.</p></div>;
  return <div className="space-y-5">{canManageSalary&&<SalaryManager token={token} permissions={permissions}/>} {canManageBills&&<BillPaymentsWorkspace permissions={permissions}/>} {canManageStudentIncome&&<StudentFeeManager permissions={permissions}/>}</div>;
}
