"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type InventoryPermissions = { view?: boolean; add?: boolean; edit?: boolean; remove?: boolean; sr_approval?: boolean };
type Item = { id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; brand: string | null; model: string | null; unit: string; details: string | null; note: string | null; current_stock: number; reorder_level: number };
type SrItem = { item_id: string; item_code: string; item_name: string; unit: string; current_stock: number; requested_quantity: number; issued_quantity: number; remaining_quantity: number; item_note: string | null };
type Sr = { id: string; sr_number: string; requester_name: string; requester_login_id: string; class_name: string | null; department: string | null; request_details: string | null; status: string; requested_at: string; items: SrItem[] };
type ItemForm = { id: string | null; item_name: string; item_type: string; specification: string; brand: string; model: string; unit: string; details: string; note: string; current_stock: string; reorder_level: string };

const units = ["pcs", "set", "box", "roll", "meter", "kg", "liter", "pair", "other"];
const emptyForm: ItemForm = { id: null, item_name: "", item_type: "", specification: "", brand: "", model: "", unit: "pcs", details: "", note: "", current_stock: "0", reorder_level: "0" };

export default function InventoryModule({ permissions }: { permissions: InventoryPermissions }) {
  const supabase = useMemo(() => createClient(), []);
  const canView = Boolean(permissions.view);
  const canAdd = Boolean(permissions.add);
  const canEdit = Boolean(permissions.edit);
  const canRemove = Boolean(permissions.remove);
  const canApprove = Boolean(permissions.sr_approval);
  const canManageItems = canAdd || canEdit || canRemove;
  const [items, setItems] = useState<Item[]>([]);
  const [srs, setSrs] = useState<Sr[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [srSearch, setSrSearch] = useState("");
  const [issueQuantities, setIssueQuantities] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadItems(search = itemSearch) {
    if (!canView) return;
    setLoading(true);
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    const { data, error } = await supabase.rpc("store_member_list_inventory", { p_token: token, p_search: search || null });
    if (error) setMessage(error.message); else setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  async function loadSrs(search = srSearch) {
    if (!canApprove) return;
    setLoading(true);
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    const { data, error } = await supabase.rpc("store_admin_list_srs", { p_search: search || null, p_token: token });
    if (error) setMessage(error.message); else setSrs((data ?? []).map((row: Sr) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
    setLoading(false);
  }

  useEffect(() => { void loadItems(""); void loadSrs(""); }, [canView, canApprove]);

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    if ((form.id && !canEdit) || (!form.id && !canAdd)) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setSaving(true); setMessage("");
    const { data, error } = await supabase.rpc("store_member_save_item", { p_token: token, p_id: form.id, p_item_name: form.item_name, p_item_type: form.item_type, p_specification: form.specification, p_brand: form.brand, p_model: form.model, p_unit: form.unit, p_details: form.details, p_note: form.note, p_current_stock: Number(form.current_stock) || 0, p_reorder_level: Number(form.reorder_level) || 0 });
    if (error) setMessage(error.message); else { setMessage(form.id ? "Item updated successfully." : `Item added: ${(data as Item).item_code}`); setForm(emptyForm); await loadItems(); }
    setSaving(false);
  }

  async function removeItem(item: Item) {
    if (!canRemove) return;
    if (!window.confirm(`Remove ${item.item_name} (${item.item_code}) from active inventory?`)) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("store_member_deactivate_item", { p_token: token, p_id: item.id });
    if (error) setMessage(error.message); else { setMessage("Item removed from active inventory."); await loadItems(); }
    setSaving(false);
  }

  async function processSr(sr: Sr, action: "approve" | "reject" | "issue") {
    if (!canApprove) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    if (action === "reject" && !window.confirm(`Reject ${sr.sr_number}?`)) return;
    const issueItems = sr.items.map((item) => ({ item_id: item.item_id, quantity: Number(issueQuantities[item.item_id] || 0) })).filter((item) => item.quantity > 0);
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("store_admin_process_sr", { p_request_id: sr.id, p_action: action, p_issue_items: issueItems, p_admin_note: "", p_token: token });
    if (error) setMessage(error.message); else { setMessage(`${sr.sr_number} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "issued"}.`); setIssueQuantities({}); await Promise.all([loadSrs(), loadItems()]); }
    setSaving(false);
  }

  function editItem(item: Item) {
    if (!canEdit) return;
    setForm({ id: item.id, item_name: item.item_name, item_type: item.item_type || "", specification: item.specification || "", brand: item.brand || "", model: item.model || "", unit: item.unit, details: item.details || "", note: item.note || "", current_stock: String(item.current_stock), reorder_level: String(item.reorder_level) });
  }

  return <div className="space-y-4">
    {message ? <p className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] px-4 py-2.5 text-xs font-semibold theme-primary">{message}</p> : null}

    {(canView || canManageItems) ? <section className="rounded-2xl border border-[var(--school-border)] p-3.5 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Inventory</p><h3 className="mt-0.5 text-base font-black">Items & Stock</h3><p className="mt-0.5 text-xs text-[var(--school-muted)]">Only the item permissions granted to your role are available.</p></div>{canView ? <div className="flex w-full gap-2 lg:w-auto"><input className="field min-w-0 flex-1 lg:w-72" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadItems(); }} placeholder="ITM-000001 or item name" /><button type="button" onClick={() => void loadItems()} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Search</button></div> : null}</div>
      {canManageItems ? <details className="mt-3 rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)]"><summary className="cursor-pointer px-3 py-2.5 text-xs font-black">{form.id ? "Edit Item" : "Add New Item"}</summary><form onSubmit={saveItem} className="grid gap-2 border-t border-[var(--school-border)] p-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="sm:col-span-2 lg:col-span-3"><span className="label">Item Name *</span><input className="field w-full" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required /></label>
        <label><span className="label">Type</span><input className="field w-full" value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} /></label>
        <label><span className="label">Unit</span><select className="field w-full" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        <label><span className="label">Specification</span><input className="field w-full" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} /></label>
        <label><span className="label">Brand</span><input className="field w-full" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
        <label><span className="label">Model</span><input className="field w-full" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label>
        <label><span className="label">Present Stock</span><input className="field w-full" type="number" min="0" step="0.01" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} /></label>
        <label><span className="label">Low Stock Alert</span><input className="field w-full" type="number" min="0" step="0.01" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></label>
        <label className="sm:col-span-2 lg:col-span-3"><span className="label">Details / Note</span><textarea className="field min-h-20 w-full py-2" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">{saving ? "Saving..." : form.id ? "Update Item" : "Add Item"}</button>{form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-bold">Cancel</button> : null}</div>
      </form></details> : null}
      {canView ? <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-bold theme-primary">{item.item_code}</p><p className="truncate text-xs font-bold">{item.item_name}</p><p className="truncate text-[10px] text-[var(--school-muted)]">{item.item_type || ""}{item.specification ? ` • ${item.specification}` : ""}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${item.current_stock <= item.reorder_level ? "bg-red-50 text-red-700" : "bg-[var(--school-primary-soft)] theme-primary"}`}>{item.current_stock} {item.unit}</span></div><div className="mt-2 flex gap-1.5">{canEdit ? <button type="button" onClick={() => editItem(item)} className="rounded-lg border border-[var(--school-border)] px-2.5 py-1.5 text-[10px] font-bold">Edit</button> : null}{canRemove ? <button type="button" onClick={() => void removeItem(item)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600">Remove</button> : null}</div></article>)}</div> : null}
      {!loading && canView && !items.length ? <p className="mt-3 rounded-xl border border-dashed border-[var(--school-border)] p-4 text-center text-xs text-[var(--school-muted)]">No items found.</p> : null}
    </section> : null}

    {canApprove ? <section className="rounded-2xl border border-[var(--school-border)] p-3.5 sm:p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">SR Approval</p><p className="mt-0.5 text-xs text-[var(--school-muted)]">Review, approve, reject and issue service requests.</p></div><div className="flex w-full gap-2 lg:w-auto"><input className="field min-w-0 flex-1 lg:w-64" value={srSearch} onChange={(e) => setSrSearch(e.target.value)} placeholder="SR / member ID / name" /><button type="button" onClick={() => void loadSrs()} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">Search</button></div></div>
      <div className="mt-3 space-y-2.5">{srs.map((sr) => <article key={sr.id} className="rounded-xl border border-[var(--school-border)] px-3 py-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black theme-primary">{sr.sr_number}</p><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[10px] font-bold capitalize theme-primary">{sr.status.replace("_", " ")}</span></div><p className="mt-1 truncate text-xs font-bold">{sr.requester_name} <span className="font-normal text-[var(--school-muted)]">• {sr.requester_login_id}</span></p><p className="text-[10px] text-[var(--school-muted)]">{sr.class_name ? `Class ${sr.class_name}` : ""}{sr.department ? ` • ${sr.department}` : ""} • {new Date(sr.requested_at).toLocaleString()}</p></div><div className="flex shrink-0 gap-2">{sr.status === "pending" ? <><button type="button" disabled={saving} onClick={() => void processSr(sr, "approve")} className="rounded-lg px-3 py-2 text-[10px] font-bold theme-primary-bg">Approve</button><button type="button" disabled={saving} onClick={() => void processSr(sr, "reject")} className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600">Reject</button></> : null}{sr.status === "approved" || sr.status === "partially_issued" ? <button type="button" disabled={saving} onClick={() => void processSr(sr, "issue")} className="rounded-lg px-3 py-2 text-[10px] font-bold theme-primary-bg">Issue</button> : null}</div></div><div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{sr.items.map((item) => <div key={item.item_id} className="rounded-lg bg-[var(--school-background)] px-2.5 py-2"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-bold">{item.item_code} • {item.item_name}</p><span className="shrink-0 text-[10px] font-semibold">Req {item.remaining_quantity}</span></div>{sr.status === "approved" || sr.status === "partially_issued" ? <input className="field mt-1 w-full py-1.5 text-[10px]" type="number" min="0" max={item.remaining_quantity} step="0.01" value={issueQuantities[item.item_id] || ""} onChange={(e) => setIssueQuantities({ ...issueQuantities, [item.item_id]: e.target.value })} placeholder={`Issue qty • Stock ${item.current_stock}`} /> : null}</div>)}</div>{sr.request_details ? <p className="mt-2 rounded-lg bg-[var(--school-background)] px-2.5 py-2 text-[10px] leading-4 text-[var(--school-muted)]">{sr.request_details}</p> : null}</article>)}{!loading && !srs.length ? <p className="rounded-xl border border-dashed border-[var(--school-border)] p-5 text-center text-xs text-[var(--school-muted)]">No service requests found.</p> : null}</div>
    </section> : null}
  </div>;
}
