"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import SrDetailModal from "@/components/SrDetailModal";

type Item = {
  id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; brand: string | null; model: string | null; unit: string; details: string | null; note: string | null; current_stock: number; reorder_level: number; is_active: boolean;
};
type SrItem = { item_id: string; item_code: string; item_name: string; item_type?: string | null; specification?: string | null; brand?: string | null; model?: string | null; unit: string; details?: string | null; note?: string | null; current_stock: number; requested_quantity: number; issued_quantity: number; remaining_quantity: number; item_note: string | null };
type Sr = { id: string; sr_number: string; requester_name: string; requester_login_id: string; requester_email: string | null; requester_phone: string | null; class_name: string | null; department: string | null; request_details: string | null; status: string; admin_note: string | null; requested_at: string; processed_at: string | null; items: SrItem[] };

type ItemForm = { id: string | null; item_name: string; item_type: string; specification: string; brand: string; model: string; unit: string; details: string; note: string; current_stock: string; reorder_level: string };
const emptyItem: ItemForm = { id: null, item_name: "", item_type: "", specification: "", brand: "", model: "", unit: "pcs", details: "", note: "", current_stock: "0", reorder_level: "0" };
const units = ["pcs", "set", "box", "roll", "meter", "kg", "liter", "pair", "other"];

