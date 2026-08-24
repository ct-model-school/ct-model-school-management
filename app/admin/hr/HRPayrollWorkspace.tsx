"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  member_id: string;
  member_type: "teacher" | "staff" | "accounts" | "other";
  full_name: string;
  designation: string | null;
  department: string | null;
  subject: string | null;
  salary: number;
  phone: string | null;
  email: string | null;
  is_active: boolean;
};

type Payroll = {
  id: string;
  payroll_month: string;
  member_id: string;
  member_type: string;
  member_name: string;
  designation: string | null;
  department: string | null;
  base_salary: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  per_day_salary: number;
  gross_earned: number;
  bonus_percent: number;
  bonus_amount: number;
  extra_payment: number;
  other_earnings: number;
  deductions: number;
  payable_salary: number;
  status: string;
  accounts_entry_id: string | null;
  submitted_at: string | null;
  paid_at: string | null;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const monthNow = () => new Date().toISOString().slice(0, 7) + "-01";

const monthOptions = () => {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let offset = -12; offset <= 6; offset += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    options.push({
      value,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  return options;
};

export default function HRPayrollWorkspace() {
  const supabase = useMemo(() => createClient(), []);
  const months = useMemo(() => monthOptions(), []);
  const [memberId, setMemberId] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [present, setPresent] = useState("28");
  const [absent, setAbsent] = useState("2");
  const [deduction, setDeduction] = useState("0");
  const [bonusPercent, setBonusPercent] = useState("0");
  const [extraPayment, setExtraPayment] = useState("0");
  const [otherEarnings, setOtherEarnings] = useState("0");
  const [month, setMonth] = useState(monthNow());
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [existingPayroll, setExistingPayroll] = useState<Payroll | null>(null);
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [editingRevision, setEditingRevision] = useState(false);

  const loadMembers = useCallback(
    async (q: string) => {
      const r = await supabase.rpc("store_hr_admin_list_members", { p_search: q || null });
      if (!r.error) setMembers((r.data || []) as Member[]);
      else setError(r.error.message);
    },
    [supabase],
  );

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    const r = await supabase.rpc("store_hr_admin_list_payroll", {
      p_month: `${month.slice(0, 7)}-01`,
      p_search: search || null,
    });
    if (r.error) setError(r.error.message);
    else setPayrolls((r.data || []) as Payroll[]);
    setLoading(false);
  }, [supabase, month, search]);

  useEffect(() => {
    void loadMembers("");
  }, [loadMembers]);

  useEffect(() => {
    void loadPayroll();
  }, [loadPayroll]);

  const resetSalaryFields = () => {
    setPresent("28");
    setAbsent("2");
    setDeduction("0");
    setBonusPercent("0");
    setExtraPayment("0");
    setOtherEarnings("0");
  };

  const checkExistingPayroll = useCallback(
    async (id: string, payrollMonth: string) => {
      if (!id.trim()) return null;
      const r = await supabase.rpc("store_hr_admin_list_payroll", {
        p_month: `${payrollMonth.slice(0, 7)}-01`,
        p_search: id.trim(),
      });
      if (r.error) {
        setError(r.error.message);
        return null;
      }
      const rows = (r.data || []) as Payroll[];
      return rows.find((x) => x.member_id.toLowerCase() === id.trim().toLowerCase()) || null;
    },
    [supabase],
  );

  const handleExistingPayroll = useCallback(
    (existing: Payroll | null) => {
      setExistingPayroll(existing);
      if (existing) {
        setShowRevisionPrompt(true);
        return;
      }
      setEditingRevision(false);
      resetSalaryFields();
    },
    [],
  );

  const chooseMember = (id: string) => {
    setMemberId(id);
    setError("");
    setOk("");
    const found = members.find((m) => m.member_id.toLowerCase() === id.trim().toLowerCase());
    setMember(found || null);
    setEditingRevision(false);
    setExistingPayroll(null);
    if (found) {
      resetSalaryFields();
      void checkExistingPayroll(found.member_id, month).then(handleExistingPayroll);
    }
  };

  const handleMonthChange = (nextMonth: string) => {
    setMonth(nextMonth);
    setError("");
    setOk("");
    setEditingRevision(false);
    setExistingPayroll(null);
    if (member) {
      resetSalaryFields();
      void checkExistingPayroll(member.member_id, nextMonth).then(handleExistingPayroll);
    }
  };

  const acceptRevision = () => {
    if (!existingPayroll) return;
    setPresent(String(existingPayroll.present_days));
    setAbsent(String(existingPayroll.absent_days));
    setDeduction(String(existingPayroll.deductions));
    setBonusPercent(String(existingPayroll.bonus_percent));
    setExtraPayment(String(existingPayroll.extra_payment));
    setOtherEarnings(String(existingPayroll.other_earnings));
    setEditingRevision(true);
    setShowRevisionPrompt(false);
    setOk(`Revising ${existingPayroll.member_id}'s ${month.slice(0, 7)} salary sheet.`);
  };

  const rejectRevision = () => {
    setShowRevisionPrompt(false);
    setExistingPayroll(null);
    setEditingRevision(false);
    setMember(null);
    setMemberId("");
    resetSalaryFields();
    setError("Revision cancelled. No existing salary sheet was changed.");
  };

  const working = 30;
  const p = Math.max(0, Number(present) || 0);
  const a = Math.max(0, Number(absent) || 0);
  const d = Math.max(0, Number(deduction) || 0);
  const bp = Math.min(100, Math.max(0, Number(bonusPercent) || 0));
  const extra = Math.max(0, Number(extraPayment) || 0);
  const other = Math.max(0, Number(otherEarnings) || 0);
  const base = Number(member?.salary || 0);
  const perDay = base / working;
  const earned = Math.max(0, Math.round(perDay * p * 100) / 100);
  const bonusAmount = Math.round((base * bp) / 100 * 100) / 100;
  const payable = Math.max(0, Math.round((earned + bonusAmount + extra + other - d) * 100) / 100);
  const valid = p + a <= working;

  async function submit() {
    if (!member) return setError("Enter a valid employee ID first.");
    if (!valid) return setError("Present + Absent cannot exceed 30 days.");
    if (base <= 0) return setError("Salary is not configured for this employee.");

    if (!editingRevision) {
      const existing = await checkExistingPayroll(member.member_id, month);
      if (existing) {
        setExistingPayroll(existing);
        setShowRevisionPrompt(true);
        return;
      }
    }

    setSaving(true);
    setError("");
    setOk("");
    const r = await supabase.rpc("store_hr_admin_submit_payroll", {
      p_payroll_month: `${month.slice(0, 7)}-01`,
      p_member_id: member.member_id,
      p_present_days: p,
      p_absent_days: a,
      p_deductions: d,
      p_bonus_percent: bp,
      p_extra_payment: extra,
      p_other_earnings: other,
    });
    setSaving(false);

    if (r.error) {
      setError(r.error.message);
      return;
    }

    setEditingRevision(false);
    setExistingPayroll(null);
    setOk(
      `${editingRevision ? "Revised" : "Salary sheet"} submitted for ${member.member_id}. Voucher ${r.data?.voucher_no || ""}`,
    );
    await loadPayroll();
  }

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">HR • Attendance & Payroll</p>
            <h2 className="mt-1 text-xl font-black">Monthly Salary Sheet</h2>
            <p className="mt-1 text-xs text-[var(--school-muted)]">Prepare attendance, salary, bonus and other approved earnings. The final payable amount is sent to Accounts.</p>
          </div>
          <label className="text-[10px] font-bold text-[var(--school-muted)]">
            Payroll Month
            <select value={month} onChange={(e) => handleMonthChange(e.target.value)} className="mt-1 block rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2 text-xs font-bold">
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
        </div>

        {editingRevision && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
            Revision mode: this salary sheet already exists for {month.slice(0, 7)}. Update the values below and submit the revised sheet.
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-bold">
              Employee ID
              <input list="hr-member-list" value={memberId} onChange={(e) => chooseMember(e.target.value)} onBlur={(e) => chooseMember(e.target.value)} placeholder="e.g. TCID00001 / STID00001 / ACID00001" className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-3 text-xs font-bold" autoComplete="off" />
              <datalist id="hr-member-list">{members.map((m) => <option key={m.member_id} value={m.member_id}>{m.full_name} • {m.member_type}</option>)}</datalist>
            </label>
            <label className="text-[10px] font-bold">
              Quick Search
              <input value={memberId ? "" : search} onChange={(e) => { setSearch(e.target.value); void loadMembers(e.target.value); }} placeholder="Search ID, name, department..." className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-3 text-xs" />
            </label>
          </div>
          {member && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">{[["Member ID", member.member_id], ["Name", member.full_name], ["Type", member.member_type], ["Designation", member.designation || "-"], ["Department", member.department || "-"], ["Base Salary", `৳ ${money(base)}`]].map(([k, v]) => <div key={k} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[var(--school-muted)]">{k}</p><p className="mt-1 text-xs font-black capitalize">{v}</p></div>)}</div>}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-[10px] font-bold">Working Days<input value="30" readOnly className="mt-1 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] px-3 py-3 text-xs font-bold" /></label>
          <label className="text-[10px] font-bold">Present Days<input type="number" min="0" max="30" value={present} onChange={(e) => { setPresent(e.target.value); setAbsent(String(Math.max(0, 30 - Number(e.target.value || 0)))); }} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-3 text-xs font-bold" /></label>
          <label className="text-[10px] font-bold">Absent Days<input type="number" min="0" max="30" value={absent} onChange={(e) => setAbsent(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-3 text-xs font-bold" /></label>
          <label className="text-[10px] font-bold">Deduction<input type="number" min="0" step="0.01" value={deduction} onChange={(e) => setDeduction(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-3 text-xs font-bold" /></label>
          <div className={`rounded-xl border p-3 ${valid ? "border-[var(--school-border)]" : "border-red-200 bg-red-50"}`}><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Attendance Check</p><p className={`mt-1 text-sm font-black ${valid ? "theme-primary" : "text-red-700"}`}>{p + a}/30 Days</p></div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-[10px] font-bold">Bonus % of Base Salary<input type="number" min="0" max="100" step="0.01" value={bonusPercent} onChange={(e) => setBonusPercent(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-3 text-xs font-bold" /></label>
          <div className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Bonus Amount</p><p className="mt-1 text-lg font-black">৳ {money(bonusAmount)}</p></div>
          <label className="text-[10px] font-bold">Extra Payment / Gift<input type="number" min="0" step="0.01" value={extraPayment} onChange={(e) => setExtraPayment(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-3 text-xs font-bold" /></label>
          <label className="text-[10px] font-bold">Other Approved Earnings<input type="number" min="0" step="0.01" value={otherEarnings} onChange={(e) => setOtherEarnings(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--school-border)] px-3 py-3 text-xs font-bold" /></label>
          <div className="rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-3"><p className="text-[9px] font-black uppercase theme-primary">Additional Earnings</p><p className="mt-1 text-lg font-black theme-primary">৳ {money(bonusAmount + extra + other)}</p></div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-[var(--school-border)] p-4"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Base Salary</p><p className="mt-1 text-lg font-black">৳ {money(base)}</p></div>
          <div className="rounded-2xl border border-[var(--school-border)] p-4"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Per Day</p><p className="mt-1 text-lg font-black">৳ {money(perDay)}</p></div>
          <div className="rounded-2xl border border-[var(--school-border)] p-4"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Earned Salary</p><p className="mt-1 text-lg font-black theme-primary">৳ {money(earned)}</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[9px] font-black uppercase text-amber-700">Deduction</p><p className="mt-1 text-lg font-black text-amber-800">৳ {money(d)}</p></div>
          <div className="rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-4"><p className="text-[9px] font-black uppercase theme-primary">Final Payable</p><p className="mt-1 text-xl font-black theme-primary">৳ {money(payable)}</p></div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
        {ok && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{ok}</div>}
        <div className="mt-5 flex justify-end"><button disabled={saving || !member || !valid || base <= 0} onClick={() => void submit()} className="rounded-xl theme-primary-bg px-5 py-3 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Submitting..." : editingRevision ? "Submit Revised Salary Sheet" : "Submit Salary Sheet"}</button></div>
      </section>

      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">Submitted Payroll</p><h3 className="mt-1 text-lg font-black">{month.slice(0, 7)} Salary Sheets</h3></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter ID / name / department" className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-xs" /></div>
        {loading ? <div className="py-8 text-center text-xs text-[var(--school-muted)]">Loading salary sheets...</div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1450px] text-left text-xs"><thead><tr className="border-b border-[var(--school-border)] text-[10px] uppercase tracking-wider text-[var(--school-muted)]"><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Base</th><th className="p-3">Present</th><th className="p-3">Absent</th><th className="p-3">Earned</th><th className="p-3">Bonus</th><th className="p-3">Extra</th><th className="p-3">Other</th><th className="p-3">Deduction</th><th className="p-3">Payable</th><th className="p-3">Accounts</th><th className="p-3">Status</th></tr></thead><tbody>{payrolls.map((x) => <tr key={x.id} className="border-b border-[var(--school-border)]"><td className="p-3 font-black">{x.member_id}</td><td className="p-3">{x.member_name}</td><td className="p-3 capitalize">{x.member_type}</td><td className="p-3">৳ {money(x.base_salary)}</td><td className="p-3">{x.present_days}</td><td className="p-3">{x.absent_days}</td><td className="p-3 theme-primary">৳ {money(x.gross_earned)}</td><td className="p-3">৳ {money(x.bonus_amount)} <span className="text-[9px] text-[var(--school-muted)]">({x.bonus_percent}%)</span></td><td className="p-3">৳ {money(x.extra_payment)}</td><td className="p-3">৳ {money(x.other_earnings)}</td><td className="p-3 text-amber-700">৳ {money(x.deductions)}</td><td className="p-3 font-black">৳ {money(x.payable_salary)}</td><td className="p-3">{x.accounts_entry_id ? "Linked" : "-"}</td><td className="p-3 font-black uppercase"><span className={x.status === "paid" ? "text-emerald-700" : x.status === "partial" ? "text-amber-700" : x.status === "submitted" ? "theme-primary" : "text-[var(--school-muted)]"}>{x.status}</span></td></tr>)}</tbody></table>{payrolls.length === 0 && <div className="py-8 text-center text-xs text-[var(--school-muted)]">No salary sheet submitted for this month.</div>}</div>}
      </section>

      {showRevisionPrompt && existingPayroll && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="salary-revision-title">
          <div className="w-full max-w-md rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">Salary Sheet Already Submitted</p>
            <h3 id="salary-revision-title" className="mt-2 text-xl font-black text-[var(--school-text)]">Already submitted for this month</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--school-muted)]">A salary sheet for <span className="font-black text-[var(--school-text)]">{existingPayroll.member_id}</span> has already been submitted for <span className="font-black text-[var(--school-text)]">{month.slice(0, 7)}</span>.</p>
            <div className="mt-4 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4 text-xs"><div className="flex justify-between gap-3"><span>Current payable</span><b>৳ {money(existingPayroll.payable_salary)}</b></div><div className="mt-2 flex justify-between gap-3"><span>Status</span><b className="uppercase">{existingPayroll.status}</b></div></div>
            <p className="mt-4 text-sm font-bold text-[var(--school-text)]">Do you want to send a revised salary sheet?</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={rejectRevision} className="rounded-xl border border-[var(--school-border)] px-5 py-3 text-xs font-black text-[var(--school-text)] hover:bg-[var(--school-primary-soft)]">No, Go Back</button><button type="button" onClick={acceptRevision} className="rounded-xl theme-primary-bg px-5 py-3 text-xs font-black">Yes, Revise Salary Sheet</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
