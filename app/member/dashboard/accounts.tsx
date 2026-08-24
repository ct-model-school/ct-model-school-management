"use client";

type AccountsPermissions = Record<string, boolean>;

type AccountArea = {
  key: string;
  title: string;
  description: string;
  actions: string[];
};

export const accountsPermissionList: AccountArea[] = [
  { key: "dashboard", title: "Accounts Dashboard", description: "Financial overview, balances, dues and important alerts.", actions: ["View financial overview", "View balances", "View alerts"] },
  { key: "student_fees", title: "Student Fees & Payments", description: "Student fee collection, receipts, dues and payment history.", actions: ["View fees", "Record payment", "Issue receipt", "View dues", "Refund / adjustment"] },
  { key: "salary_payment", title: "Teacher & Staff Salary Payment", description: "Pay approved HR salary sheets and keep payment records.", actions: ["View approved salary sheet", "Process payment", "Record voucher", "View payment history"] },
  { key: "other_member_payment", title: "Other Member Payments", description: "Honorarium and approved payments for other members or services.", actions: ["Create payment", "Record voucher", "View history"] },
  { key: "vendor_payment", title: "Vendor / Supplier Payments", description: "Supplier bills, invoices, dues, settlements and payment history.", actions: ["View bills", "Record payment", "Track payable", "View history"] },
  { key: "school_bills", title: "Utility & School Bills", description: "Electricity, water, internet, rent and recurring school bills.", actions: ["Add bill", "Record payment", "Track due", "View history"] },
  { key: "income", title: "Income", description: "School income from fees, donations, funds, rental and other sources.", actions: ["Record income", "View income", "Edit / reverse", "View history"] },
  { key: "expense", title: "Expense", description: "Operational, maintenance, event and other approved expenses.", actions: ["Record expense", "View expense", "Edit / reverse", "View history"] },
  { key: "cash", title: "Cash Management", description: "Cash in, cash out, opening and closing balance records.", actions: ["Record cash transaction", "View cashbook", "View balance"] },
  { key: "bank", title: "Bank Management", description: "Bank accounts, deposits, withdrawals, transfers and balances.", actions: ["Manage bank accounts", "Record transaction", "View balance", "View history"] },
  { key: "vouchers", title: "Vouchers", description: "Payment, receipt, expense and journal voucher records.", actions: ["Create voucher", "View voucher", "Print / export", "Void / reverse"] },
  { key: "journal_ledger", title: "Journal & Ledger", description: "Accounting entries, debit, credit, account heads and ledger history.", actions: ["Create journal", "View journal", "View ledger", "View transaction reference"] },
  { key: "receivable_payable", title: "Receivable / Payable", description: "Student dues, vendor payable, salary payable and other settlements.", actions: ["View receivable", "View payable", "Record settlement", "View aging"] },
  { key: "budget", title: "Budget & Financial Planning", description: "Annual budgets, category budgets and budget versus actual tracking.", actions: ["Create budget", "Edit budget", "View utilization", "Compare actual"] },
  { key: "reports", title: "Financial Reports", description: "Collection, expense, salary, cash, bank, ledger and financial summaries.", actions: ["View reports", "Filter reports", "Export / print"] },
  { key: "audit", title: "Financial Audit & History", description: "Trace important financial actions, changes and references.", actions: ["View audit history", "View change details", "Trace transaction"] },
  { key: "settings", title: "Accounts Settings", description: "Accounts configuration, financial periods and controlled defaults.", actions: ["View settings", "Manage account heads", "Manage financial settings"] },
];

export default function AccountsModule({ permissions, preview = false }: { permissions: AccountsPermissions; preview?: boolean }) {
  const enabled = accountsPermissionList.filter((area) => permissions[area.key]);
  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.15em] theme-primary">Accounts Control</p><h3 className="mt-1 text-lg font-black">{preview ? "Accounts Module Preview" : "Accounts"}</h3><p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Only permissions assigned to this member are exposed. Financial calculations and database transactions are connected as each workflow is implemented.</p></div>
          <span className="w-fit rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-black theme-primary">{enabled.length}/{accountsPermissionList.length} ACTIVE</span>
        </div>
      </div>
      {enabled.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {enabled.map((area) => <article key={area.key} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.13em] theme-primary">Accounts</p><h4 className="mt-1 text-sm font-black">{area.title}</h4></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[9px] font-black theme-primary">ON</span></div>
          <p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">{area.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{area.actions.map((action) => <span key={action} className="rounded-lg border border-[var(--school-border)] px-2 py-1 text-[9px] font-semibold text-[var(--school-text)]">{action}</span>)}</div>
        </article>)}
      </div> : <div className="rounded-2xl border border-dashed border-[var(--school-border)] p-10 text-center"><p className="text-sm font-black">No Accounts permission assigned</p><p className="mt-1 text-xs text-[var(--school-muted)]">Ask an administrator to enable the required Accounts permissions for your role.</p></div>}
    </div>
  );
}
