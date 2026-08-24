"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; model: string | null; unit: string; current_stock: number; stock_status: string };
type SelectedItem = Item & { quantity: number; note: string };

type SubmittedSr = { srNumber: string; status: string; className: string; department: string; details: string; itemCount: number; totalQty: number };

const statusClass = (status: string) => status.toLowerCase().includes("out") ? "text-red-600 bg-red-50" : status.toLowerCase().includes("low") ? "text-amber-700 bg-amber-50" : "theme-primary bg-[var(--school-primary-soft)]";

export default function ItemSrModule({ department }: { department: string | null }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [className, setClassName] = useState("");
  const [details, setDetails] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastSr, setLastSr] = useState<SubmittedSr | null>(null);

  async function searchItem() {
    setError("");
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
    setError("");
    setMessage("");
    if (!selected.length) { setRequestOpen(false); setError("Select at least one item for the SR."); return; }
    if (!className.trim()) { setError("Class / Section is required."); return; }
    if (!details.trim()) { setError("Request Details is required."); return; }
    const invalid = selected.find((item) => item.quantity > Number(item.current_stock));
    if (invalid) { setError(`${invalid.item_code} has only ${invalid.current_stock} ${invalid.unit} available.`); return; }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setError("Your session has expired. Please login again."); return; }
    setSubmitting(true);
    const snapshot = [...selected];
    const submittedClass = className.trim();
    const submittedDetails = details.trim();
    const submittedDepartment = department || "";
    const { data, error: submitError } = await supabase.rpc("store_submit_sr", {
      p_token: token,
      p_class_name: submittedClass,
      p_department: submittedDepartment,
      p_request_details: submittedDetails,
      p_items: snapshot.map((item) => ({ item_id: item.id, quantity: item.quantity, note: item.note.trim() })),
    });
    setSubmitting(false);
    if (submitError) { setError(submitError.message); return; }

    const srNumber = data?.sr_number ?? "";
    const totalQty = snapshot.reduce((sum, item) => sum + Number(item.quantity), 0);
    setLastSr({ srNumber, status: "Pending Approval", className: submittedClass, department: submittedDepartment, details: submittedDetails, itemCount: snapshot.length, totalQty });
    setMessage(`SR ${srNumber} submitted successfully. Status: Pending Approval.`);
    setSelected([]);
    setItems([]);
    setQuery("");
    setClassName("");
    setDetails("");
    setRequestOpen(false);
  }

  const latest = selected[selected.length - 1];
  const totalQty = selected.reduce((sum, item) => sum + Number(item.quantity), 0);

  return <div className="mt-3 space-y-3">
    <section className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="item-sr-search">Search Item</label>
          <div className="flex h-9 overflow-hidden rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)]">
            <span className="flex items-center border-r border-[var(--school-border)] bg-[var(--school-primary-soft)] px-2.5 text-[10px] font-black theme-primary">ITM-</span>
            <input id="item-sr-search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void searchItem(); }} placeholder="Search by item code or name..." className="min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold outline-none" />
            <button type="button" onClick={() => void searchItem()} disabled={searching} className="px-3 text-[10px] font-black theme-primary-bg disabled:opacity-60">{searching ? "..." : "Search"}</button>
          </div>
        </div>
        <button type="button" onClick={() => setRequestOpen(true)} className="shrink-0 rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-2 text-[10px] font-black theme-primary">Request Info</button>
      </div>
      <p className="mt-1 text-[9px] text-[var(--school-muted)]">Use numeric code, ITM-code, item name, type or specification.</p>

      {items.length ? <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-0.5">{items.map((item) => <button key={item.id} type="button" onClick={() => addItem(item)} className="w-full rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] p-2 text-left hover:border-[var(--school-primary-border)]"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-1.5"><span className="text-[9px] font-black theme-primary">{item.item_code}</span><span className="truncate text-[10px] font-bold">{item.item_name}</span></div><p className="truncate text-[9px] text-[var(--school-muted)]">{item.specification || item.item_type || "Item"}</p></div><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${statusClass(item.stock_status)}`}>{item.stock_status} · {item.current_stock} {item.unit}</span></div></button>)}</div> : null}
    </section>

    {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">{error}</p> : null}

    {selected.length ? <section className="rounded-xl border border-[var(--school-border)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Selected Items</p><p className="mt-0.5 text-[9px] text-[var(--school-muted)]">Set quantity and optional note.</p></div><div className="flex items-center gap-1.5"><span className="rounded-full bg-[var(--school-primary-soft)] px-2 py-1 text-[8px] font-black theme-primary">{selected.length} items · Qty {totalQty}</span><button type="button" onClick={clearSelected} className="rounded-md border border-[var(--school-border)] px-2 py-1 text-[8px] font-bold">Clear</button></div></div>
      {latest ? <div className="mt-2 rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-2"><div className="flex flex-wrap items-center justify-between gap-1.5"><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-wider theme-primary">Latest Selected</p><p className="truncate text-[10px] font-black">{latest.item_code} · {latest.item_name}</p></div><div className="flex items-center gap-1"><span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${statusClass(latest.stock_status)}`}>{latest.stock_status}</span><span className="rounded-full bg-[var(--school-surface)] px-1.5 py-0.5 text-[8px] font-bold">Present {latest.current_stock} {latest.unit}</span><span className="rounded-full bg-[var(--school-surface)] px-1.5 py-0.5 text-[8px] font-bold">Request {latest.quantity}</span></div></div></div> : null}
      <div className="mt-2 space-y-1">{selected.map((item) => <div key={item.id} className="grid gap-1.5 rounded-lg border border-[var(--school-border)] p-2 sm:grid-cols-[minmax(0,1fr)_78px_minmax(110px,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="text-[9px] font-black theme-primary">{item.item_code}</p><p className="truncate text-[10px] font-bold">{item.item_name}</p><p className="text-[8px] text-[var(--school-muted)]">Present: {item.current_stock} {item.unit}</p></div><input type="number" min="1" max={Number(item.current_stock)} value={item.quantity} onChange={(e) => updateSelected(item.id, "quantity", e.target.value)} className="field h-7 w-full text-[10px]" aria-label={`Quantity for ${item.item_name}`} /><input value={item.note} onChange={(e) => updateSelected(item.id, "note", e.target.value)} placeholder="Optional note" className="field h-7 w-full text-[10px]" aria-label={`Note for ${item.item_name}`} /><button type="button" onClick={() => removeItem(item.id)} className="rounded-md border border-red-200 px-2 py-1 text-[8px] font-bold text-red-600">Remove</button></div>)}</div>
      <div className="mt-2 flex justify-end"><button type="button" onClick={() => setRequestOpen(true)} className="rounded-lg px-4 py-2 text-[9px] font-black theme-primary-bg">Continue to Request →</button></div>
    </section> : null}

    {lastSr ? <section className="rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-3">
      <div className="flex items-center justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] theme-primary">Last Service Request</p><p className="mt-0.5 text-sm font-black">{lastSr.srNumber}</p></div><span className="rounded-full bg-[var(--school-surface)] px-2 py-1 text-[9px] font-black theme-primary">{lastSr.status}</span></div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] sm:grid-cols-4"><div className="rounded-md bg-[var(--school-surface)] px-2 py-1.5"><span className="text-[var(--school-muted)]">Class</span><p className="font-bold">{lastSr.className}</p></div><div className="rounded-md bg-[var(--school-surface)] px-2 py-1.5"><span className="text-[var(--school-muted)]">Department</span><p className="font-bold">{lastSr.department || "-"}</p></div><div className="rounded-md bg-[var(--school-surface)] px-2 py-1.5"><span className="text-[var(--school-muted)]">Items</span><p className="font-bold">{lastSr.itemCount} · Qty {lastSr.totalQty}</p></div><div className="rounded-md bg-[var(--school-surface)] px-2 py-1.5"><span className="text-[var(--school-muted)]">Details</span><p className="truncate font-bold" title={lastSr.details}>{lastSr.details}</p></div></div>
    </section> : null}

    {message ? <p className="rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-2 text-[10px] font-bold theme-primary">{message}</p> : null}

    {requestOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3" role="dialog" aria-modal="true" aria-labelledby="item-sr-request-title">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] theme-primary">Service Request</p><h3 id="item-sr-request-title" className="mt-0.5 text-base font-black">Request Information</h3></div><button type="button" onClick={() => setRequestOpen(false)} className="rounded-lg border border-[var(--school-border)] px-2.5 py-1 text-xs font-bold">×</button></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><label><span className="mb-1 block text-[9px] font-bold">Class / Section *</span><input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 6-A" className="field h-9 w-full text-xs" /></label><label><span className="mb-1 block text-[9px] font-bold">Department</span><input value={department || ""} readOnly className="field h-9 w-full bg-[var(--school-primary-soft)] text-xs" /></label></div>
        <label className="mt-2 block"><span className="mb-1 block text-[9px] font-bold">Request Details *</span><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="What is the item needed for?" className="field w-full resize-none text-xs" /></label>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[var(--school-primary-soft)] px-3 py-2"><span className="text-[9px] font-bold theme-primary">{selected.length} item(s) · Total Qty {totalQty}</span><button type="button" onClick={() => void submitRequest()} disabled={submitting || !selected.length} className="rounded-lg px-4 py-2 text-[9px] font-black theme-primary-bg disabled:opacity-50">{submitting ? "Submitting..." : "Submit for Approval →"}</button></div>
      </div>
    </div> : null}
  </div>;
}
