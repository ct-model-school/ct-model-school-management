"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  item_code: string;
  item_name: string;
  item_type: string | null;
  specification: string | null;
  model: string | null;
  unit: string;
  current_stock: number;
  stock_status: string;
};

type SelectedItem = Item & { quantity: number; note: string };
type Permissions = { view?: boolean; create?: boolean; history?: boolean };
type SubmittedSr = {
  srNumber: string;
  className: string;
  department: string;
  details: string;
  itemCount: number;
  totalQty: number;
  items: SelectedItem[];
};

const statusClass = (status: string) => {
  const value = status.toLowerCase();
  return value.includes("out")
    ? "text-red-700 bg-red-50 border-red-100"
    : value.includes("low")
      ? "text-amber-700 bg-amber-50 border-amber-100"
      : "theme-primary bg-[var(--school-primary-soft)] border-[var(--school-primary-border)]";
};

function SearchBar({
  disabled = false,
  query,
  setQuery,
  searching = false,
}: {
  disabled?: boolean;
  query?: string;
  setQuery?: (value: string) => void;
  searching?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm">
      <span className="flex shrink-0 items-center border-r border-[var(--school-border)] bg-[var(--school-primary-soft)] px-2.5 text-[10px] font-black theme-primary">
        ITM-
      </span>
      <input
        disabled={disabled}
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery?.(e.target.value)}
        placeholder="Start typing item code or name..."
        className="h-9 min-w-0 flex-1 bg-transparent px-2.5 text-[11px] font-medium text-[var(--school-text)] outline-none placeholder:text-[var(--school-muted)] disabled:opacity-60"
      />
      <span className="flex shrink-0 items-center px-2.5 text-[9px] font-bold text-[var(--school-muted)]">
        {searching ? "Matching..." : "Auto search"}
      </span>
    </div>
  );
}

function ItemSrFormPreview() {
  return (
    <div className="mt-3 space-y-3">
      <section className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-3">
        <SearchBar disabled />
        <p className="mt-1.5 text-[10px] text-[var(--school-muted)]">
          Matching items will appear automatically as you type. Use numeric code, ITM-code, item name, type or specification.
        </p>
      </section>
      <section className="rounded-xl border border-[var(--school-border)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Selected Items</p>
            <p className="mt-0.5 text-[10px] text-[var(--school-muted)]">Add items from the live search, then set quantity and optional note.</p>
          </div>
          <span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">0 items · Qty 0</span>
        </div>
        <div className="mt-2 rounded-lg border border-dashed border-[var(--school-border)] p-3 text-center text-[10px] text-[var(--school-muted)]">No items selected yet</div>
      </section>
      <section className="rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Service Request</p>
            <p className="mt-0.5 text-sm font-black">Request Information</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label><span className="mb-1 block text-[10px] font-bold">Class / Section *</span><input disabled placeholder="Class 6-A" className="field h-9 w-full text-[11px] disabled:opacity-70" /></label>
          <label><span className="mb-1 block text-[10px] font-bold">Department</span><input disabled placeholder="Member department" className="field h-9 w-full text-[11px] disabled:opacity-70" /></label>
        </div>
        <label className="mt-2 block"><span className="mb-1 block text-[10px] font-bold">Request Details *</span><textarea disabled rows={3} placeholder="What is the item needed for?" className="field w-full resize-none text-[11px] disabled:opacity-70" /></label>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[var(--school-surface)] px-3 py-2.5">
          <span className="text-[10px] font-bold theme-primary">Selected items · Total quantity</span>
          <button type="button" disabled className="rounded-lg px-4 py-2 text-[10px] font-black theme-primary-bg disabled:opacity-60">Submit for Approval →</button>
        </div>
      </section>
    </div>
  );
}

