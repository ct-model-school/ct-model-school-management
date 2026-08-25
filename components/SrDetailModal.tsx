"use client";

import { useEffect } from "react";

type SrDetailItem = {
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
  remaining_quantity?: number | null;
  item_note?: string | null;
};

type SrDetail = {
  sr_number: string;
  requester_name?: string | null;
  requester_login_id?: string | null;
  requester_email?: string | null;
  requester_phone?: string | null;
  class_name?: string | null;
  department?: string | null;
  request_details?: string | null;
  status: string;
  admin_note?: string | null;
  requested_at: string;
  processed_at?: string | null;
  items: SrDetailItem[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusClass = (status: string) => {
  const value = status.toLowerCase();
  return value.includes("reject") || value.includes("cancel")
    ? "text-red-700 bg-red-50 border-red-100"
    : value.includes("pending")
      ? "text-amber-700 bg-amber-50 border-amber-100"
      : "theme-primary bg-[var(--school-primary-soft)] border-[var(--school-primary-border)]";
};

export default function SrDetailModal({
  sr,
  open,
  onClose,
}: {
  sr: SrDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !sr) return null;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .sr-print-overlay,
          .sr-print-overlay * {
            visibility: visible !important;
          }

          /* Remove the screen modal positioning that was creating the large
             blank area at the top of the Chrome print preview. */
          .sr-print-overlay {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            display: block !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }

          .sr-print-modal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          .sr-no-print {
            display: none !important;
          }

          .sr-print-content {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Chrome-friendly print zoom. Normal SRs with ordinary item details
             are intentionally compressed to a single A4 page. */
          .sr-print-area {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            zoom: 0.78;
            font-size: 6.6px !important;
            line-height: 1.15 !important;
          }

          .sr-print-header {
            padding-bottom: 3px !important;
            border-bottom-width: 1px !important;
          }

          .sr-print-header h1 {
            margin: 0 !important;
            font-size: 13px !important;
            line-height: 1 !important;
          }

          .sr-print-header p,
          .sr-print-area p {
            font-size: 6px !important;
            line-height: 1.15 !important;
            margin-top: 1px !important;
          }

          .sr-print-meta {
            margin-top: 3px !important;
            gap: 2px !important;
          }

          .sr-print-meta > div {
            padding: 3px 4px !important;
            border-radius: 3px !important;
          }

          .sr-print-meta p:first-child {
            font-size: 5px !important;
            letter-spacing: 0.08em !important;
          }

          .sr-print-request {
            margin-top: 3px !important;
            padding: 3px 4px !important;
            border-radius: 3px !important;
          }

          .sr-print-items {
            margin-top: 3px !important;
          }

          .sr-print-items-head {
            margin-bottom: 1px !important;
          }

          .sr-print-items-head h3 {
            font-size: 7px !important;
          }

          .sr-print-item {
            padding: 3px 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .sr-print-item-top {
            gap: 3px !important;
          }

          .sr-print-item-top > div:first-child p {
            font-size: 5.2px !important;
          }

          .sr-print-item-top h4 {
            margin: 0 !important;
            font-size: 7px !important;
            line-height: 1.05 !important;
          }

          .sr-print-item-top > span {
            padding: 2px 4px !important;
            font-size: 5.2px !important;
            line-height: 1 !important;
          }

          .sr-print-item-grid {
            margin-top: 2px !important;
            gap: 0 6px !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }

          .sr-print-item-grid p {
            font-size: 5.5px !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .sr-print-item-note {
            margin-top: 2px !important;
            padding: 2px 3px !important;
            border-radius: 2px !important;
          }

          .sr-print-item-note p {
            font-size: 5.3px !important;
            line-height: 1.1 !important;
          }

          .sr-print-admin {
            margin-top: 3px !important;
            padding: 3px 4px !important;
          }

          .sr-print-footer {
            margin-top: 3px !important;
            padding-top: 2px !important;
          }

          .sr-print-footer,
          .sr-print-footer span {
            font-size: 5px !important;
          }
        }
      `}</style>

      <div
        className="sr-print-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-3 sm:p-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="sr-print-modal flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-2xl">
          <header className="sr-no-print flex items-start justify-between gap-4 border-b border-[var(--school-border)] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">
                Service Request Details
              </p>
              <h2 className="mt-1 text-xl font-black">{sr.sr_number}</h2>
              <p className="mt-1 text-xs text-[var(--school-muted)]">
                Complete SR information and requested item details
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl px-4 py-2.5 text-xs font-black theme-primary-bg"
              >
                Print A4
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--school-border)] px-3 py-2.5 text-sm font-bold"
              >
                ×
              </button>
            </div>
          </header>

          <div className="sr-print-content overflow-y-auto p-5 sm:p-7">
            <div className="sr-print-area mx-auto max-w-3xl">
              <div className="sr-print-header flex items-start justify-between gap-4 border-b-2 border-[var(--school-text)] pb-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] theme-primary">
                    C.T. Model School
                  </p>
                  <h1 className="mt-1 text-2xl font-black">Item Service Request</h1>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{sr.sr_number}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(sr.status)}`}
                  >
                    {sr.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="sr-print-meta mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--school-border)] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">
                    Requester
                  </p>
                  <p className="mt-1 text-sm font-bold">{sr.requester_name || "-"}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--school-muted)]">
                    {sr.requester_login_id || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--school-border)] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">
                    Request Date
                  </p>
                  <p className="mt-1 text-sm font-bold">{formatDate(sr.requested_at)}</p>
                </div>
                <div className="rounded-xl border border-[var(--school-border)] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">
                    Class / Section
                  </p>
                  <p className="mt-1 text-sm font-bold">{sr.class_name || "-"}</p>
                </div>
                <div className="rounded-xl border border-[var(--school-border)] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--school-muted)]">
                    Department
                  </p>
                  <p className="mt-1 text-sm font-bold">{sr.department || "-"}</p>
                </div>
              </div>

              {sr.request_details ? (
                <section className="sr-print-request mt-4 rounded-xl border border-[var(--school-border)] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] theme-primary">
                    Request Details
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{sr.request_details}</p>
                </section>
              ) : null}

              <section className="sr-print-items mt-5">
                <div className="sr-print-items-head mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-black">Requested Items</h3>
                  <span className="text-[10px] font-bold text-[var(--school-muted)]">
                    {sr.items.length} item{sr.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--school-border)]">
                  {sr.items.map((item, index) => (
                    <div
                      key={item.item_id}
                      className="sr-print-item break-inside-avoid border-b border-[var(--school-border)] p-4 last:border-b-0"
                    >
                      <div className="sr-print-item-top flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black theme-primary">
                            {index + 1}. {item.item_code}
                          </p>
                          <h4 className="mt-1 text-sm font-black">{item.item_name}</h4>
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-black theme-primary">
                          Requested: {item.requested_quantity} {item.unit}
                        </span>
                      </div>

                      <div className="sr-print-item-grid mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
                        <p><b>Type:</b> {item.item_type || "-"}</p>
                        <p><b>Specification:</b> {item.specification || "-"}</p>
                        <p><b>Brand:</b> {item.brand || "-"}</p>
                        <p><b>Model:</b> {item.model || "-"}</p>
                        <p><b>Unit:</b> {item.unit || "-"}</p>
                        <p><b>Current Stock:</b> {item.current_stock ?? "-"}</p>
                        <p><b>Issued:</b> {item.issued_quantity} {item.unit}</p>
                        <p><b>Remaining:</b> {item.remaining_quantity ?? Math.max(Number(item.requested_quantity) - Number(item.issued_quantity), 0)} {item.unit}</p>
                      </div>

                      {item.details ? (
                        <div className="sr-print-item-note mt-3 rounded-lg bg-[var(--school-background)] p-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] theme-primary">Item Details</p>
                          <p className="mt-1 whitespace-pre-wrap text-[10px] leading-5">{item.details}</p>
                        </div>
                      ) : null}

                      {item.note ? (
                        <div className="sr-print-item-note mt-2 rounded-lg bg-[var(--school-background)] p-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] theme-primary">Inventory Note</p>
                          <p className="mt-1 whitespace-pre-wrap text-[10px] leading-5">{item.note}</p>
                        </div>
                      ) : null}

                      {item.item_note ? (
                        <div className="sr-print-item-note mt-2 rounded-lg border border-[var(--school-border)] p-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] theme-primary">Requester Item Note</p>
                          <p className="mt-1 whitespace-pre-wrap text-[10px] leading-5">{item.item_note}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              {sr.admin_note ? (
                <section className="sr-print-admin mt-4 rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] theme-primary">Admin Note</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{sr.admin_note}</p>
                </section>
              ) : null}

              <div className="sr-print-footer mt-5 border-t border-[var(--school-border)] pt-3 text-[9px] text-[var(--school-muted)]">
                <span>Requested: {formatDate(sr.requested_at)}</span>
                {sr.processed_at ? <span className="ml-4">Processed: {formatDate(sr.processed_at)}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
