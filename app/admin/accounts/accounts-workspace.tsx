"use client";

import { useMemo, useState } from "react";

type Field = { key: string; label: string; type?: "text" | "number" | "date" | "select" | "textarea"; options?: string[]; required?: boolean; placeholder?: string };
type Section = { key: string; title: string; description: string; mode: "form" | "table" | "dashboard"; fields?: Field[]; actions?: string[] };

const paymentMethods = ["Cash", "Bank", "Mobile Banking", "Cheque", "Other"];
const accountSections: Section[] = [
  { key: "dashboard", title: "Accounts Dashboard", description: "Financial overview, balances, dues and alerts.", mode: "dashboard" },
  { key: "student_fees", title: "Student Fees & Payments", description: "Collect student fees, manage dues, receipts and payment history.", mode: "form", fields: [
    { key: "student_id", label: "Student ID", required: true, placeholder: "Search student ID" }, { key: "student_name", label: "Student Name", required: true }, { key: "class", label: "Class" }, { key: "section", label: "Section" }, { key: "academic_year", label: "Academic Year" }, { key: "fee_type", label: "Fee Type", type: "select", options: ["Admission", "Monthly", "Exam", "Registration", "Certificate", "Other"] }, { key: "period", label: "Month / Period" }, { key: "due_amount", label: "Due Amount", type: "number" }, { key: "discount", label: "Discount", type: "number" }, { key: "fine", label: "Fine", type: "number" }, { key: "paid_amount", label: "Paid Amount", type: "number", required: true }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "reference", label: "Transaction / Reference" }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "salary_payment", title: "Teacher & Staff Salary Payment", description: "Process payment only against an approved HR salary sheet.", mode: "form", fields: [
    { key: "salary_sheet_no", label: "Approved Salary Sheet No.", required: true }, { key: "month", label: "Salary Month", required: true }, { key: "employee", label: "Teacher / Staff", required: true }, { key: "gross_salary", label: "Gross Salary", type: "number" }, { key: "deduction", label: "Deduction", type: "number" }, { key: "net_payable", label: "Net Payable", type: "number", required: true }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "reference", label: "Transaction Reference" }, { key: "payment_date", label: "Payment Date", type: "date" }, { key: "voucher_no", label: "Voucher No." }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "other_member_payment", title: "Other Member Payments", description: "Honorarium and approved payments for other members or services.", mode: "form", fields: [
    { key: "payee", label: "Payee / Member", required: true }, { key: "payment_type", label: "Payment Type", required: true }, { key: "purpose", label: "Purpose", type: "textarea" }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "approved_by", label: "Approved By" }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "reference", label: "Reference" }, { key: "voucher_no", label: "Voucher No." }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "vendor_payment", title: "Vendor / Supplier Payments", description: "Track supplier invoices, partial payments, dues and settlements.", mode: "form", fields: [
    { key: "vendor", label: "Vendor / Supplier", required: true }, { key: "invoice_no", label: "Invoice No.", required: true }, { key: "po_no", label: "PO No." }, { key: "invoice_date", label: "Invoice Date", type: "date" }, { key: "due_date", label: "Due Date", type: "date" }, { key: "bill_amount", label: "Bill Amount", type: "number" }, { key: "previous_paid", label: "Previous Paid", type: "number" }, { key: "current_payment", label: "Current Payment", type: "number", required: true }, { key: "balance", label: "Balance", type: "number" }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "reference", label: "Transaction Reference" }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "school_bills", title: "Utility & School Bills", description: "Electricity, water, internet, rent and recurring school bills.", mode: "form", fields: [
    { key: "bill_type", label: "Bill Type", type: "select", options: ["Electricity", "Water", "Internet", "Telephone", "Rent", "Gas", "Other"], required: true }, { key: "provider", label: "Provider / Payee" }, { key: "bill_no", label: "Bill No." }, { key: "billing_period", label: "Billing Period" }, { key: "bill_date", label: "Bill Date", type: "date" }, { key: "due_date", label: "Due Date", type: "date" }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "paid_amount", label: "Paid Amount", type: "number" }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "reference", label: "Reference" }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "income", title: "Income", description: "Record school income from fees, donations, funds, rent and other sources.", mode: "form", fields: [
    { key: "income_date", label: "Income Date", type: "date", required: true }, { key: "source", label: "Income Source", type: "select", options: ["Student Fees", "Admission", "Registration", "Donation", "Fund", "Rent", "Certificate", "Other"], required: true }, { key: "received_from", label: "Received From" }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "reference", label: "Reference" }, { key: "account_head", label: "Account Head" }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "expense", title: "Expense", description: "Record approved operational, maintenance, event and other expenses.", mode: "form", fields: [
    { key: "expense_date", label: "Expense Date", type: "date", required: true }, { key: "category", label: "Expense Category", required: true }, { key: "payee", label: "Payee / Vendor" }, { key: "description", label: "Description", type: "textarea", required: true }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "payment_method", label: "Payment Method", type: "select", options: paymentMethods }, { key: "account_head", label: "Account Head" }, { key: "approved_by", label: "Approved By" }, { key: "voucher_no", label: "Voucher No." }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "cash", title: "Cash Management", description: "Manage opening balance, cash in/out, cashbook and closing balance.", mode: "form", fields: [
    { key: "transaction_date", label: "Transaction Date", type: "date", required: true }, { key: "transaction_type", label: "Transaction Type", type: "select", options: ["Cash In", "Cash Out", "Opening Balance", "Adjustment"], required: true }, { key: "account_head", label: "Account Head" }, { key: "description", label: "Description", type: "textarea" }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "reference", label: "Reference" }, { key: "voucher_no", label: "Voucher No." }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "bank", title: "Bank Management", description: "Manage bank accounts, deposits, withdrawals, transfers and reconciliation.", mode: "form", fields: [
    { key: "bank_account", label: "Bank Account", required: true }, { key: "transaction_date", label: "Transaction Date", type: "date", required: true }, { key: "transaction_type", label: "Transaction Type", type: "select", options: ["Deposit", "Withdrawal", "Transfer", "Bank Charge", "Adjustment"], required: true }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "reference", label: "Bank Reference" }, { key: "counter_account", label: "Counter Account" }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "vouchers", title: "Vouchers", description: "Create, view, print and reverse controlled financial vouchers.", mode: "form", fields: [
    { key: "voucher_type", label: "Voucher Type", type: "select", options: ["Payment", "Receipt", "Expense", "Journal", "Salary Payment", "Student Payment", "Vendor Payment"], required: true }, { key: "voucher_date", label: "Voucher Date", type: "date", required: true }, { key: "reference", label: "Reference" }, { key: "debit_account", label: "Debit Account", required: true }, { key: "credit_account", label: "Credit Account", required: true }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "narration", label: "Narration", type: "textarea", required: true }
  ] },
  { key: "journal_ledger", title: "Journal & Ledger", description: "Maintain debit, credit, account heads and transaction references.", mode: "form", fields: [
    { key: "entry_date", label: "Entry Date", type: "date", required: true }, { key: "reference", label: "Reference" }, { key: "debit_account", label: "Debit Account", required: true }, { key: "credit_account", label: "Credit Account", required: true }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "narration", label: "Narration", type: "textarea", required: true }
  ] },
  { key: "receivable_payable", title: "Receivable / Payable", description: "Track student dues, vendor payable, salary payable and settlements.", mode: "table", actions: ["Receivable", "Payable", "Settlement", "Aging"] },
  { key: "budget", title: "Budget & Financial Planning", description: "Create annual/category budgets and compare actual spending.", mode: "form", fields: [
    { key: "financial_year", label: "Financial Year", required: true }, { key: "budget_name", label: "Budget Name", required: true }, { key: "category", label: "Budget Category" }, { key: "department", label: "Department" }, { key: "annual_amount", label: "Annual Budget", type: "number", required: true }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
  { key: "reports", title: "Financial Reports", description: "View collection, expense, salary, cash, bank, ledger and financial summaries.", mode: "table", actions: ["Collection Report", "Expense Report", "Salary Report", "Cashbook", "Bank Report", "Ledger", "Trial Balance", "Receivable", "Payable", "Budget vs Actual"] },
  { key: "audit", title: "Financial Audit & History", description: "Trace important financial actions, changes, reversals and references.", mode: "table", actions: ["All Changes", "Payment History", "Reversal History", "User Activity"] },
  { key: "settings", title: "Accounts Settings", description: "Configure account heads, financial periods, payment methods and numbering.", mode: "form", fields: [
    { key: "setting_group", label: "Setting Group", type: "select", options: ["Chart of Accounts", "Fee Categories", "Expense Categories", "Income Categories", "Payment Methods", "Voucher Numbering", "Financial Year", "Receipt Settings"], required: true }, { key: "setting_name", label: "Setting Name", required: true }, { key: "setting_value", label: "Value", required: true }, { key: "remarks", label: "Remarks", type: "textarea" }
  ] },
];

const demoRows = [
  ["AC-2026-0001", "Student Fee", "Collection", "12,500.00", "Today"],
  ["AC-2026-0002", "Salary", "Payment", "85,000.00", "Yesterday"],
  ["AC-2026-0003", "Vendor", "Payable", "32,750.00", "Yesterday"],
];

export default function AccountsWorkspace() {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const active = accountSections.find((section) => section.key === activeKey) ?? accountSections[0];
  const visibleSections = useMemo(() => accountSections.filter((section) => section.title.toLowerCase().includes(query.toLowerCase())), [query]);

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(`${active.title} form captured successfully. Database transaction wiring will use the same form contract.`);
  }

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm">
      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--school-border)] bg-[var(--school-primary-soft)] lg:border-b-0 lg:border-r">
          <div className="p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Accounts Workspace</p>
            <h3 className="mt-1 text-base font-black text-[var(--school-text)]">Finance & Operations</h3>
            <div className="mt-3">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts section..." className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs text-[var(--school-text)] outline-none focus:border-[var(--school-primary-border)]" />
            </div>
          </div>
          <nav className="max-h-[calc(100vh-240px)] overflow-y-auto px-2 pb-3">
            {visibleSections.map((section) => <button key={section.key} type="button" onClick={() => { setActiveKey(section.key); setNotice(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold ${activeKey === section.key ? "theme-primary-bg" : "text-[var(--school-muted)] hover:bg-[var(--school-surface)] hover:text-[var(--school-text)]"}`}><span>{section.title}</span>{section.mode === "form" && <span className="text-[10px] opacity-70">FORM</span>}</button>)}
          </nav>
        </aside>

        <section className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[var(--school-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Accounts</p><h2 className="mt-1 text-xl font-black text-[var(--school-text)]">{active.title}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--school-muted)]">{active.description}</p></div>
            {active.key !== "dashboard" && <button type="button" onClick={() => setActiveKey("dashboard")} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-bold text-[var(--school-text)] hover:bg-[var(--school-primary-soft)]">Back to Dashboard</button>}
          </div>

          {notice && <div className="mt-4 rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-xs font-semibold text-[var(--school-text)]">{notice}</div>}

          {active.mode === "dashboard" && <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[['Total Income','BDT 245,800.00'],['Total Expense','BDT 132,450.00'],['Cash Balance','BDT 48,350.00'],['Bank Balance','BDT 310,200.00'],['Student Due','BDT 96,500.00'],['Vendor Payable','BDT 54,750.00'],['Salary Payable','BDT 0.00'],['This Month Collection','BDT 118,400.00']].map(([label,value]) => <div key={label} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--school-muted)]">{label}</p><p className="mt-2 text-lg font-black theme-primary">{value}</p></div>)}
            </div>
            <div className="rounded-2xl border border-[var(--school-border)]">
              <div className="flex items-center justify-between border-b border-[var(--school-border)] px-4 py-3"><h3 className="text-sm font-black text-[var(--school-text)]">Recent Financial Activity</h3><button type="button" onClick={() => setActiveKey("reports")} className="text-[11px] font-bold theme-primary">View Reports →</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="bg-[var(--school-primary-soft)] text-[var(--school-muted)]"><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th></tr></thead><tbody>{demoRows.map((row) => <tr key={row[0]} className="border-t border-[var(--school-border)]"><td className="px-4 py-3 font-bold text-[var(--school-text)]">{row[0]}</td>{row.slice(1).map((cell, index) => <td key={`${row[0]}-${index}`} className="px-4 py-3 text-[var(--school-muted)]">{cell}</td>)}</tr>)}</tbody></table></div>
            </div>
          </div>}

          {active.mode === "form" && <form onSubmit={submitForm} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {active.fields?.map((field) => <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : ""}><span className="mb-1.5 block text-xs font-bold text-[var(--school-text)]">{field.label}{field.required && <span className="ml-1 theme-primary">*</span>}</span>{field.type === "textarea" ? <textarea name={field.key} required={field.required} rows={4} placeholder={field.placeholder} className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-sm text-[var(--school-text)] outline-none focus:border-[var(--school-primary-border)]" /> : field.type === "select" ? <select name={field.key} required={field.required} className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-sm text-[var(--school-text)] outline-none focus:border-[var(--school-primary-border)]"><option value="">Select...</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input name={field.key} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-sm text-[var(--school-text)] outline-none focus:border-[var(--school-primary-border)]" />}</label>)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--school-border)] pt-5"><p className="text-[11px] text-[var(--school-muted)]">Required fields are marked with *. Financial records should be reversed, not silently deleted.</p><div className="flex gap-2"><button type="reset" className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-bold text-[var(--school-text)]">Clear</button><button type="submit" className="theme-primary-bg rounded-xl px-5 py-2.5 text-xs font-bold">Save Record</button></div></div>
          </form>}

          {active.mode === "table" && <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">{active.actions?.map((action) => <button key={action} type="button" onClick={() => setNotice(`${action} workspace selected. Filters and export controls are ready for the accounting data source.`)} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2 text-xs font-bold text-[var(--school-text)] hover:bg-[var(--school-primary-soft)]">{action}</button>)}</div>
            <div className="rounded-2xl border border-[var(--school-border)]"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--school-border)] px-4 py-3"><h3 className="text-sm font-black text-[var(--school-text)]">Records</h3><div className="flex gap-2"><button type="button" className="rounded-lg border border-[var(--school-border)] px-3 py-1.5 text-[10px] font-bold">Filter</button><button type="button" className="rounded-lg border border-[var(--school-border)] px-3 py-1.5 text-[10px] font-bold">Export / Print</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr className="bg-[var(--school-primary-soft)] text-[var(--school-muted)]"><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th></tr></thead><tbody>{demoRows.map((row) => <tr key={row[0]} className="border-t border-[var(--school-border)]"><td className="px-4 py-3 font-bold text-[var(--school-text)]">{row[0]}</td><td className="px-4 py-3 text-[var(--school-muted)]">{row[1]}</td><td className="px-4 py-3"><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-bold theme-primary">Recorded</span></td><td className="px-4 py-3 text-[var(--school-text)]">{row[3]}</td><td className="px-4 py-3 text-[var(--school-muted)]">{row[4]}</td></tr>)}</tbody></table></div></div>
          </div>}
        </section>
      </div>
    </div>
  );
}