export default function InventoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"items" | "sr">("items");
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [form, setForm] = useState<ItemForm>(emptyItem);
  const [srs, setSrs] = useState<Sr[]>([]);
  const [selectedSr, setSelectedSr] = useState<Sr | null>(null);
  const [srSearch, setSrSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [issueQuantities, setIssueQuantities] = useState<Record<string, string>>({});

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase.from("inventory_items").select("id,item_code,item_name,item_type,specification,brand,model,unit,details,note,current_stock,reorder_level,is_active").order("item_name", { ascending: true });
    if (error) setMessage(error.message); else setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  async function loadSrs(search = srSearch) {
    setLoading(true);
    const { data, error } = await supabase.rpc("store_admin_list_srs", { p_search: search || null });
    if (error) setMessage(error.message); else setSrs((data ?? []).map((row: Sr) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
    setLoading(false);
  }

  useEffect(() => { void loadItems(); void loadSrs(""); }, []);

  async function saveItem(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    const { data, error } = await supabase.rpc("store_admin_save_item", { p_id: form.id, p_item_name: form.item_name, p_item_type: form.item_type, p_specification: form.specification, p_brand: form.brand, p_model: form.model, p_unit: form.unit, p_details: form.details, p_note: form.note, p_current_stock: Number(form.current_stock) || 0, p_reorder_level: Number(form.reorder_level) || 0 });
    if (error) setMessage(error.message);
    else { setMessage(form.id ? "Item updated successfully." : `Item added: ${(data as Item).item_code}`); setForm(emptyItem); await loadItems(); }
    setSaving(false);
  }

  async function deactivateItem(item: Item) {
    if (!window.confirm(`Remove ${item.item_name} (${item.item_code}) from active store items?`)) return;
    const { error } = await supabase.rpc("store_admin_deactivate_item", { p_id: item.id });
    if (error) setMessage(error.message); else { setMessage("Item removed from active store items."); await loadItems(); }
  }

  async function processSr(sr: Sr, action: "approve" | "reject" | "issue") {
    if (action === "reject" && !window.confirm(`Reject ${sr.sr_number}?`)) return;
    const issueItems = sr.items.map((item) => ({ item_id: item.item_id, quantity: Number(issueQuantities[item.item_id] || 0) })).filter((item) => item.quantity > 0);
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("store_admin_process_sr", { p_request_id: sr.id, p_action: action, p_issue_items: issueItems, p_admin_note: "" });
    if (error) setMessage(error.message);
    else { setMessage(`${sr.sr_number} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "processed"}.`); setIssueQuantities({}); await Promise.all([loadSrs(), loadItems()]); }
    setSaving(false);
  }

  const visibleItems = items.filter((item) => {
    if (!item.is_active) return false;
    const q = itemSearch.trim().toLowerCase();
    if (!q) return true;
    return [item.item_code, item.item_name, item.item_type, item.specification, item.brand, item.model, item.details, item.note].some((value) => value?.toLowerCase().includes(q));
  });

  function editItem(item: Item) {
    setForm({ id: item.id, item_name: item.item_name, item_type: item.item_type || "", specification: item.specification || "", brand: item.brand || "", model: item.model || "", unit: item.unit, details: item.details || "", note: item.note || "", current_stock: String(item.current_stock), reorder_level: String(item.reorder_level) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminPageShell eyebrow="Store & Service Requests" title="Store Management" description="Manage all store items and process User Service Requests from one place.">
      <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button onClick={() => setTab("items")} className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === "items" ? "theme-primary-bg" : "border border-[var(--school-border)] bg-[var(--school-surface)]"}`}>Items</button>
        <button onClick={() => { setTab("sr"); void loadSrs(""); }} className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === "sr" ? "theme-primary-bg" : "border border-[var(--school-border)] bg-[var(--school-surface)]"}`}>User SR</button>
      </div>
      {message ? <p className="mb-5 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}

      {tab === "items" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,.95fr)]">
          <form onSubmit={saveItem} className="order-1 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 lg:p-7">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black sm:text-2xl">{form.id ? "Edit Item" : "Add New Item"}</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)] sm:text-sm">Item code is generated automatically.</p></div>{form.id ? <button type="button" onClick={() => setForm(emptyItem)} className="shrink-0 rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}</div>
            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
              <label className="sm:col-span-2"><span className="label">Item Name *</span><input className="field w-full" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required /></label>
              <label><span className="label">Type</span><input className="field w-full" value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} placeholder="Electrical / Stationery" /></label>
              <label><span className="label">Unit</span><select className="field w-full" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
              <label className="sm:col-span-2"><span className="label">Specification</span><input className="field w-full" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} placeholder="Size, rating, capacity, etc." /></label>
              <label><span className="label">Brand</span><input className="field w-full" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
              <label><span className="label">Model</span><input className="field w-full" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label>
              <label><span className="label">Present Stock</span><input className="field w-full" type="number" min="0" step="0.01" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} /></label>
              <label><span className="label">Low Stock Alert</span><input className="field w-full" type="number" min="0" step="0.01" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></label>
              <label className="sm:col-span-2"><span className="label">Other Details</span><textarea className="field min-h-28 w-full py-3" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Additional item information" /></label>
              <label className="sm:col-span-2"><span className="label">Note</span><textarea className="field min-h-24 w-full py-3" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Internal note, supplier note, receiving note, etc." /></label>
            </div>
            <button disabled={saving} className="mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : form.id ? "Update Item" : "Add Item"}</button>
          </form>

          <section className="order-2 min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 lg:p-5">
            <div className="flex flex-col gap-3"><div><h2 className="text-xl font-black sm:text-2xl">All Items</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Search by code, name, type, specification or note.</p></div><input className="field w-full" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Search items..." /></div>
            <div className="mt-5 space-y-3">
              {loading && !items.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading items...</p> : null}
              {visibleItems.map((item) => <article key={item.id} className="rounded-2xl border border-[var(--school-border)] p-3.5"><div className="flex flex-col gap-3"><div className="min-w-0"><p className="text-xs font-bold theme-primary">{item.item_code}</p><h3 className="mt-1 break-words font-bold">{item.item_name}</h3><p className="mt-1 break-words text-xs text-[var(--school-muted)]">{item.item_type || ""}{item.specification ? ` • ${item.specification}` : ""}</p></div>{item.note ? <div className="rounded-xl bg-[var(--school-background)] px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] theme-primary">Note</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--school-muted)]">{item.note}</p></div> : null}<div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.current_stock > 0 ? "bg-[var(--school-primary-soft)] theme-primary" : "bg-gray-100 text-gray-500"}`}>{item.current_stock} {item.unit}</span><button onClick={() => editItem(item)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => void deactivateItem(item)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button></div></div></article>)}
              {!loading && !visibleItems.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No active items found.</p> : null}
            </div>
          </section>
        </div>
      ) : (
        <section className="min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 md:p-7">
          <div className="flex flex-col gap-3"><div><h2 className="text-xl font-black sm:text-2xl">User Service Requests</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)] sm:text-sm">Search by SR number, requester ID or requester name. Click an SR to view the complete item details.</p></div><div className="flex w-full flex-col gap-2 sm:flex-row"><input className="field min-w-0 flex-1" value={srSearch} onChange={(e) => setSrSearch(e.target.value)} placeholder="SR-2026-000001" /><button onClick={() => void loadSrs()} className="w-full rounded-xl px-4 py-3 text-sm font-bold theme-primary-bg sm:w-auto">Search</button></div></div>
          <div className="mt-5 space-y-4">
            {srs.map((sr) => (
              <article key={sr.id} role="button" tabIndex={0} onClick={() => setSelectedSr(sr)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedSr(sr); }} className="cursor-pointer rounded-2xl border border-[var(--school-border)] p-4 transition-colors hover:border-[var(--school-primary-border)] hover:bg-[var(--school-primary-soft)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--school-primary-border)] md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-bold theme-primary">{sr.sr_number}</p><h3 className="mt-1 break-words text-lg font-black">{sr.requester_name}</h3><p className="break-words text-xs text-[var(--school-muted)]">ID: {sr.requester_login_id}{sr.department ? ` • ${sr.department}` : ""}{sr.class_name ? ` • Class ${sr.class_name}` : ""}</p></div><span className="w-fit shrink-0 rounded-full border border-[var(--school-border)] px-3 py-1 text-xs font-bold capitalize">{sr.status.replace(/_/g, " ")}</span></div>
                {sr.request_details ? <p className="mt-4 rounded-xl bg-[var(--school-background)] p-3 text-sm text-[var(--school-muted)]">{sr.request_details}</p> : null}
                <div className="mt-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                  {sr.items.map((item) => <div key={item.item_id} className="rounded-xl border border-[var(--school-border)] p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-bold">{item.item_name}</p><p className="text-xs theme-primary">{item.item_code}</p></div><span className="w-fit rounded-full bg-[var(--school-background)] px-3 py-1 text-xs font-semibold">Available: {item.current_stock} {item.unit}</span></div>{item.item_note ? <p className="mt-3 rounded-lg bg-[var(--school-background)] p-2 text-xs text-[var(--school-muted)]">Item note: {item.item_note}</p> : null}<div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-[var(--school-background)] p-2"><b className="block text-sm">{item.requested_quantity}</b>Requested</div><div className="rounded-lg bg-[var(--school-background)] p-2"><b className="block text-sm">{item.issued_quantity}</b>Issued</div><div className="rounded-lg bg-[var(--school-background)] p-2"><b className="block text-sm">{item.remaining_quantity}</b>Remaining</div></div><label className="mt-3 block"><span className="label">Issue Now ({item.unit})</span><input onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} disabled={sr.status === "rejected" || sr.status === "issued" || item.remaining_quantity <= 0} className="field w-full" type="number" min="0" max={Math.min(item.remaining_quantity, item.current_stock)} value={issueQuantities[item.item_id] || ""} onChange={(e) => setIssueQuantities({ ...issueQuantities, [item.item_id]: e.target.value })} placeholder="0" /></label></div>)}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap" onClick={(event) => event.stopPropagation()}>{sr.status === "pending" ? <><button disabled={saving} onClick={() => void processSr(sr, "approve")} className="w-full rounded-xl px-4 py-3 text-xs font-bold theme-primary-bg sm:w-auto">Approve</button><button disabled={saving} onClick={() => void processSr(sr, "reject")} className="w-full rounded-xl border border-red-200 px-4 py-3 text-xs font-bold text-red-600 sm:w-auto">Reject</button></> : null}{sr.status === "approved" || sr.status === "partially_issued" ? <button disabled={saving} onClick={() => void processSr(sr, "issue")} className="w-full rounded-xl px-4 py-3 text-xs font-bold theme-primary-bg sm:w-auto">Issue Selected Qty</button> : null}<button type="button" onClick={() => setSelectedSr(sr)} className="w-full rounded-xl border border-[var(--school-primary-border)] px-4 py-3 text-xs font-bold theme-primary sm:w-auto">View Full SR + Print A4</button></div>
              </article>
            ))}
            {!loading && !srs.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-10 text-center text-sm text-[var(--school-muted)]">No User SR found.</p> : null}
          </div>
        </section>
      )}
      <SrDetailModal sr={selectedSr} open={Boolean(selectedSr)} onClose={() => setSelectedSr(null)} />
    </AdminPageShell>
  );
}
