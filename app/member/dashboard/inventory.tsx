"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; brand: string | null; model: string | null; unit: string; current_stock: number; reorder_level: number };
type SrItem = { item_id: string; item_code: string; item_name: string; unit: string; current_stock: number; requested_quantity: number; issued_quantity: number; remaining_quantity: number; item_note: string | null };
type Sr = { id: string; sr_number: string; requester_name: string; requester_login_id: string; class_name: string | null; department: string | null; request_details: string | null; status: string; requested_at: string; items: SrItem[] };

export default function InventoryModule() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [srs, setSrs] = useState<Sr[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [srSearch, setSrSearch] = useState("");
  const [issueQuantities, setIssueQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setLoading(true);
    const [itemsResult, srResult] = await Promise.all([
      supabase.rpc("store_member_list_inventory", { p_token: token, p_search: itemSearch || null }),
      supabase.rpc("store_admin_list_srs", { p_search: srSearch || null, p_token: token }),
    ]);
    if (itemsResult.error) setMessage(itemsResult.error.message);
    else setItems((itemsResult.data ?? []) as Item[]);
    if (srResult.error) setMessage(srResult.error.message);
    else setSrs((srResult.data ?? []).map((row: Sr) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function processSr(sr: Sr, action: "approve" | "reject" | "issue") {
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    if (action === "reject" && !window.confirm(`Reject ${sr.sr_number}?`)) return;
    const issueItems = sr.items.map((item) => ({ item_id: item.item_id, quantity: Number(issueQuantities[item.item_id] || 0) })).filter((item) => item.quantity > 0);
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("store_admin_process_sr", { p_request_id: sr.id, p_action: action, p_issue_items: issueItems, p_admin_note: "", p_token: token });
    if (error) setMessage(error.message);
    else { setMessage(`${sr.sr_number} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "issued"}.`); setIssueQuantities({}); await load(); }
    setSaving(false);
  }

  return <div className="space-y-5">
    {message ? <p className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] px-4 py-2.5 text-xs font-semibold theme-primary">{message}</p> : null}

    <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-3.5 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Store Inventory</p><p className="mt-0.5 text-xs text-[var(--school-muted)]">Search current stock by code, name, type or specification.</p></div>
        <div className="flex w-full gap-2 sm:w-auto"><input className="field min-w-0 flex-1 sm:w-72" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} placeholder="ITM-000001 or item name" /><button type="button" onClick={() => void load()} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Search</button></div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <article key={item.id} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-bold theme-primary">{item.item_code}</p><p className="truncate text-xs font-bold">{item.item_name}</p><p className="truncate text-[10px] text-[var(--school-muted)]">{item.item_type || ""}{item.specification ? ` • ${item.specification}` : ""}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${item.current_stock <= item.reorder_level ? "bg-red-50 text-red-700" : "bg-[var(--school-primary-soft)] theme-primary"}`}>{item.current_stock} {item.unit}</span></div></article>)}
      </div>
      {!loading && !items.length ? <p className="mt-3 rounded-xl border border-dashed border-[var(--school-border)] p-4 text-center text-xs text-[var(--school-muted)]">No items found.</p> : null}
    </section>

    <section className="rounded-2xl border border-[var(--school-border)] p-3.5 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">SR Approval</p><p className="mt-0.5 text-xs text-[var(--school-muted)]">Review, approve, reject and issue approved service requests.</p></div><div className="flex gap-2"><input className="field w-full sm:w-64" value={srSearch} onChange={(e) => setSrSearch(e.target.value)} placeholder="SR / member ID / name" /><button type="button" onClick={() => void load()} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Search</button></div></div>
      <div className="mt-3 space-y-2.5">
        {srs.map((sr) => <article key={sr.id} className="rounded-xl border border-[var(--school-border)] px-3 py-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black theme-primary">{sr.sr_number}</p><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-bold capitalize theme-primary">{sr.status.replace("_", " ")}</span></div><p className="mt-1 truncate text-xs font-bold">{sr.requester_name} <span className="font-normal text-[var(--school-muted)]">• {sr.requester_login_id}</span></p><p className="text-[10px] text-[var(--school-muted)]">{sr.class_name ? `Class ${sr.class_name}` : ""}{sr.department ? ` • ${sr.department}` : ""} • {new Date(sr.requested_at).toLocaleString()}</p></div><div className="flex shrink-0 gap-2">
          {sr.status === "pending" ? <><button type="button" disabled={saving} onClick={() => void processSr(sr, "approve")} className="rounded-lg px-3 py-2 text-[10px] font-bold theme-primary-bg">Approve</button><button type="button" disabled={saving} onClick={() => void processSr(sr, "reject")} className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600">Reject</button></> : null}
          {sr.status === "approved" || sr.status === "partially_issued" ? <button type="button" disabled={saving} onClick={() => void processSr(sr, "issue")} className="rounded-lg px-3 py-2 text-[10px] font-bold theme-primary-bg">Issue</button> : null}
        </div></div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{sr.items.map((item) => <div key={item.item_id} className="rounded-lg bg-[var(--school-background)] px-2.5 py-2"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-bold">{item.item_code} • {item.item_name}</p><span className="shrink-0 text-[10px] font-semibold">Req {item.remaining_quantity}</span></div>{sr.status === "approved" || sr.status === "partially_issued" ? <input className="field mt-1 w-full py-1.5 text-[10px]" type="number" min="0" max={item.remaining_quantity} step="0.01" value={issueQuantities[item.item_id] || ""} onChange={(e) => setIssueQuantities({ ...issueQuantities, [item.item_id]: e.target.value })} placeholder={`Issue qty • Stock ${item.current_stock}`} /> : null}</div>)}</div>
        {sr.request_details ? <p className="mt-2 rounded-lg bg-[var(--school-background)] px-2.5 py-2 text-[10px] leading-4 text-[var(--school-muted)]">{sr.request_details}</p> : null}
      </article>)}
      {!loading && !srs.length ? <p className="rounded-xl border border-dashed border-[var(--school-border)] p-5 text-center text-xs text-[var(--school-muted)]">No service requests found.</p> : null}
      </div>
    </section>
  </div>;
}
