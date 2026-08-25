"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SrPrintPreview from "@/components/SrPrintPreview";

type InventoryPermissions = {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  remove?: boolean;
  sr_approval?: boolean;
  sr_issue?: boolean;
};

type Item = {
  id: string;
  item_code: string;
  item_name: string;
  item_type: string | null;
  specification: string | null;
  brand: string | null;
  model: string | null;
  unit: string;
  details: string | null;
  note: string | null;
  current_stock: number;
  reorder_level: number;
};

type SrItem = {
  item_id: string;
  item_code: string;
  item_name: string;
  item_type?: string | null;
  specification?: string | null;
  brand?: string | null;
  model?: string | null;
  unit: string;
  details?: string | null;
  note?: string | null;
  current_stock?: number | null;
  requested_quantity: number;
  issued_quantity: number;
  remaining_quantity: number;
  item_note: string | null;
};

type Sr = {
  id: string;
  sr_number: string;
  requester_name: string;
  requester_login_id: string;
  requester_email?: string | null;
  requester_phone?: string | null;
  class_name: string | null;
  department: string | null;
  request_details: string | null;
  status: string;
  admin_note?: string | null;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  approver_name?: string | null;
  approver_id?: string | null;
  approver_role?: string | null;
  issued_by?: string | null;
  issued_at?: string | null;
  issued_name?: string | null;
  issued_id?: string | null;
  items: SrItem[];
};

type ItemForm = {
  id: string | null;
  item_name: string;
  item_type: string;
  specification: string;
  brand: string;
  model: string;
  unit: string;
  details: string;
  note: string;
  current_stock: string;
  reorder_level: string;
};

const units = ["pcs", "set", "box", "roll", "meter", "kg", "liter", "pair", "other"];
const emptyForm: ItemForm = {
  id: null,
  item_name: "",
  item_type: "",
  specification: "",
  brand: "",
  model: "",
  unit: "pcs",
  details: "",
  note: "",
  current_stock: "0",
  reorder_level: "0",
};

const statusClass = (status: string) => {
  const value = status.toLowerCase();
  if (value.includes("reject")) return "border-red-200 bg-red-50 text-red-700";
  if (value.includes("pending")) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] theme-primary";
};

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "-";