export async function printSr(sr: SubmittedSr) {
  const escapeHtml = (value: string) =>
    value.replace(/[&<>\"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '\"': "&quot;",
      "'": "&#39;",
    }[char] ?? char));

  let live: any = null;
  let currentUser: any = null;
  let logoUrl = "";
  try {
    const token = window.localStorage.getItem("ctms_store_token");
    if (token) {
      const { data } = await createClient().rpc("store_get_sr", {
        p_token: token,
        p_sr_number: sr.srNumber,
      });
      live = data ?? null;
      const { data: current } = await createClient().rpc("store_get_current_user_profile", { p_token: token });
      currentUser = current ?? null;
    }
    const { data: settings } = await createClient()
      .from("school_settings")
      .select("logo_url")
      .eq("id", 1)
      .maybeSingle();
    logoUrl = typeof settings?.logo_url === "string" ? settings.logo_url.trim() : "";
  } catch {
    live = null;
    logoUrl = "";
  }

  const liveItems = Array.isArray(live?.items) ? live.items : sr.items;
  const rows = liveItems.map((item: any, index: number) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td class="code">${escapeHtml(String(item.item_code ?? ""))}</td>
      <td><strong>${escapeHtml(String(item.item_name ?? ""))}</strong><div class="muted">${escapeHtml(String(item.specification || item.model || item.item_type || ""))}</div></td>
      <td class="center">${Number(item.requested_quantity ?? item.quantity ?? 0)}</td>
      <td class="center">${escapeHtml(String(item.unit ?? ""))}</td>
      <td>${escapeHtml(String(item.item_note ?? item.note ?? ""))}</td>
    </tr>`).join("");

  const requesterName = String(live?.requester_name || currentUser?.full_name || "Requester").trim();
  const requesterId = String(live?.requester_login_id || live?.requester_member_id || currentUser?.member_id || "-").trim();
  const requestedAt = live?.requested_at ? new Date(live.requested_at) : new Date();
  const rootStyles = getComputedStyle(document.documentElement);
  const themePrimary = rootStyles.getPropertyValue("--school-primary").trim() || "#145b3b";
  const themePrimarySoft = rootStyles.getPropertyValue("--school-primary-soft").trim() || "#eef6f1";
  const themePrimaryBorder = rootStyles.getPropertyValue("--school-primary-border").trim() || "#b9d7c7";
  const approverName = String(live?.approver_name || (live?.processed_by ? "Administrator" : "Pending Approval")).trim();
  const approverId = String(live?.approver_id || live?.approver_role || (live?.processed_by ? "-" : "Pending")).trim();
  const approvedAt = live?.processed_at ? new Date(live.processed_at) : null;
  const status = String(live?.status || "pending").toLowerCase();
  const statusLabel = status === "approved" || status === "partially_issued" || status === "issued"
    ? status.replace(/_/g, " ").replace(/^./, (c: string) => c.toUpperCase())
    : "Pending Approval";
  const formatDate = (date: Date | null) => date
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date)
    : "Pending";

  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) return;

  const logoMarkup = logoUrl
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="C.T. Model School" />`
    : `<div class="logo-placeholder" aria-hidden="true"></div>`;

  printWindow.document.write(`<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(sr.srNumber)} - Service Request</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: #fff; }
body { color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10px; overflow: hidden; }
.sheet { width: 210mm; height: 297mm; margin: 0; border: 1px solid #cfd6df; padding: 8mm; position: relative; overflow: hidden; page-break-after: avoid; break-inside: avoid; }
.header { display: flex; align-items: center; gap: 11px; padding-bottom: 7px; border-bottom: 2px solid ${themePrimary}; }
.logo, .logo-placeholder { width: 48px; height: 48px; object-fit: contain; display: block; flex: 0 0 48px; }
.school { flex: 1; text-align: center; min-width: 0; }
.school h1 { margin: 0; font-size: 19px; letter-spacing: .2px; color: ${themePrimary}; }
.school p { margin: 2px 0 0; font-size: 9px; color: #5b6472; }
.doc { width: 105px; text-align: right; flex: 0 0 105px; }
.doc strong { display: block; font-size: 13px; color: ${themePrimary}; }
.doc span { font-size: 9px; color: #687181; }
.title { text-align: center; margin: 7px 0 6px; }
.title h2 { display: inline-block; margin: 0; padding: 4px 14px; border: 1px solid ${themePrimaryBorder}; border-radius: 5px; font-size: 13px; letter-spacing: .8px; color: ${themePrimary}; }
.meta { display: grid; grid-template-columns: 1.2fr 1fr 1fr; border: 1px solid #cfd6df; margin-bottom: 7px; }
.meta div { padding: 5px 7px; border-right: 1px solid #cfd6df; }
.meta div:last-child { border-right: 0; }
.label { display: block; font-size: 7px; text-transform: uppercase; letter-spacing: .7px; color: #77808d; margin-bottom: 1px; }
.value { font-size: 10px; font-weight: 700; }
table { width: 100%; border-collapse: collapse; }
th { background: ${themePrimarySoft}; color: ${themePrimary}; font-size: 8px; text-transform: uppercase; letter-spacing: .3px; }
th, td { border: 1px solid #cfd6df; padding: 4px 4px; vertical-align: top; }
.center { text-align: center; }
.code { font-family: Consolas, monospace; font-weight: 700; color: ${themePrimary}; white-space: nowrap; }
.muted { margin-top: 1px; font-size: 7px; color: #737c89; line-height: 1.2; }
.summary { display: flex; justify-content: flex-end; margin-top: 5px; }
.summary-box { border: 1px solid #cfd6df; padding: 5px 8px; min-width: 160px; }
.summary-box strong { color: ${themePrimary}; }
.request { margin-top: 7px; border: 1px solid #cfd6df; }
.request h3 { margin: 0; padding: 5px 7px; background: ${themePrimarySoft}; color: ${themePrimary}; font-size: 8px; text-transform: uppercase; letter-spacing: .6px; }
.request p { margin: 0; padding: 6px 7px; line-height: 1.35; min-height: 38px; max-height: 50px; overflow: hidden; white-space: pre-wrap; }
.status { display: inline-block; margin-top: 5px; padding: 3px 7px; border: 1px solid ${themePrimaryBorder}; color: ${themePrimary}; font-weight: 700; border-radius: 12px; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 28px; }
.sig { text-align: center; padding-top: 18px; border-top: 1px solid #59616d; font-size: 8px; color: #606a77; }
.sig .name { display: block; margin-top: 3px; font-size: 9px; font-weight: 700; color: #172033; }
.sig .id { display: block; margin-top: 2px; font-size: 8px; font-weight: 700; color: ${themePrimary}; }
.sig .date { display: block; margin-top: 2px; font-size: 7px; color: #687181; }
.footer { position: absolute; left: 8mm; right: 8mm; bottom: 5mm; display: flex; justify-content: space-between; border-top: 1px solid #e0e4e9; padding-top: 4px; font-size: 7px; color: #7b8490; }
</style></head><body>
<div class="sheet">
  <div class="header">
    ${logoMarkup}
    <div class="school"><h1>C.T. Model School</h1><p>Item Requisition &amp; Service Request</p></div>
    <div class="doc"><strong>SERVICE REQUEST</strong><span>${escapeHtml(sr.srNumber)}</span></div>
  </div>
  <div class="title"><h2>ITEM SERVICE REQUEST</h2></div>
  <div class="meta">
    <div><span class="label">SR Number</span><span class="value">${escapeHtml(sr.srNumber)}</span></div>
    <div><span class="label">Class / Section</span><span class="value">${escapeHtml(String(live?.class_name || sr.className))}</span></div>
    <div><span class="label">Department</span><span class="value">${escapeHtml(String(live?.department || sr.department || "-"))}</span></div>
  </div>
  <table><thead><tr><th style="width:30px">SL</th><th style="width:78px">Item Code</th><th>Item Description</th><th style="width:50px">Qty</th><th style="width:44px">Unit</th><th style="width:105px">Note</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="summary"><div class="summary-box"><div>Requested Items: <strong>${liveItems.length}</strong></div><div>Total Quantity: <strong>${liveItems.reduce((sum: number, item: any) => sum + Number(item.requested_quantity ?? item.quantity ?? 0), 0)}</strong></div></div></div>
  <div class="request"><h3>Request Details</h3><p>${escapeHtml(String(live?.request_details || sr.details))}</p></div>
  <span class="status">Status: ${escapeHtml(statusLabel)}</span>
  <div class="signatures">
    <div class="sig">Prepared By<span class="name">${escapeHtml(requesterName)}</span><span class="id">ID: ${escapeHtml(requesterId)}</span><span class="date">${formatDate(requestedAt)}</span></div>
    <div class="sig">Approved By<span class="name">${escapeHtml(approverName)}</span><span class="id">ID: ${escapeHtml(approverId)}</span><span class="date">${approvedAt ? formatDate(approvedAt) : "Pending Approval"}</span></div>
  </div>
  <div class="footer"><span>C.T. Model School · Item SR</span><span>Page 1 of 1</span></div>
</div>
<script>
(function () {
  function doPrint() { setTimeout(function () { window.print(); }, 150); }
  var logo = document.querySelector('.logo');
  if (logo && !logo.complete) { logo.onload = doPrint; logo.onerror = doPrint; } else { doPrint(); }
  window.onafterprint = function () { window.close(); };
})();
</script></body></html>`);
  printWindow.document.close();
}

