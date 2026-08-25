"use client";

import { useEffect } from "react";

type SrDetailItem = { item_id: string; item_code: string; item_name: string; item_type?: string | null; specification?: string | null; brand?: string | null; model?: string | null; unit: string; details?: string | null; note?: string | null; current_stock?: number | null; requested_quantity: number; issued_quantity: number; remaining_quantity?: number | null; item_note?: string | null; };
type SrDetail = { sr_number: string; requester_name?: string | null; requester_login_id?: string | null; requester_email?: string | null; requester_phone?: string | null; class_name?: string | null; department?: string | null; request_details?: string | null; status: string; admin_note?: string | null; requested_at: string; processed_at?: string | null; items: SrDetailItem[]; };

function formatDate(value?: string | null) { if (!value) return "-"; return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
const statusClass = (status: string) => { const value = status.toLowerCase(); return value.includes("reject") || value.includes("cancel") ? "text-red-700 bg-red-50 border-red-100" : value.includes("pending") ? "text-amber-700 bg-amber-50 border-amber-100" : "theme-primary bg-[var(--school-primary-soft)] border-[var(--school-primary-border)]"; };

export default function SrDetailModal({ sr, open, onClose }: { sr: SrDetail | null; open: boolean; onClose: () => void }) {
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open || !sr) return null;

  return <>
    <style>{`@media print {
      @page { size:A4 portrait; margin:8mm; }
      html,body { margin:0 !important; padding:0 !important; background:#fff !important; }
      body * { visibility:hidden !important; }
      .sr-print-overlay,.sr-print-overlay * { visibility:visible !important; }
      .sr-print-overlay { position:absolute !important; inset:0 !important; display:block !important; width:100% !important; padding:0 !important; margin:0 !important; background:#fff !important; }
      .sr-print-modal { display:block !important; width:100% !important; max-width:none !important; max-height:none !important; margin:0 !important; padding:0 !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; overflow:visible !important; background:#fff !important; }
      .sr-no-print,.sr-screen-content { display:none !important; }
      .sr-print-only { display:block !important; }
      .sr-a4 { width:100% !important; margin:0 !important; padding:0 !important; font-size:8px !important; line-height:1.2 !important; }
      .sr-a4-header { display:flex !important; justify-content:space-between !important; align-items:flex-start !important; border-bottom:1.5px solid #17233b !important; padding-bottom:4px !important; margin-bottom:5px !important; }
      .sr-a4-school { margin:0 0 1px !important; font-size:6px !important; font-weight:800 !important; letter-spacing:.14em !important; text-transform:uppercase !important; }
      .sr-a4-title { margin:0 !important; font-size:14px !important; line-height:1 !important; font-weight:800 !important; }
      .sr-a4-number { margin:0 !important; font-size:8px !important; font-weight:800 !important; text-align:right !important; }
      .sr-a4-status { display:inline-block !important; margin-top:2px !important; padding:1px 5px !important; border:1px solid #cbd5e1 !important; border-radius:999px !important; font-size:6px !important; }
      .sr-a4-meta { display:grid !important; grid-template-columns:1.55fr 1fr 1fr 1fr !important; border:1px solid #cbd5e1 !important; margin-bottom:5px !important; }
      .sr-a4-meta-cell { min-width:0 !important; padding:3px 5px !important; border-right:1px solid #cbd5e1 !important; }
      .sr-a4-meta-cell:last-child { border-right:0 !important; }
      .sr-a4-label { display:block !important; margin-bottom:1px !important; font-size:5.5px !important; font-weight:800 !important; color:#64748b !important; text-transform:uppercase !important; }
      .sr-a4-value { display:block !important; font-size:7px !important; font-weight:700 !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; }
      .sr-a4-request { border:1px solid #cbd5e1 !important; padding:3px 5px !important; margin-bottom:5px !important; }
      .sr-a4-request strong { font-size:5.5px !important; color:#64748b !important; text-transform:uppercase !important; }
      .sr-a4-request div { margin-top:1px !important; font-size:7px !important; white-space:pre-wrap !important; }
      .sr-a4-items-title { margin:0 0 2px !important; font-size:8px !important; font-weight:800 !important; }
      .sr-a4-table { width:100% !important; border-collapse:collapse !important; table-layout:fixed !important; }
      .sr-a4-table th,.sr-a4-table td { border:1px solid #b8c0cc !important; padding:2.5px 3px !important; vertical-align:top !important; }
      .sr-a4-table th { background:#f1f5f9 !important; font-size:5.5px !important; font-weight:800 !important; text-transform:uppercase !important; text-align:left !important; }
      .sr-a4-table td { font-size:6.8px !important; line-height:1.15 !important; }
      .col-no { width:4% !important; text-align:center !important; }
      .col-item { width:27% !important; }
      .col-spec { width:31% !important; }
      .col-brand { width:15% !important; }
      .col-qty { width:9% !important; text-align:center !important; }
      .col-stock { width:7% !important; text-align:center !important; }
      .col-issued { width:7% !important; text-align:center !important; }
      .sr-a4-item-name { font-size:7px !important; font-weight:800 !important; }
      .sr-a4-code { margin-top:1px !important; font-size:5.5px !important; color:#64748b !important; }
      .sr-a4-sub,.sr-a4-note { margin-top:1px !important; font-size:5.8px !important; color:#475569 !important; }
      .sr-a4-admin { margin-top:4px !important; border:1px solid #cbd5e1 !important; padding:3px 5px !important; }
      .sr-a4-admin strong { font-size:5.5px !important; color:#64748b !important; text-transform:uppercase !important; }
      .sr-a4-admin div { margin-top:1px !important; font-size:6.8px !important; }
      .sr-a4-footer { display:flex !important; justify-content:space-between !important; margin-top:4px !important; padding-top:3px !important; border-top:1px solid #cbd5e1 !important; font-size:5.8px !important; color:#64748b !important; }
      tr { page-break-inside:avoid !important; break-inside:avoid !important; }
    }
    @media screen { .sr-print-only { display:none; } }`}</style>

    <div className="sr-print-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="sr-print-modal flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-2xl">
        <header className="sr-no-print flex items-start justify-between gap-4 border-b border-[var(--school-border)] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Service Request Details</p><h2 className="mt-1 text-xl font-black">{sr.sr_number}</h2><p className="mt-1 text-xs text-[var(--school-muted)]">Complete SR information and requested item details</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => window.print()} className="rounded-xl px-4 py-2.5 text-xs font-black theme-primary-bg">Print A4</button><button type="button" onClick={onClose} className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-sm font-bold">×</button></div></header>

        <div className="sr-screen-content overflow-y-auto p-5 sm:p-7"><div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-start justify-between gap-4 border-b-2 border-[var(--school-text)] pb-4"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] theme-primary">C.T. Model School</p><h1 className="mt-1 text-2xl font-black">Item Service Request</h1></div><div className="text-right"><p className="text-xs font-black">{sr.sr_number}</p><span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(sr.status)}`}>{sr.status.replace(/_/g, " ")}</span></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Requester</p><p className="mt-1 text-sm font-bold">{sr.requester_name || "-"}</p><p className="text-[10px] text-[var(--school-muted)]">{sr.requester_login_id || "-"}</p></div><div className="rounded-xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Request Date</p><p className="mt-1 text-sm font-bold">{formatDate(sr.requested_at)}</p></div><div className="rounded-xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Class / Section</p><p className="mt-1 text-sm font-bold">{sr.class_name || "-"}</p></div><div className="rounded-xl border border-[var(--school-border)] p-3"><p className="text-[9px] font-black uppercase text-[var(--school-muted)]">Department</p><p className="mt-1 text-sm font-bold">{sr.department || "-"}</p></div></div>
          {sr.request_details ? <section className="mt-4 rounded-xl border border-[var(--school-border)] p-4"><p className="text-[9px] font-black uppercase theme-primary">Request Details</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{sr.request_details}</p></section> : null}
          <section className="mt-5"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black">Requested Items</h3><span className="text-[10px] font-bold text-[var(--school-muted)]">{sr.items.length} items</span></div><div className="overflow-hidden rounded-xl border border-[var(--school-border)]">{sr.items.map((item,index)=><div key={item.item_id} className="border-b border-[var(--school-border)] p-4 last:border-b-0"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black theme-primary">{index+1}. {item.item_code}</p><h4 className="mt-1 text-sm font-black">{item.item_name}</h4></div><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-black theme-primary">Requested: {item.requested_quantity} {item.unit}</span></div><div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2"><p><b>Type:</b> {item.item_type || "-"}</p><p><b>Specification:</b> {item.specification || "-"}</p><p><b>Brand:</b> {item.brand || "-"}</p><p><b>Model:</b> {item.model || "-"}</p><p><b>Unit:</b> {item.unit || "-"}</p><p><b>Current Stock:</b> {item.current_stock ?? "-"}</p><p><b>Issued:</b> {item.issued_quantity} {item.unit}</p><p><b>Remaining:</b> {item.remaining_quantity ?? Math.max(Number(item.requested_quantity)-Number(item.issued_quantity),0)} {item.unit}</p></div>{item.details ? <div className="mt-3 rounded-lg bg-[var(--school-background)] p-2.5"><p className="text-[9px] font-black uppercase theme-primary">Item Details</p><p className="mt-1 whitespace-pre-wrap text-[10px] leading-5">{item.details}</p></div> : null}{item.note ? <div className="mt-2 rounded-lg bg-[var(--school-background)] p-2.5"><p className="text-[9px] font-black uppercase theme-primary">Inventory Note</p><p className="mt-1 whitespace-pre-wrap text-[10px] leading-5">{item.note}</p></div> : null}{item.item_note ? <div className="mt-2 rounded-lg border border-[var(--school-border)] p-2.5"><p className="text-[9px] font-black uppercase theme-primary">Requester Item Note</p><p className="mt-1 whitespace-pre-wrap text-[10px] leading-5">{item.item_note}</p></div> : null}</div>)}</div></section>
          {sr.admin_note ? <section className="mt-4 rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-4"><p className="text-[9px] font-black uppercase theme-primary">Admin Note</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{sr.admin_note}</p></section> : null}
        </div></div>

        <div className="sr-print-only sr-a4">
          <div className="sr-a4-header"><div><p className="sr-a4-school">C.T. Model School</p><h1 className="sr-a4-title">Item Service Request</h1></div><div><p className="sr-a4-number">{sr.sr_number}</p><span className={`sr-a4-status ${statusClass(sr.status)}`}>{sr.status.replace(/_/g," ")}</span></div></div>
          <div className="sr-a4-meta"><div className="sr-a4-meta-cell"><span className="sr-a4-label">Requester</span><span className="sr-a4-value">{sr.requester_name || "-"} ({sr.requester_login_id || "-"})</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Date</span><span className="sr-a4-value">{formatDate(sr.requested_at)}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Class / Section</span><span className="sr-a4-value">{sr.class_name || "-"}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Department</span><span className="sr-a4-value">{sr.department || "-"}</span></div></div>
          {sr.request_details ? <div className="sr-a4-request"><strong>Request Details</strong><div>{sr.request_details}</div></div> : null}
          <p className="sr-a4-items-title">Requested Items ({sr.items.length})</p>
          <table className="sr-a4-table"><thead><tr><th className="col-no">#</th><th className="col-item">Item</th><th className="col-spec">Specification / Details</th><th className="col-brand">Brand / Model</th><th className="col-qty">Qty</th><th className="col-stock">Stock</th><th className="col-issued">Issued</th></tr></thead><tbody>{sr.items.map((item,index)=><tr key={item.item_id}><td className="col-no">{index+1}</td><td className="col-item"><div className="sr-a4-item-name">{item.item_name}</div><div className="sr-a4-code">{item.item_code}</div><div className="sr-a4-sub">{item.item_type || "-"} · {item.unit}</div></td><td className="col-spec"><div>{item.specification || "-"}</div>{item.details ? <div className="sr-a4-note">{item.details}</div> : null}{item.note ? <div className="sr-a4-note">{item.note}</div> : null}{item.item_note ? <div className="sr-a4-note">Note: {item.item_note}</div> : null}</td><td className="col-brand">{item.brand || "-"}{item.model ? <div className="sr-a4-sub">{item.model}</div> : null}</td><td className="col-qty">{item.requested_quantity} {item.unit}</td><td className="col-stock">{item.current_stock ?? "-"}</td><td className="col-issued">{item.issued_quantity} / {item.remaining_quantity ?? Math.max(Number(item.requested_quantity)-Number(item.issued_quantity),0)}</td></tr>)}</tbody></table>
          {sr.admin_note ? <div className="sr-a4-admin"><strong>Admin Note</strong><div>{sr.admin_note}</div></div> : null}
          <div className="sr-a4-footer"><span>Requested: {formatDate(sr.requested_at)}</span><span>{sr.processed_at ? `Processed: ${formatDate(sr.processed_at)}` : "C.T. Model School"}</span></div>
        </div>
      </div>
    </div>
  </>;
}
