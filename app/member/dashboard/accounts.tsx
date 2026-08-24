"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountsPermissions = Record<string, boolean>;
type AccountArea = { key: string; title: string; description: string };
type Entry = {
  id: string; voucher_no: string; entry_date: string; entry_type: string; category: string | null;
  party_type: string | null; party_id: string | null; party_name: string | null; amount: number;
  payment_method: string; account_name: string | null; reference_no: string | null;
  description: string | null; status: string; created_at: string;
};
type Payee = { member_id: string; member_type: string; full_name: string; designation: string | null; department: string | null; salary: number | null };
type FormState = {
  entry_type: string; entry_date: string; category: string; party_type: string; party_id: string;
  party_name: string; amount: string; payment_method: string; account_name: string;
  reference_no: string; description: string;
};

export const accountsPermissionList: AccountArea[] = [
  { key: "dashboard", title: "Accounts Dashboard", description: "Financial overview, balances, dues and alerts." },
  { key: "student_fees", title: "Student Fees & Payments", description: "Fee collection, receipts, dues and payment history." },
  { key: "salary_payment", title: "Teacher & Staff Salary Payment", description: "Process approved salary payments and keep payment records." },
  { key: "other_member_payment", title: "Other Member Payments", description: "Honorarium and approved payments for other members or services." },
  { key: "vendor_payment", title: "Vendor / Supplier Payments", description: "Supplier bills, settlements and payable history." },
  { key: "school_bills", title: "Utility & School Bills", description: "Electricity, water, internet, rent and recurring school bills." },
  { key: "income", title: "Income", description: "School income from fees, donations, rental and other sources." },
  { key: "expense", title: "Expense", description: "Operational, maintenance, event and other approved expenses." },
  { key: "cash", title: "Cash Management", description: "Cash in, cash out and running cash balance." },
  { key: "bank", title: "Bank Management", description: "Bank transactions, transfers and balances." },
  { key: "vouchers", title: "Vouchers", description: "Payment, receipt, expense and journal references." },
  { key: "journal_ledger", title: "Journal & Ledger", description: "Transaction references and financial history." },
  { key: "receivable_payable", title: "Receivable / Payable", description: "Student dues, vendor payable and settlements." },
  { key: "budget", title: "Budget & Financial Planning", description: "Budget planning and actual-versus-budget tracking." },
  { key: "reports", title: "Financial Reports", description: "Collection, expense, salary, cash, bank and ledger reports." },
  { key: "audit", title: "Financial Audit & History", description: "Trace important financial actions and references." },
  { key: "settings", title: "Accounts Settings", description: "Controlled Accounts configuration and defaults." },
];

const entryLabels: Record<string, string> = {
  income: "Income", expense: "Expense", student_fee: "Student Fee", salary: "Salary",
  vendor_payment: "Vendor Payment", school_bill: "School Bill", other_payment: "Other Member Payment",
};

const defaultForm = (): FormState => ({
  entry_type: "income", entry_date: new Date().toISOString().slice(0, 10), category: "", party_type: "",
  party_id: "", party_name: "", amount: "", payment_method: "cash", account_name: "", reference_no: "", description: "",
});

function permissionOn(permissions: AccountsPermissions, key: string) {
  return Boolean(permissions[key]) || Boolean(permissions.__all);
}
function money(value: number) {
  return new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}
function typeForPermission(key: string) {
  if (key === "student_fees") return "student_fee";
  if (key === "salary_payment") return "salary";
  if (key === "vendor_payment") return "vendor_payment";
  if (key === "school_bills") return "school_bill";
  if (key === "other_member_payment") return "other_payment";
  return key;
}