export default function ItemSrModule({ department, permissions, preview = false }: { department: string | null; permissions: Permissions; preview?: boolean }) {
  const supabase = createClient();
  const canSearch = Boolean(permissions.view || permissions.create);
  const canCreate = Boolean(permissions.create);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [className, setClassName] = useState("");
  const [details, setDetails] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastSr, setLastSr] = useState<SubmittedSr | null>(null);
  const searchRequest = useRef(0);

  async function searchItem(rawQuery = query) {
    const raw = rawQuery.trim();
    if (!raw) {
      setItems([]);
      setSearching(false);
      return;
    }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) {
      setError("Your session has expired. Please login again.");
      return;
    }
    const requestId = ++searchRequest.current;
    const isCode = /^ITM-?\d+$/i.test(raw) || /^\d+$/.test(raw);
    const clean = raw.replace(/^ITM-/i, "");
    const search = isCode ? `ITM-${clean}` : raw;
    setSearching(true);
    const { data, error: searchError } = await supabase.rpc("store_list_items", { p_token: token, p_search: search });
    if (requestId !== searchRequest.current) return;
    setSearching(false);
    if (searchError) {
      setError(searchError.message);
      return;
    }
    setError("");
    setItems((data ?? []) as Item[]);
  }

  useEffect(() => {
    if (preview || !canSearch) return;
    const value = query.trim();
    if (!value) {
      setItems([]);
      setSearching(false);
      return;
    }
    const timer = window.setTimeout(() => { void searchItem(value); }, 220);
    return () => window.clearTimeout(timer);
  }, [query, preview, canSearch]);

  function addItem(item: Item) {
    if (!canCreate) return;
    if (Number(item.current_stock) <= 0) {
      setError(`${item.item_code} is currently out of stock.`);
      return;
    }
    if (selected.some((x) => x.id === item.id)) return;
    setSelected((current) => [...current, { ...item, quantity: 1, note: "" }]);
    setItems((current) => current.filter((x) => x.id !== item.id));
    setError("");
  }

  function updateSelected(id: string, field: "quantity" | "note", value: string) {
    setSelected((current) => current.map((item) => item.id === id
      ? { ...item, [field]: field === "quantity" ? Math.max(1, Math.min(Number(item.current_stock), Number(value) || 1)) : value }
      : item));
  }

  async function submitRequest() {
    setError("");
    setMessage("");
    if (!canCreate) { setError("You do not have Item SR create permission."); return; }
    if (!selected.length) { setError("Select at least one item for the SR."); return; }
    if (!className.trim()) { setError("Class / Section is required."); return; }
    if (!details.trim()) { setError("Request Details is required."); return; }
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setError("Your session has expired. Please login again."); return; }
    setSubmitting(true);
    const snapshot = selected.map((item) => ({ ...item }));
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
    const totalQty = snapshot.reduce((sum, item) => sum + Number(item.quantity), 0);
    const srNumber = data?.sr_number ?? "";
    setLastSr({ srNumber, className: submittedClass, department: submittedDepartment, details: submittedDetails, itemCount: snapshot.length, totalQty, items: snapshot });
    setMessage(`SR ${srNumber} submitted successfully. Status: Pending Approval.`);
    setSelected([]);
    setItems([]);
    setQuery("");
    setClassName("");
    setDetails("");
  }

  if (preview) return <ItemSrFormPreview />;
  if (!canSearch) return <div className="mt-3 rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-8 text-center"><p className="text-sm font-black">Item SR Access</p><p className="mt-1 text-xs text-[var(--school-muted)]">Your role does not have Item SR view or create permission.</p></div>;

  const totalQty = selected.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <div className="mt-3 space-y-3">
      <section className="rounded-xl border border-[var(--school-border)] bg-[var(--school-primary-soft)] p-3">
        <SearchBar query={query} setQuery={setQuery} searching={searching} />
        <p className="mt-1.5 text-[10px] text-[var(--school-muted)]">Start typing and matching items appear automatically. You do not need to press Enter or click Search.</p>
        {items.length ? (
          <div className="mt-2 max-h-60 space-y-1 overflow-y-auto pr-0.5">
            {items.map((item) => (
              <button key={item.id} type="button" onClick={() => addItem(item)} disabled={!canCreate} className="w-full rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2 text-left transition-colors hover:border-[var(--school-primary-border)] disabled:cursor-default">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="shrink-0 text-[10px] font-black theme-primary">{item.item_code}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{item.item_name}</span>
                  <span className="min-w-0 max-w-[280px] truncate text-[9px] text-[var(--school-muted)]">{item.specification || item.model || item.item_type || "Item"}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusClass(item.stock_status)}`}>{item.stock_status} · {item.current_stock} {item.unit}</span>
                </div>
              </button>
            ))}
          </div>
        ) : query.trim() && !searching ? (
          <div className="mt-2 rounded-lg border border-dashed border-[var(--school-border)] bg-[var(--school-surface)] p-3 text-center text-[10px] text-[var(--school-muted)]">No matching active item found.</div>
        ) : null}
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] leading-5 text-red-700">{error}</p> : null}

      {canCreate ? (
        <section className="rounded-xl border border-[var(--school-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Selected Items</p><p className="mt-0.5 text-[10px] text-[var(--school-muted)]">Set quantity and optional note.</p></div>
            <span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">{selected.length} items · Qty {totalQty}</span>
          </div>
          {selected.length ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-[var(--school-border)]">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_92px_minmax(130px,1fr)_auto] items-center gap-2 bg-[var(--school-primary-soft)] px-3 py-1.5 text-[9px] font-bold text-[var(--school-muted)] sm:grid"><span>Item</span><span>Quantity</span><span>Note</span><span></span></div>
              <div className="divide-y divide-[var(--school-border)]">
                {selected.map((item) => (
                  <div key={item.id} className="grid gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1.4fr)_92px_minmax(130px,1fr)_auto] sm:items-center">
                    <div className="min-w-0 flex items-center gap-2"><span className="shrink-0 text-[10px] font-black theme-primary">{item.item_code}</span><span className="min-w-0 truncate text-[10px] font-semibold">{item.item_name}</span><span className="hidden shrink-0 text-[9px] text-[var(--school-muted)] lg:inline">Stock {item.current_stock} {item.unit}</span></div>
                    <input type="number" min="1" max={Number(item.current_stock)} value={item.quantity} onChange={(e) => updateSelected(item.id, "quantity", e.target.value)} className="field h-8 w-full text-[10px]" aria-label={`Quantity for ${item.item_code}`} />
                    <input value={item.note} onChange={(e) => updateSelected(item.id, "note", e.target.value)} placeholder="Optional note" className="field h-8 w-full text-[10px]" aria-label={`Note for ${item.item_code}`} />
                    <button type="button" onClick={() => setSelected((current) => current.filter((x) => x.id !== item.id))} className="justify-self-start rounded-md border border-red-200 px-2.5 py-1 text-[9px] font-bold text-red-600 hover:bg-red-50 sm:justify-self-end">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="mt-2 rounded-lg border border-dashed border-[var(--school-border)] p-3 text-center text-[10px] text-[var(--school-muted)]">No items selected yet. Start typing above and select an item.</div>}
        </section>
      ) : null}

      {canCreate ? (
        <section className="rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-3">
          <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Service Request</p><p className="mt-0.5 text-sm font-black">Request Information</p></div><span className="rounded-full bg-[var(--school-surface)] px-2.5 py-1 text-[9px] font-black theme-primary">{selected.length} item(s) · Qty {totalQty}</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label><span className="mb-1 block text-[10px] font-bold">Class / Section *</span><input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 6-A" className="field h-9 w-full text-[11px]" /></label>
            <label><span className="mb-1 block text-[10px] font-bold">Department</span><input value={department || ""} readOnly className="field h-9 w-full bg-[var(--school-primary-soft)] text-[11px]" /></label>
          </div>
          <label className="mt-2 block"><span className="mb-1 block text-[10px] font-bold">Request Details *</span><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="What is the item needed for?" className="field w-full resize-none text-[11px]" /></label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--school-surface)] px-3 py-2.5"><span className="text-[10px] font-bold theme-primary">{selected.length} item(s) · Total Qty {totalQty}</span><button type="button" onClick={() => void submitRequest()} disabled={submitting || !selected.length} className="rounded-lg px-4 py-2 text-[10px] font-black theme-primary-bg disabled:opacity-50">{submitting ? "Submitting..." : "Submit for Approval →"}</button></div>
        </section>
      ) : null}

      {lastSr ? (
        <section className="rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">Last Service Request</p><p className="mt-0.5 text-sm font-black">{lastSr.srNumber}</p></div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-[var(--school-surface)] px-2.5 py-1 text-[9px] font-black theme-primary">Pending Approval</span><button type="button" onClick={() => void printSr(lastSr)} className="rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[9px] font-black theme-primary hover:bg-[var(--school-primary-soft)]">Print SR</button></div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-4"><div className="rounded-md bg-[var(--school-surface)] px-2.5 py-2">Class<p className="font-bold">{lastSr.className}</p></div><div className="rounded-md bg-[var(--school-surface)] px-2.5 py-2">Department<p className="font-bold">{lastSr.department || "-"}</p></div><div className="rounded-md bg-[var(--school-surface)] px-2.5 py-2">Items<p className="font-bold">{lastSr.itemCount} · Qty {lastSr.totalQty}</p></div><div className="rounded-md bg-[var(--school-surface)] px-2.5 py-2">Details<p className="truncate font-bold" title={lastSr.details}>{lastSr.details}</p></div></div>
        </section>
      ) : null}

      {message ? <p className="rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-2.5 text-[10px] font-bold theme-primary">{message}</p> : null}
    </div>
  );
}
