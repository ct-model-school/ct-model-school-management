"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type SrItem = {
  item_id?: string;
  item_code?: string;
  item_name?: string;
  item_type?: string | null;
  specification?: string | null;
  brand?: string | null;
  model?: string | null;
  unit?: string | null;
  details?: string | null;
  note?: string | null;
  current_stock?: number | null;
  requested_quantity?: number | null;
  issued_quantity?: number | null;
  remaining_quantity?: number | null;
  item_note?: string | null;
};

type SrData = {
  id?: string;
  sr_number: string;
  requester_name?: string | null;
  requester_login_id?: string | null;
  requester_email?: string | null;
  requester_phone?: string | null;
  class_name?: string | null;
  department?: string | null;
  request_details?: string | null;
  status?: string | null;
  admin_note?: string | null;
  requested_at?: string | null;
  processed_at?: string | null;
  processed_by?: string | null;
  approver_name?: string | null;
  approver_id?: string | null;
  approver_role?: string | null;
  items: SrItem[];
};

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "-";

const remaining = (item: SrItem) =>
  item.remaining_quantity ??
  Math.max(Number(item.requested_quantity || 0) - Number(item.issued_quantity || 0), 0);

export default function SrPrintPreview({
  srNumber,
  open,
  onClose,
  srData,
}: {
  srNumber: string;
  open: boolean;
  onClose: () => void;
  srData?: SrData | null;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [sr, setSr] = useState<SrData | null>(srData ?? null);
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"download" | "print" | "" >("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !srNumber) return;
    let cancelled = false;

    const load = async () => {
      setError("");
      setBusy("");
      setLoading(true);
      try {
        const client = createClient();

        if (srData) {
          setSr({ ...srData, items: Array.isArray(srData.items) ? srData.items : [] });
        } else {
          const token = window.localStorage.getItem("ctms_store_token");
          if (!token) throw new Error("Session expired. Please login again.");
          const { data, error: rpcError } = await client.rpc("store_get_sr", {
            p_token: token,
            p_sr_number: srNumber,
          });
          if (rpcError) throw rpcError;
          if (!data) throw new Error("Service request not found.");
          setSr({ ...data, items: Array.isArray(data.items) ? data.items : [] } as SrData);
        }

        const { data: settings } = await client
          .from("school_settings")
          .select("logo_url")
          .eq("id", 1)
          .maybeSingle();

        if (!cancelled) setLogoUrl(typeof settings?.logo_url === "string" ? settings.logo_url.trim() : "");
      } catch (loadError) {
        if (!cancelled) {
          setSr(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load service request.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, srNumber, srData]);

  if (!open) return null;

  const status = (sr?.status || "pending").replace(/_/g, " ");
  const requesterName = sr?.requester_name || "Requester";
  const requesterId = sr?.requester_login_id || "-";
  const approverName = sr?.approver_name || (sr?.processed_by ? "Administrator" : "Pending Approval");
  const approverId = sr?.approver_id || sr?.processed_by || sr?.approver_role || (sr?.processed_at ? "-" : "Pending");

  const downloadPdf = async () => {
    if (!pageRef.current || !sr) return;
    setBusy("download");
    setError("");

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const element = pageRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      if (imageHeight <= pageHeight + 0.5) {
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, imageHeight, undefined, "FAST");
      } else {
        const pxPerPdfPage = Math.floor((canvas.width * pageHeight) / pageWidth);
        let offsetY = 0;
        let firstPage = true;

        while (offsetY < canvas.height) {
          if (!firstPage) pdf.addPage();
          firstPage = false;

          const sliceHeight = Math.min(pxPerPdfPage, canvas.height - offsetY);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceHeight;
          const context = slice.getContext("2d");
          if (!context) throw new Error("Unable to prepare PDF page.");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, slice.width, slice.height);
          context.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

          const sliceHeightMm = (slice.height * pageWidth) / slice.width;
          pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, pageWidth, sliceHeightMm, undefined, "FAST");
          offsetY += sliceHeight;
        }
      }

      pdf.save(`${sr.sr_number}.pdf`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "PDF generation failed. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const printPdf = () => {
    if (!pageRef.current || !sr) return;
    setBusy("print");
    setError("");

    try {
      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
      if (!printWindow) throw new Error("Print window was blocked by the browser. Please allow pop-ups for this site.");

      const pageHtml = pageRef.current.outerHTML;
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${sr.sr_number}</title><style>
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
        .sr-print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm; background: #fff; box-shadow: none; }
        .sr-print-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .sr-print-table th, .sr-print-table td { break-inside: avoid; }
        img { max-width: 100%; }
        @media print { .sr-print-page { width: 210mm; min-height: 297mm; padding: 10mm; } .sr-print-table tr { break-inside: avoid; } }
      </style></head><body>${pageHtml}</body></html>`);
      printWindow.document.close();

      const doPrint = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setBusy("");
      };

      if (printWindow.document.readyState === "complete") window.setTimeout(doPrint, 250);
      else printWindow.onload = () => window.setTimeout(doPrint, 250);
    } catch (printError) {
      setError(printError instanceof Error ? printError.message : "Unable to open print preview.");
      setBusy("");
    }
  };

  return (
    <div className="sr-print-overlay fixed inset-0 z-[100] flex flex-col bg-black/60 p-3 sm:p-5">
      <style>{`
        .sr-print-page{width:794px;min-height:1123px;margin:0 auto;padding:42px;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.25;box-sizing:border-box}
        .sr-print-page *{box-sizing:border-box}
        .sr-print-page .sr-print-header{display:flex;align-items:center;gap:12px;border-bottom:2px solid var(--school-primary);padding-bottom:12px}
        .sr-print-logo{width:48px;height:48px;object-fit:contain;flex:none}
        .sr-print-heading{flex:1;text-align:center}
        .sr-print-school{margin:0;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--school-primary)}
        .sr-print-title{margin:3px 0 0;font-size:18px;line-height:1.05;font-weight:500;color:#111827}
        .sr-print-id{width:110px;text-align:right;flex:none}
        .sr-print-id strong{display:block;font-size:10px;color:var(--school-primary)}
        .sr-print-id span{font-size:8px;color:#64748b}
        .sr-print-status{display:inline-block;margin-top:3px;padding:2px 7px;border:1px solid #d97706;border-radius:999px;font-size:6px;font-weight:800;text-transform:uppercase;color:#92400e}
        .sr-print-label{font-weight:800;color:#111827}
        .sr-print-meta{display:grid;grid-template-columns:1.25fr 1.05fr .9fr 1fr;gap:8px 18px;padding:10px 0 7px;border-bottom:1px dashed #555}
        .sr-print-meta div{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:8px}
        .sr-print-details{padding:6px 0 8px;border-bottom:1px dashed #555;font-size:8px}
        .sr-print-table-wrap{margin-top:9px;overflow:hidden}
        .sr-print-table{width:100%;border-collapse:collapse;table-layout:fixed}
        .sr-print-table th,.sr-print-table td{border:1px solid #9ca3af;padding:5px 5px;vertical-align:top;overflow-wrap:anywhere}
        .sr-print-table th{background:var(--school-primary-soft);color:var(--school-primary);font-size:7px;text-transform:uppercase;letter-spacing:.02em;text-align:left}
        .sr-print-table td{font-size:8px}
        .sr-print-table .c-no{width:4%;text-align:center}.sr-print-table .c-item{width:22%}.sr-print-table .c-spec{width:28%}.sr-print-table .c-brand{width:14%}.sr-print-table .c-qty{width:8%;text-align:center}.sr-print-table .c-stock{width:7%;text-align:center}.sr-print-table .c-issued{width:8%;text-align:center}.sr-print-table .c-note{width:9%}
        .sr-print-sub{display:block;margin-top:2px;font-size:6.5px;color:#64748b}
        .sr-print-totals{display:flex;justify-content:flex-end;margin-top:8px}.sr-print-totals-box{border:1px solid #cbd5e1;padding:6px 9px;font-size:7px;line-height:1.5}.sr-print-totals-box strong{color:var(--school-primary)}
        .sr-print-section{margin-top:10px;border:1px solid #cbd5e1}.sr-print-section-title{padding:5px 7px;background:var(--school-primary-soft);color:var(--school-primary);font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.sr-print-section-body{padding:7px;font-size:8px;white-space:pre-wrap;overflow-wrap:anywhere}
        .sr-print-signatures{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:32px}.sr-print-signature{text-align:center;padding-top:3px;border-top:1px solid #4b5563}.sr-print-signature strong{display:block;font-size:8px}.sr-print-signature .name{display:block;margin-top:7px;font-size:9px;font-weight:900}.sr-print-signature .id{display:block;margin-top:2px;font-size:7px;font-weight:800;color:var(--school-primary)}.sr-print-signature small{display:block;margin-top:2px;font-size:6.5px;color:#64748b}.sr-print-footer{display:flex;justify-content:space-between;gap:10px;margin-top:18px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:6.5px;color:#64748b}
      `}</style>

      <div className="sr-print-toolbar mb-3 flex shrink-0 items-center justify-between rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 shadow-xl">
        <div>
          <p className="text-xs font-black theme-primary">Print Preview</p>
          <p className="text-[10px] text-[var(--school-muted)]">{srNumber} · Service Request</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void downloadPdf()} disabled={!sr || loading || !!busy} className="rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-2 text-[10px] font-black theme-primary disabled:opacity-50">{busy === "download" ? "Preparing PDF..." : "Download PDF"}</button>
          <button type="button" onClick={printPdf} disabled={!sr || loading || !!busy} className="rounded-lg theme-primary-bg px-3 py-2 text-[10px] font-black text-white disabled:opacity-50">{busy === "print" ? "Opening Print..." : "Print"}</button>
          <button type="button" onClick={onClose} disabled={!!busy} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-[10px] font-bold text-[var(--school-text)]">Close</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-slate-500/30 p-3 sm:p-5">
        {loading || !sr ? (
          <div className="mx-auto flex min-h-[70vh] max-w-[794px] items-center justify-center rounded-lg bg-white text-sm text-slate-500">
            {error || "Loading service request..."}
          </div>
        ) : (
          <div ref={pageRef} className="sr-print-page">
            <div className="sr-print-header">
              {logoUrl ? <img src={logoUrl} alt="C.T. Model School" className="sr-print-logo" crossOrigin="anonymous" /> : <div className="sr-print-logo" />}
              <div className="sr-print-heading"><p className="sr-print-school">C.T. Model School</p><h1 className="sr-print-title">Item Service Request</h1></div>
              <div className="sr-print-id"><strong>{sr.sr_number}</strong><span>Service Request</span><span className="sr-print-status">{status}</span></div>
            </div>

            <div className="sr-print-meta">
              <div><span className="sr-print-label">Requester:</span> {requesterName}</div>
              <div><span className="sr-print-label">ID:</span> {requesterId}</div>
              <div><span className="sr-print-label">Class:</span> {sr.class_name || "-"}</div>
              <div><span className="sr-print-label">Department:</span> {sr.department || "-"}</div>
              <div><span className="sr-print-label">Request Date:</span> {formatDate(sr.requested_at)}</div>
              <div><span className="sr-print-label">Email:</span> {sr.requester_email || "-"}</div>
              <div><span className="sr-print-label">Phone:</span> {sr.requester_phone || "-"}</div>
              <div><span className="sr-print-label">Processed:</span> {formatDate(sr.processed_at)}</div>
            </div>

            {sr.request_details ? <div className="sr-print-details"><span className="sr-print-label">Request Details:</span> {sr.request_details}</div> : null}

            <div className="sr-print-table-wrap">
              <table className="sr-print-table">
                <thead><tr><th className="c-no">No.</th><th className="c-item">Item</th><th className="c-spec">Specification</th><th className="c-brand">Brand / Model</th><th className="c-qty">Req.</th><th className="c-stock">Stock</th><th className="c-issued">Issued</th><th className="c-note">Note</th></tr></thead>
                <tbody>
                  {sr.items.map((item, index) => <tr key={item.item_id || `${item.item_code}-${index}`}>
                    <td className="c-no">{index + 1}</td>
                    <td className="c-item"><strong>{item.item_name || "-"}</strong><span className="sr-print-sub">{item.item_code || "-"}</span></td>
                    <td className="c-spec">{item.specification || item.item_type || "-"}{item.details ? <span className="sr-print-sub">{item.details}</span> : null}</td>
                    <td className="c-brand">{item.brand || "-"}{item.model ? <span className="sr-print-sub">{item.model}</span> : null}</td>
                    <td className="c-qty">{item.requested_quantity ?? 0} {item.unit || ""}</td>
                    <td className="c-stock">{item.current_stock ?? "-"}</td>
                    <td className="c-issued">{item.issued_quantity ?? 0}</td>
                    <td className="c-note">{remaining(item)}{item.item_note || item.note ? <span className="sr-print-sub">{item.item_note || item.note}</span> : null}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div className="sr-print-totals"><div className="sr-print-totals-box">Requested Items: <strong>{sr.items.length}</strong><br />Total Quantity: <strong>{sr.items.reduce((sum, item) => sum + Number(item.requested_quantity || 0), 0)}</strong></div></div>

            {sr.admin_note ? <div className="sr-print-section"><div className="sr-print-section-title">Admin Note</div><div className="sr-print-section-body">{sr.admin_note}</div></div> : null}

            <div className="sr-print-signatures">
              <div className="sr-print-signature"><strong>Prepared By</strong><span className="name">{requesterName}</span><span className="id">ID: {requesterId}</span><small>{formatDate(sr.requested_at)}</small></div>
              <div className="sr-print-signature"><strong>Approved By</strong><span className="name">{approverName}</span><span className="id">ID: {approverId}</span><small>{formatDate(sr.processed_at)}</small></div>
            </div>

            <div className="sr-print-footer"><span>Service Request: {sr.sr_number}</span><span>Generated: {formatDate(new Date().toISOString())}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
