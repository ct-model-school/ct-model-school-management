"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Item = { id: string; item_code: string; item_name: string; item_type: string | null; specification: string | null; brand: string | null; model: string | null; unit: string; details: string | null; note: string | null; current_stock: number; reorder_level: number; is_active: boolean };

export default function InventoryStockMovementPage({ direction }: { direction: "IN" | "OUT" }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase.from("inventory_items").select("id,item_code,item_name,item_type,specification,brand,model,unit,details,note,current_stock,reorder_level,is_active").eq("is_active", true).order("item_name");
    if (error) setMessage(error.message); else setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  useEffect(() => { void loadItems(); }, []);

  const selected = items.find((item) => item.id === itemId) || null;
  const filtered = items.filter((item) => `${item.item_code} ${item.item_name} ${item.item_type || ""} ${item.specification || ""} ${item.brand || ""} ${item.model || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const amount = Number(quantity) || 0;
  const previewStock = selected ? Number(selected.current_stock) + (direction === "IN" ? amount : -amount) : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || amount <= 0) return;
    if (direction === "OUT" && amount > Number(selected.current_stock)) {
      setMessage(`Stock Out cannot exceed current stock (${selected.current_stock} ${selected.unit}).`);
      return;
    }
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.rpc("store_admin_record_stock_movement", { p_item_id: selected.id, p_movement_type: direction, p_quantity: amount, p_note: note.trim() || null });
    if (error) {
      setMessage(error.message);
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setMessage(`${selected.item_code}: Stock ${direction === "IN" ? "In" : "Out"} recorded successfully. New stock: ${row?.current_stock ?? previewStock} ${selected.unit}.`);
      setQuantity("");
      setNote("");
      await loadItems();
    }
    setSaving(false);
  }

  return <AdminPageShell eyebrow="Inventory & Procurement" title={direction === "IN" ? "Stock In" : "Stock Out"} description={direction === "IN" ? "Receive stock into the existing inventory records and keep movement history synchronized." : "Issue stock from the existing inventory records without allowing the balance to go below zero."}>
    {message ? <div className="mb-5 rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</div> : null}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <form onSubmit={submit} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
        <div><p className="text-[9px] font-black uppercase tracking-[0.16em] theme-primary">Live Inventory</p><h2 className="mt-1 text-2xl font-black">Record Stock {direction === "IN" ? "In" : "Out"}</h2><p className="mt-2 text-sm text-[var(--school-muted)]">This changes the existing item balance and records the movement atomically. No demo inventory is used.</p></div>
        <div className="mt-6 space-y-4">
          <label className="block"><span className="label">Search Item</span><input className="field w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code, name, brand, model..." /></label>
          <label className="block"><span className="label">Item *</span><select className="field w-full" value={itemId} onChange={(event) => setItemId(event.target.value)} required><option value="">Select an active item</option>{filtered.map((item) => <option key={item.id} value={item.id}>{item.item_code} · {item.item_name} · Stock {item.current_stock} {item.unit}</option>)}</select></label>
          {selected ? <div className="rounded-2xl bg-[var(--school-background)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black theme-primary">{selected.item_code}</p><p className="mt-1 font-black">{selected.item_name}</p></div><span className="rounded-full border border-[var(--school-border)] px-3 py-1 text-xs font-bold">Current: {selected.current_stock} {selected.unit}</span></div>{selected.specification ? <p className="mt-2 text-xs text-[var(--school-muted)]">{selected.specification}</p> : null}</div> : null}
          <label className="block"><span className="label">Quantity *</span><input className="field w-full" type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label className="block"><span className="label">Note</span><textarea className="field min-h-24 w-full py-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reference, receiving note, issue reason..." /></label>
        </div>
        <button disabled={saving || loading || !selected} className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : `Record Stock ${direction === "IN" ? "In" : "Out"}`}</button>
      </form>
      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7"><p className="text-[9px] font-black uppercase tracking-[0.16em] theme-primary">Selected Balance</p><h2 className="mt-1 text-xl font-black">Current Item State</h2>{selected ? <div className="mt-5 space-y-3"><div className="rounded-2xl border border-[var(--school-border)] p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--school-muted)]">Current Stock</p><p className="mt-1 text-3xl font-black">{selected.current_stock} <span className="text-sm font-bold">{selected.unit}</span></p></div><div className="rounded-2xl border border-[var(--school-border)] p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--school-muted)]">After Transaction</p><p className="mt-1 text-3xl font-black">{Math.max(0, previewStock)} <span className="text-sm font-bold">{selected.unit}</span></p></div>{selected.reorder_level > 0 ? <p className="rounded-xl bg-[var(--school-background)] p-3 text-xs text-[var(--school-muted)]">Reorder alert level: <strong>{selected.reorder_level} {selected.unit}</strong></p> : null}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Select an item to see its live balance.</div>}</section>
    </div>
  </AdminPageShell>;
}
