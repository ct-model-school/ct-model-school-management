"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; brand: string | null; model: string | null; unit: string; current_stock: number; stock_status: string };
type SelectedItem = Item & { quantity: number; note: string };

export default function ItemSrModule({ department }: { department: string | null }) {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [className, setClassName] = useState("");
  const [details, setDetails] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function searchItem() {
    setError(""); setMessage("");
    const clean = code.trim().replace(/^ITM-/i, "");
    if (!clean) { setError("Enter the item code after ITM-."); return; }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setError("Your session has expired. Please login again."); return; }
    setSearching(true);
    const { data, error: searchError } = await supabase.rpc("store_list_items", { p_token: token, p_search: `ITM-${clean}` });
    setSearching(false);
    if (searchError) { setError(searchError.message); return; }
    setItems((data ?? []) as Item[]);
    if (!(data ?? []).length) setError(`No active item found for ITM-${clean}.`);
  }

  function addItem(item: Item) {
    if (selected.some((x) => x.id === item.id)) return;
    setSelected((current) => [...current, { ...item, quantity: 1, note: "" }]);
    setItems((current) => current.filter((x) => x.id !== item.id));
  }

  function removeItem(id: string) { setSelected((current) => current.filter((x) => x.id !== id)); }
  function updateSelected(id: string, field: "quantity" | "note", value: string) {
    setSelected((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "quantity" ? Math.max(1, Number(value) || 1) : value } : item));
  }

  async function submitRequest() {
    setError(""); setMessage("");
    if (!selected.length) { setError("Select at least one item for the SR."); return; }
    const invalid = selected.find((item) => item.quantity > Number(item.current_stock));
    if (invalid) { setError(`${invalid.item_code} has only ${invalid.current_stock} ${invalid.unit} available.`); return; }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setError("Your session has expired. Please login again."); return; }
    setSubmitting(true);
    const { data, error: submitError } = await supabase.rpc("store_submit_sr", {
      p_token: token,
      p_class_name: className,
      p_department: department || "",
      p_request_details: details,
      p_items: selected.map((item) => ({ item_id: item.id, quantity: item.quantity, note: item.note })),
    });
    setSubmitting(false);
    if (submitError) { setError(submitError.message); return; }
    setMessage(`Service Request ${data?.sr_number ?? ""} submitted successfully.`);
    setSelected([]); setItems([]); setCode(""); setClassName(""); setDetails("");
  }

  return <div className="mt-6 space-y-6">
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5">
        <div className="flex items-end gap-3">
          <label className="min-w-0 flex-1"><span className="mb-2 block text-xs font-bold text-[var(--school-text)]">Search Item by Code</span><div className="flex h-12 overflow-hidden rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)]"><span className="flex items-center border-r border-[var(--school-border)] bg-[var(--school-primary-soft)] px-3 text-xs font-black theme-primary">ITM-</span><input value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") void searchItem(); }} inputMode="numeric" placeholder="000001" className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none" /></div></label>
          <button type="button" onClick={() => void searchItem()} disabled={searching} className="h-12 rounded-xl px-5 text-xs font-black theme-primary-bg disabled:opacity-60">{searching ? "Searching..." : "Search"}</button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--school-muted)]">Enter only the numeric code. <b>ITM-</b> is added automatically.</p>

        {items.length ? <div className="mt-4 space-y-2">{items.map((item) => <button key={item.id} type="button" onClick={() => addItem(item)} className="w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3 text-left hover:border-[var(--school-primary-border)]"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black theme-primary">{item.item_code}</p><p className="mt-1 text-sm font-bold">{item.item_name}</p><p className="mt-1 text-[11px] text-[var(--school-muted)]">{item.specification || item.item_type || "Item"}</p></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-bold theme-primary">Stock: {item.current_stock} {item.unit}</span></div></button>)}</div> : null}
      </div>

      <div className="rounded-2xl border border-[var(--school-border)] p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] theme-primary">Request Information</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label><span className="mb-2 block text-xs font-bold">Class / Section</span><input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Class 6-A" className="field w-full" /></label>
          <label><span className="mb-2 block text-xs font-bold">Department</span><input value={department || ""} readOnly className="field w-full bg-[var(--school-primary-soft)]" /></label>
        </div>
        <label className="mt-3 block"><span className="mb-2 block text-xs font-bold">Request Details</span><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="What is the item needed for?" className="field w-full resize-none" /></label>
      </div>
    </div>

    <div className="rounded-2xl border border-[var(--school-border)] p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] theme-primary">Selected Items</p><p className="mt-1 text-xs text-[var(--school-muted)]">Add items from the search result, set quantity, then submit the SR.</p></div><span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1 text-xs font-black theme-primary">{selected.length} item{selected.length === 1 ? "" : "s"}</span></div>
      {selected.length ? <div className="mt-4 space-y-3">{selected.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-[var(--school-border)] p-4 sm:grid-cols-[1fr_110px_1fr_auto] sm:items-end"><div><p className="text-[10px] font-black theme-primary">{item.item_code}</p><p className="mt-1 text-sm font-bold">{item.item_name}</p><p className="mt-1 text-[11px] text-[var(--school-muted)]">Available: {item.current_stock} {item.unit}</p></div><label><span className="mb-2 block text-[10px] font-bold">Quantity</span><input type="number" min="1" max={Number(item.current_stock)} value={item.quantity} onChange={(e) => updateSelected(item.id, "quantity", e.target.value)} className="field w-full" /></label><label><span className="mb-2 block text-[10px] font-bold">Item Note</span><input value={item.note} onChange={(e) => updateSelected(item.id, "note", e.target.value)} placeholder="Optional" className="field w-full" /></label><button type="button" onClick={() => removeItem(item.id)} className="rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600">Remove</button></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-8 text-center text-sm text-[var(--school-muted)]">No items selected yet.</div>}
      {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-xs font-bold theme-primary">{message}</p> : null}
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => void submitRequest()} disabled={submitting || !selected.length} className="rounded-xl px-5 py-3 text-xs font-black theme-primary-bg disabled:opacity-50">{submitting ? "Submitting..." : "Submit Service Request →"}</button></div>
    </div>
  </div>;
}
