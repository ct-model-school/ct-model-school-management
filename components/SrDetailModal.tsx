"use client";

import { useEffect, useRef } from "react";

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

function itemRemaining(item: SrDetailItem) {
  return item.remaining_quantity ?? Math.max(Number(item.requested_quantity) - Number(item.issued_quantity), 0);
}

export default function SrDetailModal({
  sr,
  open,
  onClose,
}: {
  sr: SrDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  const printedRef = useRef(false);

  useEffect(() => {
    if (!open || !sr) {
      printedRef.current = false;
      return;
    }
    if (printedRef.current) return;
    printedRef.current = true;

    const previousTitle = document.title;
    document.title = sr.sr_number;

    const handleAfterPrint = () => {
      document.title = previousTitle;
      onClose();
    };
    window.addEventListener("afterprint", handleAfterPrint);

    const timer = window.setTimeout(() => {
      window.print();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.title = previousTitle;
    };
  }, [open, sr, onClose]);

  if (!open || !sr) return null;

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 7mm; }

        .sr-direct-print {
          width: 100%;
          min-height: 100vh;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .sr-a4 {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
          font-size: 8px;
          line-height: 1.25;
        }

        .sr-a4-header {
          position: relative;
          text-align: center;
          border-bottom: 1.5px solid #17233b;
          padding: 0 0 7px;
          margin: 0 0 9px;
        }

        .sr-a4-school {
          margin: 0;
          font-size: 8px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .sr-a4-title {
          margin: 3px 0 0;
          font-size: 16px;
          line-height: 1.05;
          font-weight: 800;
        }

        .sr-a4-number {
          position: absolute;
          right: 0;
          top: 0;
          margin: 0;
          font-size: 8px;
          line-height: 1;
          font-weight: 800;
          text-align: right;
        }

        .sr-a4-status {
          position: absolute;
          right: 0;
          top: 14px;
          display: inline-block;
          padding: 2px 8px;
          border: 1px solid #d97706;
          border-radius: 999px;
          font-size: 6px;
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
        }

        .sr-a4-meta {
          display: grid;
          grid-template-columns: 1.35fr 1.15fr 1fr 1fr;
          gap: 18px;
          width: 100%;
          margin: 0 0 8px;
        }

        .sr-a4-meta-cell {
          min-width: 0;
          display: flex;
          align-items: baseline;
          gap: 7px;
          white-space: nowrap;
        }

        .sr-a4-label {
          font-size: 7px;
          font-weight: 800;
        }

        .sr-a4-value {
          min-width: 0;
          font-size: 8px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sr-a4-request,
        .sr-a4-admin {
          display: flex;
          align-items: baseline;
          gap: 8px;
          border-bottom: 1px dashed #555;
          padding: 0 0 7px;
          margin: 0 0 9px;
        }

        .sr-a4-request strong,
        .sr-a4-admin strong {
          flex: 0 0 auto;
          font-size: 7px;
        }

        .sr-a4-request div,
        .sr-a4-admin div {
          margin: 0;
          font-size: 8px;
          line-height: 1.2;
        }

        .sr-a4-items-title {
          margin: 0 0 7px;
          font-size: 10px;
          line-height: 1;
          font-weight: 800;
        }

        .sr-a4-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .sr-a4-table th,
        .sr-a4-table td {
          border: 1px solid #9ca3af;
          padding: 4px 5px;
          vertical-align: top;
        }

        .sr-a4-table th {
          background: #f8fafc;
          font-size: 7px;
          line-height: 1.1;
          font-weight: 800;
          text-transform: uppercase;
          text-align: left;
        }

        .sr-a4-table td {
          font-size: 8px;
          line-height: 1.25;
        }

        .col-no { width: 3.5%; text-align: center; }
        .col-item { width: 22%; }
        .col-spec { width: 31%; }
        .col-brand { width: 14%; }
        .col-qty { width: 8%; text-align: center; }
        .col-stock { width: 6.5%; text-align: center; }
        .col-issued { width: 7.5%; text-align: center; }
        .col-note { width: 7.5%; }

        .sr-a4-item-name {
          font-size: 9px;
          font-weight: 800;
          line-height: 1.15;
        }

        .sr-a4-code,
        .sr-a4-sub,
        .sr-a4-note {
          margin-top: 2px;
          font-size: 7px;
          line-height: 1.2;
        }

        .sr-a4-code { margin-top: 3px; }

        .sr-a4-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 7px;
        }

        tr { page-break-inside: avoid; break-inside: avoid; }

        @media screen {
          .sr-direct-print {
            min-height: 100vh;
            padding: 24px;
          }
          .sr-a4 {
            max-width: 794px;
            min-height: 1123px;
            margin: 0 auto;
            padding: 42px 48px;
            box-sizing: border-box;
            box-shadow: 0 8px 35px rgba(0,0,0,.12);
          }
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden !important; }
          .sr-direct-print, .sr-direct-print * { visibility: visible !important; }
          .sr-direct-print {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }
          .sr-a4 {
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="sr-direct-print">
        <main className="sr-a4">
          <header className="sr-a4-header">
            <p className="sr-a4-school">C.T. Model School</p>
            <h1 className="sr-a4-title">Item Service Request</h1>
            <p className="sr-a4-number">{sr.sr_number}</p>
            <span className="sr-a4-status">{sr.status.replace(/_/g, " ")}</span>
          </header>

          <section className="sr-a4-meta">
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Requester:</span><span className="sr-a4-value">{sr.requester_name || "-"}</span></div>
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">ID:</span><span className="sr-a4-value">{sr.requester_login_id || "-"}</span></div>
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Class:</span><span className="sr-a4-value">{sr.class_name || "-"}</span></div>
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Department:</span><span className="sr-a4-value">{sr.department || "-"}</span></div>
          </section>

          <section className="sr-a4-meta">
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Request Date:</span><span className="sr-a4-value">{formatDate(sr.requested_at)}</span></div>
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Email:</span><span className="sr-a4-value">{sr.requester_email || "-"}</span></div>
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Phone:</span><span className="sr-a4-value">{sr.requester_phone || "-"}</span></div>
            <div className="sr-a4-meta-cell"><span className="sr-a4-label">Processed:</span><span className="sr-a4-value">{formatDate(sr.processed_at)}</span></div>
          </section>

          {sr.request_details ? (
            <section className="sr-a4-request">
              <strong>Request Details:</strong>
              <div>{sr.request_details}</div>
            </section>
          ) : null}

          <section>
            <h2 className="sr-a4-items-title">Requested Items</h2>
            <table className="sr-a4-table">
              <thead>
                <tr>
                  <th className="col-no">No.</th>
                  <th className="col-item">Item</th>
                  <th className="col-spec">Specification</th>
                  <th className="col-brand">Brand / Model</th>
                  <th className="col-qty">Req.</th>
                  <th className="col-stock">Stock</th>
                  <th className="col-issued">Issued</th>
                  <th className="col-note">Note</th>
                </tr>
              </thead>
              <tbody>
                {sr.items.map((item, index) => (
                  <tr key={item.item_id || `${item.item_code}-${index}`}>
                    <td className="col-no">{index + 1}</td>
                    <td className="col-item">
                      <div className="sr-a4-item-name">{item.item_name || "-"}</div>
                      <div className="sr-a4-code">{item.item_code || "-"}</div>
                      {item.item_type ? <div className="sr-a4-sub">Type: {item.item_type}</div> : null}
                    </td>
                    <td className="col-spec">
                      <div>{item.specification || "-"}</div>
                      {item.details ? <div className="sr-a4-sub">{item.details}</div> : null}
                    </td>
                    <td className="col-brand">
                      <div>{item.brand || "-"}</div>
                      {item.model ? <div className="sr-a4-sub">{item.model}</div> : null}
                    </td>
                    <td className="col-qty">{item.requested_quantity} {item.unit || ""}</td>
                    <td className="col-stock">{item.current_stock ?? "-"}</td>
                    <td className="col-issued">{item.issued_quantity}</td>
                    <td className="col-note">
                      <div>{itemRemaining(item)}</div>
                      {item.item_note || item.note ? <div className="sr-a4-note">{item.item_note || item.note}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {sr.admin_note ? (
            <section className="sr-a4-admin">
              <strong>Admin Note:</strong>
              <div>{sr.admin_note}</div>
            </section>
          ) : null}

          <footer className="sr-a4-footer">
            <span>Service Request: {sr.sr_number}</span>
            <span>Generated: {formatDate(new Date().toISOString())}</span>
          </footer>
        </main>
      </div>
    </>
  );
}
