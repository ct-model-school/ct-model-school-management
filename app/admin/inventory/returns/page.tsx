"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Returnable = {
  service_request_item_id: string;
  sr_id: string;
  sr_number: string;
  requester_name: string;
  requester_login_id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  unit: string;
  issued_quantity: number;
  returned_quantity: number;
  returnable_quantity: number;
  current_stock: number;
};

export default function StoreReturnsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Returnable[]>([]);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load(searchValue = search) {
    setLoading(true);
    const { data, error } = await supabase.rpc("store_admin_list_returnable_srs", { p_search: searchValue || null });
    if (error) setMessage(error.message);
    else setRows((data ?? []) as Returnable[]);
    setLoading(false);
  }

  useEffect(() => {
    void load("");
  }, []);

  async function returnItem(row: Returnable) {
    const quantity = Number(quantities[row.service_request_item_id] || 0);
    if (!quantity || quantity <= 0 || quantity > row.returnable_quantity) {
      setMessage(`Enter a valid return quantity for ${row.item_code}.`);
      return;
    }

    setSaving(row.service_request_item_id);
    setMessage("");
    const { error } = await supabase.rpc("store_admin_return_item", {
      p_service_request_item_id: row.service_request_item_id,
      p_quantity: quantity,
      p_condition: conditions[row.service_request_item_id] || "Good",
      p_note: notes[row.service_request_item_id] || null,
    });

    if (error) setMessage(error.message);
    else {
      setMessage(`${row.item_code}: ${quantity} ${row.unit} returned and added back to stock.`);
      setQuantities((current) => ({ ...current, [row.service_request_item_id]: "" }));
      setNotes((current) => ({ ...current, [row.service_request_item_id]: "" }));
      await load();
    }
    setSaving(null);
  }

  return (
    <AdminPageShell
      eyebrow="Store & Inventory"
      title="Item Return History"
      description="Return issued items against the original Service Request so every return stays attached to the same item record."
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1"><span className="label">Search SR / Item Code / Item Name / User ID</span><input className="field" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void load(); } }} placeholder="SR-2026-000001 or ITM-000001" /></label>
        <button onClick={() => void load()} className="rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">Search</button>
        <a href="/admin/inventory" className="rounded-xl border border-[var(--school-border)] px-5 py-3 text-center text-sm font-bold">Inventory</a>
      </div>

      {message ? <p className="mb-5 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}

      <section className="space-y-4">
        {rows.map((row) => (
          <article key={row.service_request_item_id} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1 text-xs font-bold theme-primary">{row.sr_number}</span>
                  <span className="rounded-full border border-[var(--school-border)] px-3 py-1 text-xs font-bold">{row.item_code}</span>
                </div>
                <h2 className="mt-3 text-lg font-black">{row.item_name}</h2>
                <p className="mt-1 text-sm text-[var(--school-muted)]">User: {row.requester_name} • ID: {row.requester_login_id}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[300px]">
                <div className="rounded-xl bg-[var(--school-background)] p-3"><b className="block text-base">{row.issued_quantity}</b>Issued</div>
                <div className="rounded-xl bg-[var(--school-background)] p-3"><b className="block text-base">{row.returned_quantity}</b>Returned</div>
                <div className="rounded-xl bg-[var(--school-primary-soft)] p-3 theme-primary"><b className="block text-base">{row.returnable_quantity}</b>Remaining</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[140px_170px_1fr_auto] lg:items-end">
              <label><span className="label">Return Qty</span><input className="field" type="number" min="0.01" max={row.returnable_quantity} step="0.01" value={quantities[row.service_request_item_id] || ""} onChange={(e) => setQuantities((current) => ({ ...current, [row.service_request_item_id]: e.target.value }))} placeholder={String(row.returnable_quantity)} /></label>
              <label><span className="label">Condition</span><select className="field" value={conditions[row.service_request_item_id] || "Good"} onChange={(e) => setConditions((current) => ({ ...current, [row.service_request_item_id]: e.target.value }))}><option>Good</option><option>Damaged</option><option>Partial</option><option>Other</option></select></label>
              <label><span className="label">Return Note</span><input className="field" value={notes[row.service_request_item_id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [row.service_request_item_id]: e.target.value }))} placeholder="Optional details" /></label>
              <button disabled={saving === row.service_request_item_id} onClick={() => void returnItem(row)} className="rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving === row.service_request_item_id ? "Saving..." : "Return to Stock"}</button>
            </div>
          </article>
        ))}

        {!loading && !rows.length ? <p className="rounded-3xl border border-dashed border-[var(--school-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">No issued items are currently waiting for return.</p> : null}
        {loading ? <p className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">Loading returnable items...</p> : null}
      </section>
    </AdminPageShell>
  );
}
