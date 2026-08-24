"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; model: string | null; unit: string; current_stock: number; stock_status: string };
type SelectedItem = Item & { quantity: number; note: string };

const statusClass = (status: string) => status.toLowerCase().includes("out") ? "text-red-600 bg-red-50" : status.toLowerCase().includes("low") ? "text-amber-700 bg-amber-50" : "theme-primary bg-[var(--school-primary-soft)]";

export default function ItemSrModule({ department }: { department: string | null }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
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
    const raw = query.trim();
    if (!raw) { setError("Enter an item code or item name."); return; }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setError("Your session has expired. Please login again."); return; }
    const isCode = /^ITM-?\d+$/i.test(raw) || /^\d+$/.test(raw);
    const clean = raw.replace(/^ITM-/i, "");
    const search = isCode ? `ITM-${clean}` : raw;
    setSearching(true);
    const { data, error: searchError } = await supabase.rpc("store_list_items", { p_token: token, p_search: search });
    setSearching(false);
    if (searchError) { setError(searchError.message); return; }
    setItems((data ?? []) as Item[]);
    if (!(data ?? []).length) setError(`No active item found for “${raw}”.`);
  }

  function addItem(item: Item) {
    if (Number(item.current_stock) <= 0) { setError(`${item.item_code} is currently out of stock.`); return; }
    if (selected.some((x) => x.id === item.id)) return;
    setSelected((current) => [...current, { ...item, quantity: 1, note: "" }]);
    setItems((current) => current.filter((x) => x.id !== item.id));
    setError("");
  }

  function removeItem(id: string) { setSelected((current) => current.filter((x) => x.id !== id)); }
  function clearSelected() { setSelected([]); }
  function updateSelected(id: string, field: "quantity" | "note", value: string) {
    setSelected((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "quantity" ? Math.max(1, Math.min(Number(item.current_stock), Number(value) || 1)) : value } : item));
  }

  async function submitRequest() {
    setError(""); setMessage("");
    if (!selected.length) { setError("Select at least one item for the SR."); return; }
    if (!className.trim()) { setError("Class / Section is required."); return; }
    if (!details.trim()) { setError("Request Details is required."); return; }
    const invalid = selected.find((item) => item.quantity > Number(item.current_stock));
    if (invalid) { setError(`${invalid.item_code} has only ${invalid.current_stock} ${invalid.unit} available.`); return; }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setError("Your session has expired. Please login again."); return; }
    setSubmitting(true);
    const { data, error: submitError } = await supabase.rpc("store_submit_sr", {
      p_token: token,
      p_class_name: className.trim(),
      p_department: department || "",
      p_request_details: details.trim(),
      p_items: selected.map((item) => ({ item_id: item.id, quantity: item.quantity, note: item.note.trim() })),
    });
    setSubmitting(false);
    if (submitError) { setError(submitError.message); return; }
    setMessage(`SR ${data?.sr_number ?? ""} submitted successfully. Status: Pending Approval.`);
    setSelected([]); setItems([]); setQuery(""); setClassName(""); setDetails("");
  }

  const latest = selected[selected.length - 1];
  const totalQty = selected.reduce((sum, item) => sum + Number(item.quantity), 0);

  return <div className="mt-4 space-y-4">
    <div className="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-3.5">
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1"><span className="mb-1.5 block text-[11px] font-bold">Search Item</span><div className="flex h-10 overflow-hidden rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)]"><span className="flex items-center border-r border-[var(--school-border)] bg-[var(--school-primary-soft)] px-2.5 text-[11px] font-black theme-primary">ITM-</span><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void searchItem(); }} placeholder="000001 or item name" className="min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold outline-none" /></div></label>
          <button type="button" onClick={() => void searchItem()} disabled={searching} className="h-10 rounded-lg px-4 text-[11px] font-black theme-primary-bg disabled:opacity-60">{searching ? "Searching..." : "Search"}</button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--school-muted)]">Numeric input becomes <b>ITM-</b> automatically. You can also search by name, type or specification.</p>
        {items.length ? <div className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto">{items.map((item) => <button key={item.id} type="button" onClick={() => addItem(item)} className="w-full rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] p-2.5 text-left hover:border-[var(--school-primary-border)]"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[10px] font-black theme-primary">{item.item_code}</span><span className="truncate text-[11px] font-bold">{item.item_name}</span></div><p className="mt-0.5 truncate text-[10px] text-[var(--school-muted)]">{item.specification || item.item_type || "Item"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(item.stock_status)}`}>{item.stock_status} · {item.current_stock} {item.unit}</span></div></button>)}</div> : null}
      </section>

      <section className="rounded-2xl border border-[var(--school-border)] p-3.5">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Request Information</p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2"><label><span className="mb-1 block text-[10px] font-bold">Class / Section *</span><input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 6-A" className="field h-9 w-full text-xs" /></label><label><span className="mb-1 block text-[10px] font-bold">Department</span><input value={department || ""} readOnly className="field h-9 w-full bg-[var(--school-primary-soft)] text-xs" /></label></div>
        <label className="mt-2 block"><span className="mb-1 block text-[10px] font-bold">Request Details *</span><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} placeholder="What is the item needed for?" className="field w-full resize-none text-xs" /></label>
      </section>
    </div>

    <section className="rounded-2xl border border-[var(--school-border)] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Selected Items</p><p className="mt-0.5 text-[10px] text-[var(--school-muted)]">Set quantity and optional note for each item.</p></div><div className="flex items-center gap-1.5"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">{selected.length} items · Qty {totalQty}</span>{selected.length ? <button type="button" onClick={clearSelected} className="rounded-lg border border-[var(--school-border)] px-2 py-1 text-[9px] font-bold">Clear</button> : null}</div></div>
      {latest ? <div className="mt-2.5 rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-2.5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-wider theme-primary">Latest Selected Item</p><p className="mt-0.5 text-xs font-black">{latest.item_code} · {latest.item_name}</p></div><div className="flex items-center gap-1.5"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(latest.stock_status)}`}>{latest.stock_status}</span><span className="rounded-full bg-[var(--school-surface)] px-2 py-1 text-[9px] font-bold">Present: {latest.current_stock} {latest.unit}</span><span className="rounded-full bg-[var(--school-surface)] px-2 py-1 text-[9px] font-bold">Request: {latest.quantity}</span></div></div></div> : null}
      {selected.length ? <div className="mt-2 space-y-1.5">{selected.map((item) => <div key={item.id} className="grid gap-2 rounded-lg border border-[var(--school-border)] p-2.5 sm:grid-cols-[minmax(0,1fr)_90px_minmax(120px,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="text-[10px] font-black theme-primary">{item.item_code}</p><p className="truncate text-[11px] font-bold">{item.item_name}</p><p className="text-[9px] text-[var(--school-muted)]">Present: {item.current_stock} {item.unit} · {item.stock_status}</p></div><label><span className="sr-only">Quantity</span><input type="number" min="1" max={Number(item.current_stock)} value={item.quantity} onChange={(e) => updateSelected(item.id, "quantity", e.target.value)} className="field h-8 w-full text-xs" aria-label={`Quantity for ${item.item_name}`} /></label><label><span className="sr-only">Item Note</span><input value={item.note} onChange={(e) => updateSelected(item.id, "note", e.target.value)} placeholder="Optional note" className="field h-8 w-full text-xs" /></label><button type="button" onClick={() => removeItem(item.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[9px] font-bold text-red-600">Remove</button></div>)}</div> : <div className="mt-2.5 rounded-lg border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 text-center text-xs text-[var(--school-muted)]">Search an item above and click it to add.</div>}
      {error ? <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">{error}</p> : null}
      {message ? <p className="mt-2 rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-2 text-[10px] font-bold theme-primary">{message}</p> : null}
      <div className="mt-2.5 flex justify-end"><button type="button" onClick={() => void submitRequest()} disabled={submitting || !selected.length} className="rounded-lg px-4 py-2 text-[10px] font-black theme-primary-bg disabled:opacity-50">{submitting ? "Submitting..." : "Submit SR for Approval →"}</button></div>
    </section>
  </div>;
}