export default function AccountsModule({ permissions, preview = false }: { permissions: AccountsPermissions; preview?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState("overview");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0, cash: 0, bank: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const enabled = accountsPermissionList.filter((area) => permissionOn(permissions, area.key));
  const token = typeof window !== "undefined" ? window.localStorage.getItem("ctms_store_token") : null;

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    const [summaryResult, entryResult] = await Promise.all([
      supabase.rpc("store_accounts_summary", { p_token: token }),
      supabase.rpc("store_accounts_list_entries", { p_token: token, p_type: filter || null, p_search: search || null }),
    ]);
    if (summaryResult.error) setError(summaryResult.error.message);
    else if (summaryResult.data) setSummary(summaryResult.data as typeof summary);
    if (entryResult.error) setError((current) => current || entryResult.error.message);
    else setEntries((entryResult.data || []) as Entry[]);
    setLoading(false);
  }, [filter, search, supabase, token]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => {
    if (!token || (!permissionOn(permissions, "salary_payment") && !permissionOn(permissions, "other_member_payment"))) return;
    void supabase.rpc("store_accounts_list_payees", { p_token: token }).then(({ data }) => setPayees((data || []) as Payee[]));
  }, [permissions, supabase, token]);

  function openEntry(entryType = "income") {
    const category = entryType === "income" ? "Student Fees" : entryType === "expense" ? "Other Expense" : entryType === "student_fee" ? "Student Fees" : entryType === "salary" ? "Salary" : "";
    setForm({ ...defaultForm(), entry_type: entryType, category, party_type: entryType === "student_fee" ? "student" : entryType === "salary" ? "teacher" : "" });
    setMessage(""); setError(""); setShowForm(true);
  }

  function usePayee(payee: Payee) {
    setForm((current) => ({ ...current, party_type: payee.member_type, party_id: payee.member_id, party_name: payee.full_name, amount: payee.salary ? String(payee.salary) : current.amount, category: "Salary" }));
  }

  async function saveEntry(event: React.FormEvent) {
    event.preventDefault();
    if (!token || saving) return;
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be greater than zero."); return; }
    if (form.entry_type === "student_fee" && !form.party_id.trim()) { setError("Student ID is required for a Student Fee entry."); return; }
    setSaving(true); setMessage(""); setError("");
    const result = await supabase.rpc("store_accounts_save_entry", {
      p_token: token, p_entry_type: form.entry_type, p_entry_date: form.entry_date, p_category: form.category,
      p_party_type: form.party_type, p_party_id: form.party_id.trim(), p_party_name: form.party_name,
      p_amount: Number(form.amount), p_payment_method: form.payment_method, p_account_name: form.account_name,
      p_reference_no: form.reference_no, p_description: form.description,
    });
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setMessage(`Saved successfully. Voucher ${String((result.data as { voucher_no?: string })?.voucher_no || "")} created.`);
    setShowForm(false); setForm(defaultForm()); await loadData();
  }

  async function voidEntry(id: string) {
    if (!token || !window.confirm("Void this financial entry?")) return;
    const result = await supabase.rpc("store_accounts_void_entry", { p_token: token, p_id: id });
    if (result.error) setError(result.error.message); else { setMessage("Entry voided."); await loadData(); }
  }

  const tabs = [
    ["overview", "Overview", true], ["transactions", "Transactions", true], ["student_fee", "Student Fees", permissionOn(permissions, "student_fees")],
    ["salary", "Salary", permissionOn(permissions, "salary_payment")], ["payments", "Payables & Bills", permissionOn(permissions, "vendor_payment") || permissionOn(permissions, "school_bills") || permissionOn(permissions, "other_member_payment")],
    ["cashbank", "Cash & Bank", permissionOn(permissions, "cash") || permissionOn(permissions, "bank")], ["reports", "Reports", permissionOn(permissions, "reports")],
  ].filter((item) => item[2]) as [string, string, boolean][];
  const quickActions = [
    ["income", "Record Income", "income"], ["expense", "Record Expense", "expense"], ["student_fees", "Student Fee", "student_fee"],
    ["salary_payment", "Salary Payment", "salary"], ["vendor_payment", "Vendor Payment", "vendor_payment"], ["school_bills", "School Bill", "school_bill"], ["other_member_payment", "Other Payment", "other_payment"],
  ].filter(([permission]) => permissionOn(permissions, permission));

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.15em] theme-primary">Accounts Control</p><h3 className="mt-1 text-lg font-black">{preview ? "Accounts Workspace Preview" : "Accounts Workspace"}</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--school-muted)]">Record financial transactions, generate voucher references, monitor cash and bank balances, and keep a searchable Accounts history.</p></div>
          <span className="w-fit rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-black theme-primary">{enabled.length}/{accountsPermissionList.length} ACTIVE</span>
        </div>
      </div>
      {(message || error) && <div className={`rounded-xl border p-3 text-xs font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] theme-primary"}`}>{error || message}</div>}
      {quickActions.length > 0 && <div className="flex flex-wrap gap-2">{quickActions.map(([permission, label, type]) => <button key={permission} type="button" onClick={() => openEntry(type)} className="rounded-xl theme-primary-bg px-3 py-2 text-xs font-bold shadow-sm">+ {label}</button>)}</div>}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--school-border)] pb-2">{tabs.map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${activeTab === key ? "theme-primary-bg" : "text-[var(--school-muted)] hover:bg-[var(--school-primary-soft)]"}`}>{label}</button>)}</div>

      {activeTab === "overview" && <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Total Income", summary.income], ["Total Expense", summary.expense], ["Net Balance", summary.net], ["Cash Balance", summary.cash], ["Bank Balance", summary.bank]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--school-muted)]">{label}</p><p className="mt-2 text-xl font-black theme-primary">৳ {money(Number(value))}</p></div>)}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex items-center justify-between"><h4 className="text-sm font-black">Quick workflow</h4><span className="text-[10px] text-[var(--school-muted)]">Live</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{enabled.filter((area) => !["dashboard", "reports", "audit", "settings"].includes(area.key)).slice(0, 8).map((area) => <button key={area.key} type="button" onClick={() => openEntry(typeForPermission(area.key))} className="rounded-xl border border-[var(--school-border)] p-3 text-left hover:bg-[var(--school-primary-soft)]"><p className="text-xs font-black">{area.title}</p><p className="mt-1 text-[10px] leading-4 text-[var(--school-muted)]">{area.description}</p></button>)}</div></section>
          <section className="rounded-2xl border border-[var(--school-border)] p-4"><h4 className="text-sm font-black">Recent transactions</h4>{loading ? <p className="mt-4 text-xs text-[var(--school-muted)]">Loading...</p> : entries.length === 0 ? <p className="mt-4 text-xs text-[var(--school-muted)]">No transactions yet.</p> : entries.slice(0, 6).map((entry) => <div key={entry.id} className="mt-3 flex items-center justify-between gap-3 border-b border-[var(--school-border)] pb-2"><div className="min-w-0"><p className="truncate text-xs font-bold">{entry.party_name || entry.category || entryLabels[entry.entry_type]}</p><p className="text-[10px] text-[var(--school-muted)]">{entry.voucher_no} · {entry.entry_date}</p></div><p className="shrink-0 text-xs font-black">৳ {money(entry.amount)}</p></div>)}</section>
        </div>
      </>}

      {activeTab === "transactions" && <section className="rounded-2xl border border-[var(--school-border)] p-4">
        <div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search voucher, party or category..." className="min-w-0 flex-1 rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs outline-none"/><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"><option value="">All transactions</option>{Object.entries(entryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-[var(--school-border)] text-[10px] uppercase tracking-wider text-[var(--school-muted)]"><th className="p-2">Voucher</th><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Party</th><th className="p-2">Method</th><th className="p-2 text-right">Amount</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id} className="border-b border-[var(--school-border)]"><td className="p-2 font-bold">{entry.voucher_no}</td><td className="p-2">{entry.entry_date}</td><td className="p-2">{entryLabels[entry.entry_type] || entry.entry_type}</td><td className="p-2">{entry.party_name || entry.party_id || "-"}</td><td className="p-2">{entry.payment_method}</td><td className="p-2 text-right font-black">৳ {money(entry.amount)}</td><td className="p-2">{entry.status}</td><td className="p-2 text-right">{entry.status === "posted" && permissionOn(permissions, "vouchers") && <button type="button" onClick={() => void voidEntry(entry.id)} className="text-[10px] font-bold text-red-600">Void</button>}</td></tr>)}</tbody></table></div>
      </section>}

      {activeTab === "student_fee" && <section className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex items-center justify-between"><div><h4 className="text-sm font-black">Student Fees & Payments</h4><p className="mt-1 text-xs text-[var(--school-muted)]">Every Student Fee must be saved with the student's exact ID so it appears on that student's dashboard.</p></div><button type="button" onClick={() => openEntry("student_fee")} className="rounded-xl theme-primary-bg px-3 py-2 text-xs font-bold">+ Record Fee</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead><tr className="border-b border-[var(--school-border)] text-[10px] uppercase tracking-wider text-[var(--school-muted)]"><th className="p-2">Date</th><th className="p-2">Student ID</th><th className="p-2">Student</th><th className="p-2">Category</th><th className="p-2 text-right">Amount</th><th className="p-2">Voucher</th></tr></thead><tbody>{entries.filter((entry) => entry.entry_type === "student_fee").map((entry) => <tr key={entry.id} className="border-b border-[var(--school-border)]"><td className="p-2">{entry.entry_date}</td><td className="p-2 font-bold">{entry.party_id || "-"}</td><td className="p-2">{entry.party_name || "-"}</td><td className="p-2">{entry.category || "-"}</td><td className="p-2 text-right font-black">৳ {money(entry.amount)}</td><td className="p-2">{entry.voucher_no}</td></tr>)}</tbody></table></div></section>}

      {activeTab === "salary" && <section className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex items-center justify-between"><div><h4 className="text-sm font-black">Teacher & Staff Salary</h4><p className="mt-1 text-xs text-[var(--school-muted)]">Select a teacher or staff member to fill their member ID and salary.</p></div><button type="button" onClick={() => openEntry("salary")} className="rounded-xl theme-primary-bg px-3 py-2 text-xs font-bold">+ Salary Payment</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{payees.map((payee) => <button key={`${payee.member_type}-${payee.member_id}`} type="button" onClick={() => { openEntry("salary"); setTimeout(() => usePayee(payee), 0); }} className="rounded-xl border border-[var(--school-border)] p-3 text-left hover:bg-[var(--school-primary-soft)]"><p className="text-xs font-black">{payee.full_name}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{payee.member_id} · {payee.designation || payee.member_type}</p><p className="mt-1 text-xs font-black">৳ {money(Number(payee.salary))}</p></button>)}</div></section>}

      {activeTab === "payments" && <section className="rounded-2xl border border-[var(--school-border)] p-4"><h4 className="text-sm font-black">Payables & Bills</h4><div className="mt-3 flex flex-wrap gap-2">{[["vendor_payment","Vendor Payment"],["school_bill","School Bill"],["other_payment","Other Payment"]].filter(([type]) => permissionOn(permissions, type === "vendor_payment" ? "vendor_payment" : type === "school_bill" ? "school_bills" : "other_member_payment")).map(([type,label]) => <button key={type} type="button" onClick={() => openEntry(type)} className="rounded-xl theme-primary-bg px-3 py-2 text-xs font-bold">+ {label}</button>)}</div></section>}

      {activeTab === "cashbank" && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[var(--school-border)] p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--school-muted)]">Cash Balance</p><p className="mt-2 text-2xl font-black theme-primary">৳ {money(summary.cash)}</p></div><div className="rounded-2xl border border-[var(--school-border)] p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--school-muted)]">Bank Balance</p><p className="mt-2 text-2xl font-black theme-primary">৳ {money(summary.bank)}</p></div></div>}

      {activeTab === "reports" && <section className="rounded-2xl border border-[var(--school-border)] p-5"><h4 className="text-sm font-black">Financial Reports</h4><p className="mt-2 text-xs text-[var(--school-muted)]">Current totals: Income ৳ {money(summary.income)}, Expense ৳ {money(summary.expense)}, Net ৳ {money(summary.net)}, Transactions {summary.transactions}.</p></section>}

      {showForm && <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="accounts-entry-title">
        <div className="my-auto w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--school-border)] pb-4"><div><p className="text-[10px] font-black uppercase tracking-wider theme-primary">Accounts Entry</p><h3 id="accounts-entry-title" className="mt-1 text-lg font-black">{entryLabels[form.entry_type] || "Financial Entry"}</h3><p className="mt-1 text-[10px] text-[var(--school-muted)]">Use the exact ID for the person whose account this transaction belongs to.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[var(--school-border)] px-3 py-1.5 text-[10px] font-bold">Close</button></div>
          <form onSubmit={saveEntry} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-bold">Date<input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">Entry Type<select value={form.entry_type} onChange={(e) => setForm({ ...form, entry_type: e.target.value })} className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"><option value="income">Income</option><option value="expense">Expense</option><option value="student_fee">Student Fee</option><option value="salary">Salary</option><option value="vendor_payment">Vendor Payment</option><option value="school_bill">School Bill</option><option value="other_payment">Other Member Payment</option></select></label>
            <label className="text-[10px] font-bold">Account Head / Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Tuition Fee / Salary / Electricity" className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">Payment Method<select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"><option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile_banking">Mobile Banking</option><option value="cheque">Cheque</option></select></label>
            <label className="text-[10px] font-bold">Account / Bank<input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Cash / bank account name" className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">Party / Student Name<input value={form.party_name} onChange={(e) => setForm({ ...form, party_name: e.target.value })} placeholder="Name" className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">{form.entry_type === "student_fee" ? "Student ID" : "Member / Student ID"}<input value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })} placeholder={form.entry_type === "student_fee" ? "Required student ID" : "Optional ID"} required={form.entry_type === "student_fee"} className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">Reference No.<input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} placeholder="Bill / receipt / salary reference" className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="text-[10px] font-bold">Party Type<input value={form.party_type} onChange={(e) => setForm({ ...form, party_type: e.target.value })} placeholder="student / vendor / teacher" className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            <label className="sm:col-span-2 text-[10px] font-bold">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details / notes" rows={3} className="mt-1 w-full resize-y rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 text-xs"/></label>
            {error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
            <div className="sm:col-span-2 flex justify-end gap-2 border-t border-[var(--school-border)] pt-4"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-bold">Cancel</button><button type="submit" disabled={saving} className="rounded-xl theme-primary-bg px-4 py-2.5 text-xs font-bold disabled:opacity-60">{saving ? "Saving..." : "Save & Create Voucher"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
