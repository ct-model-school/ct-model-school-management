"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = [
  ["teacher", "Teacher"],
  ["staff", "Staff"],
  ["accounts", "Accounts"],
  ["other", "Other"],
] as const;

export default function MemberRecoveryPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState("teacher");
  const [memberId, setMemberId] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.rpc("store_request_password_reset", {
      p_login_id: memberId.trim(),
      p_member_type: category,
      p_contact_hint: contact.trim(),
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Recovery request submitted. The administrator will verify your member information and help restore access.");
      setMemberId("");
      setContact("");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-8 text-[var(--school-text)] sm:px-6 sm:py-12">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm sm:p-8">
        <button type="button" onClick={() => router.push("/members")} className="text-sm font-bold theme-primary">← Back to Member Portal</button>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] theme-primary">Account Recovery</p>
        <h1 className="mt-2 text-3xl font-black">Need help signing in?</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--school-muted)]">Enter your Member ID and a registered contact detail. Your request will be sent to the school administrator for verification.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block"><span className="label">Member Category</span><select className="field w-full" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block"><span className="label">Member ID</span><input className="field w-full" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="e.g. TCID000003" required /></label>
          <label className="block"><span className="label">Registered Email / Phone</span><input className="field w-full" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Enter a registered contact detail" required /></label>
          {message ? <p className="rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary" role="alert">{message}</p> : null}
          <button disabled={loading} className="w-full rounded-xl px-5 py-3.5 text-sm font-black theme-primary-bg disabled:opacity-60">{loading ? "Submitting..." : "Send Recovery Request"}</button>
        </form>
      </section>
    </main>
  );
}