export default function InventoryModule({ permissions }: { permissions: InventoryPermissions }) {
  const supabase = useMemo(() => createClient(), []);
  const canView = Boolean(permissions.view);
  const canAdd = Boolean(permissions.add);
  const canEdit = Boolean(permissions.edit);
  const canRemove = Boolean(permissions.remove);
  const canApprove = Boolean(permissions.sr_approval);
  const canIssue = Boolean(permissions.sr_issue);
  const canSeeSr = canApprove || canIssue;
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
  const [selectedSr, setSelectedSr] = useState<string | null>(null);

  async function loadItems(search = itemSearch) {
    if (!canView) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("store_member_list_inventory", {
      p_token: token,
      p_search: search.trim() || null,
    });
    if (error) setMessage(error.message);
    else setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  async function loadSrs(search = srSearch) {
    if (!canSeeSr) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("store_admin_list_srs", {
      p_search: search.trim() || null,
      p_token: token,
    });
    if (error) setMessage(error.message);
    else setSrs((data ?? []).map((row: Sr) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
    setLoading(false);
  }

  useEffect(() => {
    void loadItems("");
    void loadSrs("");
  }, [canView, canSeeSr]);

  useEffect(() => {
    if (!canView) return;
    const timer = window.setTimeout(() => void loadItems(itemSearch), 220);
    return () => window.clearTimeout(timer);
  }, [itemSearch, canView]);

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    if ((form.id && !canEdit) || (!form.id && !canAdd)) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.rpc("store_member_save_item", {
      p_token: token,
      p_id: form.id,
      p_item_name: form.item_name,
      p_item_type: form.item_type,
      p_specification: form.specification,
      p_brand: form.brand,
      p_model: form.model,
      p_unit: form.unit,
      p_details: form.details,
      p_note: form.note,
      p_current_stock: Number(form.current_stock) || 0,
      p_reorder_level: Number(form.reorder_level) || 0,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(form.id ? "Item updated successfully." : `Item added: ${(data as Item).item_code}`);
      setForm(emptyForm);
      await loadItems();
    }
    setSaving(false);
  }

  async function removeItem(item: Item) {
    if (!canRemove) return;
    if (!window.confirm(`Remove ${item.item_name} (${item.item_code}) from active inventory?`)) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase.rpc("store_member_deactivate_item", { p_token: token, p_id: item.id });
    if (error) setMessage(error.message);
    else {
      setMessage("Item removed from active inventory.");
      await loadItems();
    }
    setSaving(false);
  }

  async function processSr(sr: Sr, action: "approve" | "reject" | "issue") {
    if ((action === "approve" || action === "reject") && !canApprove) return;
    if (action === "issue" && !canIssue) return;
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) return;
    if (action === "reject" && !window.confirm(`Reject ${sr.sr_number}?`)) return;

    const issueItems = sr.items
      .map((item) => ({ item_id: item.item_id, quantity: Number(issueQuantities[item.item_id] || 0) }))
      .filter((item) => item.quantity > 0);

    setSaving(true);
    setMessage("");
    const { error } = await supabase.rpc("store_admin_process_sr", {
      p_request_id: sr.id,
      p_action: action,
      p_issue_items: issueItems,
      p_admin_note: "",
      p_token: token,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(`${sr.sr_number} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "issued"}.`);
      setIssueQuantities({});
      await Promise.all([loadSrs(), loadItems()]);
    }
    setSaving(false);
  }

  function editItem(item: Item) {
    if (!canEdit) return;
    setForm({
      id: item.id,
      item_name: item.item_name,
      item_type: item.item_type || "",
      specification: item.specification || "",
      brand: item.brand || "",
      model: item.model || "",
      unit: item.unit,
      details: item.details || "",
      note: item.note || "",
      current_stock: String(item.current_stock),
      reorder_level: String(item.reorder_level),
    });
  }

  const pendingSrs = srs.filter((sr) => sr.status === "pending");
  const historySrs = srs.filter((sr) => sr.status !== "pending");

  return (
    <div className="space-y-5">
      {message ? (
        <p className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] px-4 py-2.5 text-xs font-semibold theme-primary">
          {message}
        </p>
      ) : null}

      {(canView || canManageItems) ? (
        <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Inventory</p>
              <h3 className="mt-0.5 text-base font-black">Items & Stock</h3>
              <p className="mt-0.5 text-xs text-[var(--school-muted)]">The same item list structure is used across Inventory users.</p>
            </div>
            {canView ? (
              <div className="flex w-full gap-2 lg:w-auto">
                <input
                  className="field min-w-0 flex-1 lg:w-72"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search code, name, type, specification..."
                />
              </div>
            ) : null}
          </div>

          {canManageItems ? (
            <details className="mt-3 rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)]">
              <summary className="cursor-pointer px-3 py-2.5 text-xs font-black">{form.id ? "Edit Item" : "Add New Item"}</summary>
              <form onSubmit={saveItem} className="grid gap-2 border-t border-[var(--school-border)] p-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="sm:col-span-2 lg:col-span-3"><span className="label">Item Name *</span><input className="field w-full" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required /></label>
                <label><span className="label">Type</span><input className="field w-full" value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} /></label>
                <label><span className="label">Unit</span><select className="field w-full" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
                <label><span className="label">Specification</span><input className="field w-full" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} /></label>
                <label><span className="label">Brand</span><input className="field w-full" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
                <label><span className="label">Model</span><input className="field w-full" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label>
                <label><span className="label">Present Stock</span><input className="field w-full" type="number" min="0" step="0.01" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} /></label>
                <label><span className="label">Low Stock Alert</span><input className="field w-full" type="number" min="0" step="0.01" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></label>
                <label className="sm:col-span-2 lg:col-span-3"><span className="label">Details</span><textarea className="field min-h-20 w-full py-2" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></label>
                <label className="sm:col-span-2 lg:col-span-3"><span className="label">Note</span><textarea className="field min-h-20 w-full py-2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
                <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg">{saving ? "Saving..." : form.id ? "Update Item" : "Add Item"}</button>{form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-bold">Cancel</button> : null}</div>
              </form>
            </details>
          ) : null}

          {canView ? (
            <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--school-border)]">
              <table className="min-w-[980px] w-full border-collapse text-left text-[11px]">
                <thead className="bg-[var(--school-primary-soft)]">
                  <tr>
                    <th className="px-3 py-2.5 font-black theme-primary">Item Code</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Item</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Type</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Specification</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Brand / Model</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Unit</th>
                    <th className="px-3 py-2.5 text-right font-black theme-primary">Stock</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Status</th>
                    <th className="px-3 py-2.5 font-black theme-primary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const low = item.current_stock <= item.reorder_level;
                    return (
                      <tr key={item.id} className="border-t border-[var(--school-border)] hover:bg-[var(--school-primary-soft)]/30">
                        <td className="px-3 py-2.5 font-bold theme-primary">{item.item_code}</td>
                        <td className="px-3 py-2.5"><div className="max-w-[180px] break-words font-bold">{item.item_name}</div>{item.note ? <div className="mt-0.5 max-w-[180px] break-words text-[10px] text-[var(--school-muted)]">{item.note}</div> : null}</td>
                        <td className="px-3 py-2.5">{item.item_type || "-"}</td>
                        <td className="px-3 py-2.5"><div className="max-w-[220px] break-words">{item.specification || "-"}</div></td>
                        <td className="px-3 py-2.5">{[item.brand, item.model].filter(Boolean).join(" / ") || "-"}</td>
                        <td className="px-3 py-2.5">{item.unit}</td>
                        <td className="px-3 py-2.5 text-right font-bold">{item.current_stock}</td>
                        <td className="px-3 py-2.5"><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${low ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] theme-primary"}`}>{item.current_stock <= 0 ? "Out of Stock" : low ? "Low Stock" : "In Stock"}</span></td>
                        <td className="px-3 py-2.5"><div className="flex gap-1.5">{canEdit ? <button type="button" onClick={() => editItem(item)} className="rounded-lg border border-[var(--school-border)] px-2.5 py-1.5 text-[10px] font-bold">Edit</button> : null}{canRemove ? <button type="button" onClick={() => void removeItem(item)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600">Remove</button> : null}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loading && !items.length ? <p className="p-5 text-center text-xs text-[var(--school-muted)]">No items found.</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {canSeeSr ? (
        <section className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Service Requests</p>
              <h3 className="mt-0.5 text-base font-black">User SR</h3>
              <p className="mt-0.5 text-xs text-[var(--school-muted)]">Approval and Issue are separate permissions. Actions appear only when your role has the required permission.</p>
            </div>
            <input className="field w-full lg:w-72" value={srSearch} onChange={(e) => setSrSearch(e.target.value)} placeholder="SR / member ID / requester" />
            <button type="button" onClick={() => void loadSrs()} className="rounded-xl px-4 py-2.5 text-xs font-bold theme-primary-bg lg:w-auto">Search</button>
          </div>

          <SrTable title="Awaiting Approval" rows={pendingSrs} saving={saving} canApprove={canApprove} canIssue={canIssue} issueQuantities={issueQuantities} setIssueQuantities={setIssueQuantities} onView={setSelectedSr} onProcess={processSr} />
          <SrTable title="Previous / History" rows={historySrs} saving={saving} canApprove={canApprove} canIssue={canIssue} issueQuantities={issueQuantities} setIssueQuantities={setIssueQuantities} onView={setSelectedSr} onProcess={processSr} />
        </section>
      ) : null}

      {selectedSr ? <SrPrintPreview srNumber={selectedSr} open={true} onClose={() => setSelectedSr(null)} /> : null}
    </div>
  );
}

function SrTable({
  title,
  rows,
  saving,
  canApprove,
  canIssue,
  issueQuantities,
  setIssueQuantities,
  onView,
  onProcess,
}: {
  title: string;
  rows: Sr[];
  saving: boolean;
  canApprove: boolean;
  canIssue: boolean;
  issueQuantities: Record<string, string>;
  setIssueQuantities: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onView: (srNumber: string) => void;
  onProcess: (sr: Sr, action: "approve" | "reject" | "issue") => void;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3"><div><h4 className="text-xs font-black uppercase tracking-[0.14em] theme-primary">{title}</h4><p className="mt-0.5 text-[10px] text-[var(--school-muted)]">{rows.length} request{rows.length === 1 ? "" : "s"}</p></div></div>
      <div className="overflow-x-auto rounded-xl border border-[var(--school-border)]">
        <table className="min-w-[1100px] w-full border-collapse text-left text-[11px]">
          <thead className="bg-[var(--school-primary-soft)]"><tr><th className="px-3 py-2.5 font-black theme-primary">SR Number</th><th className="px-3 py-2.5 font-black theme-primary">Requester</th><th className="px-3 py-2.5 font-black theme-primary">Member ID</th><th className="px-3 py-2.5 font-black theme-primary">Department</th><th className="px-3 py-2.5 font-black theme-primary">Class</th><th className="px-3 py-2.5 font-black theme-primary">Items</th><th className="px-3 py-2.5 font-black theme-primary">Status</th><th className="px-3 py-2.5 font-black theme-primary">Date</th><th className="px-3 py-2.5 font-black theme-primary">Action</th></tr></thead>
          <tbody>
            {rows.map((sr) => (
              <tr key={sr.id} className="border-t border-[var(--school-border)] align-top hover:bg-[var(--school-primary-soft)]/30">
                <td className="px-3 py-2.5"><button type="button" onClick={() => onView(sr.sr_number)} className="font-black theme-primary hover:underline">{sr.sr_number}</button></td>
                <td className="px-3 py-2.5"><div className="font-bold">{sr.requester_name}</div></td>
                <td className="px-3 py-2.5 font-semibold">{sr.requester_login_id}</td>
                <td className="px-3 py-2.5">{sr.department || "-"}</td>
                <td className="px-3 py-2.5">{sr.class_name || "-"}</td>
                <td className="px-3 py-2.5"><div className="max-w-[280px] space-y-1">{sr.items.map((item) => <div key={item.item_id} className="break-words"><span className="font-semibold">{item.item_code}</span> × {item.requested_quantity}{item.remaining_quantity > 0 && sr.status !== "pending" ? <span className="ml-1 text-[10px] text-[var(--school-muted)]">({item.remaining_quantity} remaining)</span> : null}{canIssue && (sr.status === "approved" || sr.status === "partially_issued") ? <input aria-label={`Issue quantity for ${item.item_code}`} className="field ml-2 inline-block w-20 py-1 text-[10px]" type="number" min="0" max={item.remaining_quantity} step="0.01" value={issueQuantities[item.item_id] || ""} onChange={(e) => setIssueQuantities((current) => ({ ...current, [item.item_id]: e.target.value }))} placeholder="Issue" /> : null}</div>)}</div></td>
                <td className="px-3 py-2.5"><span className={`rounded-full border px-2 py-1 text-[9px] font-bold capitalize ${statusClass(sr.status)}`}>{sr.status.replace(/_/g, " ")}</span></td>
                <td className="px-3 py-2.5 whitespace-nowrap text-[10px] text-[var(--school-muted)]">{formatDate(sr.requested_at)}</td>
                <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1.5">{sr.status === "pending" && canApprove ? <><button type="button" disabled={saving} onClick={() => onProcess(sr, "approve")} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold theme-primary-bg">Approve</button><button type="button" disabled={saving} onClick={() => onProcess(sr, "reject")} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600">Reject</button></> : null}{(sr.status === "approved" || sr.status === "partially_issued") && canIssue ? <button type="button" disabled={saving} onClick={() => onProcess(sr, "issue")} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold theme-primary-bg">Issue</button> : null}<button type="button" onClick={() => onView(sr.sr_number)} className="rounded-lg border border-[var(--school-border)] px-2.5 py-1.5 text-[10px] font-bold">View</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-5 text-center text-xs text-[var(--school-muted)]">No requests in this section.</p> : null}
      </div>
    </section>
  );
}
