"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type SrItem = { item_id: string; item_code: string; item_name: string; unit: string; current_stock: number; requested_quantity: number; issued_quantity: number; remaining_quantity: number; item_note: string | null };
type Sr = { id: string; sr_number: string; requester_name: string; requester_login_id: string; requester_email: string | null; requester_phone: string | null; class_name: string | null; department: string | null; request_details: string | null; status: string; admin_note: string | null; requested_at: string; processed_at: string | null; items: SrItem[] };

const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("reject")) return "border-red-200 bg-red-50 text-red-700";
  if (s.includes("pending")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (s.includes("partial")) return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] theme-primary";
};

export default function ItemSrAdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [srs, setSrs] = useState<Sr[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Sr | null>(null);
  const [issueQty, setIssueQty] = useState<Record<string, string>>({});
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(searchValue = search) {
    setLoading(true); setError("");
    const { data, error: loadError } = await supabase.rpc("store_admin_list_srs", { p_search: searchValue.trim() || null });
    if (loadError) setError(loadError.message); else setSrs((data ?? []).map((row: Sr) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
    setLoading(false);
  }

  useEffect(() => { void load(""); }, []);

  function openSr(sr: Sr) {
    setSelected(sr); setAdminNote(sr.admin_note || "");
    setIssueQty(Object.fromEntries(sr.items.map((item) => [item.item_id, String(item.remaining_quantity > 0 ? item.remaining_quantity : 0)])));
    setMessage(""); setError("");
  }

  async function process(action: "approve" | "reject" | "issue") {
    if (!selected) return;
    if (action === "reject" && !window.confirm(`Reject ${selected.sr_number}?`)) return;
    const issueItems = selected.items.map((item) => ({ item_id: item.item_id, quantity: Number(issueQty[item.item_id] || 0) })).filter((item) => item.quantity > 0);
    setSaving(true); setMessage(""); setError("");
    const { error: processError } = await supabase.rpc("store_admin_process_sr", { p_request_id: selected.id, p_action: action, p_issue_items: issueItems, p_admin_note: adminNote.trim() || null });
    if (processError) setError(processError.message);
    else { setMessage(`${selected.sr_number} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "issued successfully"}.`); setSelected(null); setIssueQty({}); await load(); }
    setSaving(false);
  }

  const visible = srs.filter((sr) => status === "all" || sr.status === status);
  const pending = srs.filter((sr) => sr.status === "pending").length;
  const approved = srs.filter((sr) => sr.status === "approved" || sr.status === "partially_issued").length;
  const issued = srs.filter((sr) => sr.status === "issued").length;

  return <AdminPageShell eyebrow="Store & Operations" title="Item Service Requests" description="Review, approve, reject and issue item requests from members in one clean workspace.">
    {message ? <p className="mb-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
    {error ? <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

    <div className="grid gap-3 sm:grid-cols-3">
      {[['Pending', pending], ['Approved / Partial', approved], ['Issued', issued]].map(([label, value]) => <button key={String(label)} type="button" onClick={() => setStatus(label === 'Pending' ? 'pending' : label === 'Approved / Partial' ? 'approved' : 'issued')} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 text-left shadow-sm hover:bg-[var(--school-primary-soft)]"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--school-muted)]">{label}</p><p className="mt-1 text-2xl font-black theme-primary">{value}</p></button>)}
    </div>

    <section className="mt-5 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Request Queue</p><h2 className="mt-1 text-xl font-black">All Service Requests</h2></div><div className="flex flex-col gap-2 sm:flex-row"><input className="field min-w-0 sm:w-72" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void load(); }} placeholder="Search SR / requester / ID" /><select className="field sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="partially_issued">Partially Issued</option><option value="issued">Issued</option><option value="rejected">Rejected</option></select><button type="button" onClick={() => void load()} className="rounded-xl px-4 py-2.5 text-sm font-bold theme-primary-bg">Search</button></div></div>
      <div className="mt-5 space-y-3">
        {loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-10 text-center text-sm text-[var(--school-muted)]">Loading service requests...</p> : null}
        {!loading && visible.map((sr) => <button key={sr.id} type="button" onClick={() => openSr(sr)} className="w-full rounded-2xl border border-[var(--school-border)] p-4 text-left transition hover:border-[var(--school-primary-border)] hover:bg-[var(--school-primary-soft)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black theme-primary">{sr.sr_number}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black capitalize ${statusClass(sr.status)}`}>{sr.status.replace(/_/g, ' ')}</span></div><h3 className="mt-1 text-base font-black">{sr.requester_name}</h3><p className="text-xs text-[var(--school-muted)]">ID: {sr.requester_login_id}{sr.department ? ` · ${sr.department}` : ''}{sr.class_name ? ` · Class ${sr.class_name}` : ''}</p></div><span className="shrink-0 text-[10px] text-[var(--school-muted)]">{new Date(sr.requested_at).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{sr.items.map((item) => <span key={`${sr.id}-${item.item_id}`} className="rounded-lg bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-semibold theme-primary">{item.item_code} × {item.requested_quantity}</span>)}</div></button>)}
        {!loading && !visible.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-10 text-center text-sm text-[var(--school-muted)]">No service requests found.</p> : null}
      </div>
    </section>

    {selected ? <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="sr-detail-title"><div className="mx-auto my-4 w-full max-w-3xl rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-[var(--school-border)] p-5 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Item Service Request</p><h2 id="sr-detail-title" className="mt-1 text-xl font-black">{selected.sr_number}</h2><p className="mt-1 text-xs text-[var(--school-muted)]">{selected.requester_name} · {selected.requester_login_id}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-sm font-bold">×</button></div><div className="space-y-4 p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[var(--school-primary-soft)] p-3"><p className="text-[10px] text-[var(--school-muted)]">Status</p><p className="mt-1 text-sm font-black capitalize theme-primary">{selected.status.replace(/_/g,' ')}</p></div><div className="rounded-xl border border-[var(--school-border)] p-3"><p className="text-[10px] text-[var(--school-muted)]">Class</p><p className="mt-1 text-sm font-bold">{selected.class_name || '-'}</p></div><div className="rounded-xl border border-[var(--school-border)] p-3"><p className="text-[10px] text-[var(--school-muted)]">Department</p><p className="mt-1 text-sm font-bold">{selected.department || '-'}</p></div></div><div><p className="text-xs font-black uppercase tracking-[0.12em] theme-primary">Requested Items</p><div className="mt-2 space-y-2">{selected.items.map((item) => <div key={item.item_id} className="grid gap-2 rounded-xl border border-[var(--school-border)] p-3 sm:grid-cols-[minmax(0,1fr)_90px_100px]"><div><p className="text-xs font-black theme-primary">{item.item_code}</p><p className="text-sm font-bold">{item.item_name}</p><p className="text-[10px] text-[var(--school-muted)]">Stock: {item.current_stock} {item.unit} · Requested: {item.requested_quantity} · Issued: {item.issued_quantity} · Remaining: {item.remaining_quantity}</p>{item.item_note ? <p className="mt-1 text-[10px] text-[var(--school-muted)]">Note: {item.item_note}</p> : null}</div><div className="rounded-lg bg-[var(--school-primary-soft)] px-3 py-2 text-center"><p className="text-[9px] text-[var(--school-muted)]">Request</p><p className="font-black theme-primary">{item.requested_quantity} {item.unit}</p></div>{(selected.status === 'approved' || selected.status === 'partially_issued') ? <label><span className="mb-1 block text-[9px] font-bold">Issue Qty</span><input className="field w-full" type="number" min="0" max={item.remaining_quantity} step="0.01" value={issueQty[item.item_id] || ''} onChange={(e) => setIssueQty((current) => ({ ...current, [item.item_id]: e.target.value }))} /></label> : <div />}</div>)}</div></div><div><label className="text-xs font-black">Admin Note<textarea className="field mt-1 min-h-20 w-full py-2" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Optional note for the requester or store record" /></label></div><div className="flex flex-col-reverse gap-2 border-t border-[var(--school-border)] pt-4 sm:flex-row sm:justify-end">{(selected.status === 'pending' || selected.status === 'approved' || selected.status === 'partially_issued') ? <button type="button" disabled={saving} onClick={() => void process('reject')} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50">Reject</button> : null}{selected.status === 'pending' ? <button type="button" disabled={saving} onClick={() => void process('approve')} className="rounded-xl px-4 py-2.5 text-sm font-bold theme-primary-bg disabled:opacity-50">{saving ? 'Processing...' : 'Approve SR'}</button> : null}{(selected.status === 'approved' || selected.status === 'partially_issued') ? <button type="button" disabled={saving} onClick={() => void process('issue')} className="rounded-xl px-4 py-2.5 text-sm font-bold theme-primary-bg disabled:opacity-50">{saving ? 'Processing...' : 'Issue Selected Qty'}</button> : null}</div></div></div></div> : null}
  </AdminPageShell>;
}
