"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

const hexColor = (value: string, fallback: [number, number, number]) => {
  const match = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return fallback;
  const hex = match[1];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)] as [number, number, number];
};

const imageToDataUrl = async (url: string) => {
  if (!url) return "";
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return "";
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
};

const PRINT_STYLES = `
  *{box-sizing:border-box}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  body{font-family:"Aptos Narrow","Arial Narrow",Aptos,Arial,sans-serif;color:#111827}
  .sr-print-page{width:210mm;min-height:297mm;margin:0 auto;padding:10mm;background:#fff;color:#111827;font-family:"Aptos Narrow","Arial Narrow",Aptos,Arial,sans-serif;font-size:9px;line-height:1.4;box-sizing:border-box}
  .sr-print-page *{box-sizing:border-box;font-family:inherit}
  .sr-print-header{display:flex;align-items:center;gap:12px;border-bottom:2px solid var(--school-primary,#1f3a67);padding-bottom:10px}
  .sr-print-logo{width:48px;height:48px;object-fit:contain;flex:none}
  .sr-print-heading{flex:1;text-align:center;min-width:0}
  .sr-print-school{margin:0;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--school-primary,#1f3a67)}
  .sr-print-title{margin:3px 0 0;font-size:18px;line-height:1.1;font-weight:500;color:#111827}
  .sr-print-id{width:112px;text-align:right;flex:none}
  .sr-print-id strong{display:block;font-size:10px;line-height:1.25;color:var(--school-primary,#1f3a67)}
  .sr-print-id span{display:block;font-size:8px;line-height:1.3;color:#64748b}
  .sr-print-status{display:inline-block!important;margin-top:3px;padding:2px 7px;border:1px solid #d97706;border-radius:999px;font-size:6px!important;line-height:1.2!important;font-weight:800;text-transform:uppercase;color:#92400e!important}
  .sr-print-label{font-weight:800;color:#111827}
  .sr-print-meta{display:grid;grid-template-columns:1.25fr 1.05fr .9fr 1fr;gap:6px 14px;padding:9px 0 7px;border-bottom:1px dashed #555}
  .sr-print-meta div{min-width:0;font-size:8px;line-height:1.45;overflow-wrap:anywhere}
  .sr-print-details{padding:6px 0 8px;border-bottom:1px dashed #555;font-size:8px;line-height:1.45;overflow-wrap:anywhere}
  .sr-print-table-wrap{margin-top:8px}
  .sr-print-table{width:100%;border-collapse:collapse;table-layout:fixed}
  .sr-print-table th,.sr-print-table td{border:1px solid #9ca3af;padding:4px 4px;vertical-align:top;overflow-wrap:anywhere;line-height:1.3}
  .sr-print-table th{background:var(--school-primary-soft,#ebf0f8);color:var(--school-primary,#1f3a67);font-size:6.7px;line-height:1.2;text-transform:uppercase;letter-spacing:.02em;text-align:left}
  .sr-print-table td{font-size:7.8px}
  .sr-print-table .c-no{width:4%;text-align:center}.sr-print-table .c-item{width:22%}.sr-print-table .c-spec{width:28%}.sr-print-table .c-brand{width:14%}.sr-print-table .c-qty{width:8%;text-align:center}.sr-print-table .c-stock{width:7%;text-align:center}.sr-print-table .c-issued{width:8%;text-align:center}.sr-print-table .c-note{width:9%}
  .sr-print-sub{display:block;margin-top:1px;font-size:6.2px;line-height:1.3;color:#64748b;overflow-wrap:anywhere}
  .sr-print-totals{display:flex;justify-content:flex-end;margin-top:7px}.sr-print-totals-box{border:1px solid #cbd5e1;padding:5px 8px;font-size:6.8px;line-height:1.5}.sr-print-totals-box strong{color:var(--school-primary,#1f3a67)}
  .sr-print-section{margin-top:8px;border:1px solid #cbd5e1}.sr-print-section-title{padding:4px 6px;background:var(--school-primary-soft,#ebf0f8);color:var(--school-primary,#1f3a67);font-size:6.8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.sr-print-section-body{padding:6px;font-size:8px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
  .sr-print-signatures{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:28px}.sr-print-signature{text-align:center;padding-top:3px;border-top:1px solid #4b5563}.sr-print-signature strong{display:block;font-size:7.5px;line-height:1.3}.sr-print-signature .name{display:block;margin-top:6px;font-size:8.5px;line-height:1.3;font-weight:900}.sr-print-signature .id{display:block;margin-top:2px;font-size:6.5px;line-height:1.3;font-weight:800;color:var(--school-primary,#1f3a67)}.sr-print-signature small{display:block;margin-top:2px;font-size:6px;line-height:1.3;color:#64748b}.sr-print-footer{display:flex;justify-content:space-between;gap:10px;margin-top:15px;padding-top:5px;border-top:1px solid #e2e8f0;font-size:6px;line-height:1.3;color:#64748b}
  @page{size:A4 portrait;margin:0}
  @media print{html,body{width:210mm!important;min-width:210mm!important;background:#fff!important}body{margin:0!important;padding:0!important}.sr-print-page{width:210mm!important;min-height:297mm!important;margin:0 auto!important;padding:10mm!important;box-shadow:none!important}.sr-print-toolbar{display:none!important}.sr-print-scroll{display:block!important;overflow:visible!important;padding:0!important;margin:0!important;background:#fff!important}.sr-print-table tr{break-inside:avoid;page-break-inside:avoid}}
`;

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
  const [busy, setBusy] = useState<"download" | "print" | "">("");
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
          const { data, error: rpcError } = await client.rpc("store_get_sr", { p_token: token, p_sr_number: srNumber });
          if (rpcError) throw rpcError;
          if (!data) throw new Error("Service request not found.");
          setSr({ ...data, items: Array.isArray(data.items) ? data.items : [] } as SrData);
        }
        const { data: settings } = await client.from("school_settings").select("logo_url").eq("id", 1).maybeSingle();
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
    return () => { cancelled = true; };
  }, [open, srNumber, srData]);

  if (!open) return null;

  const status = (sr?.status || "pending").replace(/_/g, " ");
  const requesterName = sr?.requester_name || "Requester";
  const requesterId = sr?.requester_login_id || "-";
  const approverName = sr?.approver_name || (sr?.processed_by ? "Administrator" : "Pending Approval");
  const approverId = sr?.approver_id || sr?.processed_by || sr?.approver_role || (sr?.processed_at ? "-" : "Pending");

  const downloadPdf = async () => {
    if (!sr) return;
    setBusy("download");
    setError("");
    try {
      const rootStyle = getComputedStyle(document.documentElement);
      const primary = hexColor(rootStyle.getPropertyValue("--school-primary"), [31, 58, 103]);
      const soft = hexColor(rootStyle.getPropertyValue("--school-primary-soft"), [235, 240, 248]);
      const border: [number, number, number] = [156, 163, 175];
      const muted: [number, number, number] = [100, 116, 139];
      const dark: [number, number, number] = [17, 24, 39];
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const W = 210, H = 297, M = 12, contentW = W - M * 2;
      let y = M;
      const font = (bold = false, size = 8, color = dark) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
      };
      const wrap = (value: string, width: number, size = 8) => {
        font(false, size);
        return pdf.splitTextToSize(value || "-", width);
      };
      const rule = (x1: number, y1: number, x2: number, y2: number, color: [number, number, number] = border, width = 0.25) => {
        pdf.setDrawColor(...color); pdf.setLineWidth(width); pdf.line(x1, y1, x2, y2);
      };
      const box = (x: number, yy: number, w: number, h: number, fill?: [number, number, number], stroke: [number, number, number] = border) => {
        if (fill) pdf.setFillColor(...fill);
        pdf.setDrawColor(...stroke); pdf.setLineWidth(0.25); pdf.rect(x, yy, w, h, fill ? "FD" : "S");
      };

      const logo = await imageToDataUrl(logoUrl);
      if (logo) { try { pdf.addImage(logo, "PNG", M, y, 16, 16, undefined, "FAST"); } catch {} }
      font(true, 10, primary); pdf.text("C.T. MODEL SCHOOL", W / 2, y + 2, { align: "center", baseline: "top" });
      font(false, 17, dark); pdf.text("Item Service Request", W / 2, y + 8, { align: "center", baseline: "top" });
      font(true, 9, primary); pdf.text(sr.sr_number, W - M, y + 1, { align: "right", baseline: "top" });
      font(false, 7, muted); pdf.text("Service Request", W - M, y + 7, { align: "right", baseline: "top" });
      pdf.setDrawColor(217,119,6); pdf.roundedRect(W - M - 28, y + 11, 28, 6, 3, 3, "S");
      font(true, 6.5, [146,64,14]); pdf.text(status.toUpperCase(), W - M - 14, y + 12.2, { align: "center", baseline: "top" });
      rule(M, y + 20, W - M, y + 20, primary, 0.6); y += 25;

      const meta = [
        ["Requester", requesterName, "ID", requesterId, "Class", sr.class_name || "-", "Department", sr.department || "-"],
        ["Request Date", formatDate(sr.requested_at), "Email", sr.requester_email || "-", "Phone", sr.requester_phone || "-", "Processed", formatDate(sr.processed_at)],
      ];
      const metaWidths = [23,47,12,36,18,25,24,15];
      for (const row of meta) {
        let x = M;
        for (let i = 0; i < row.length; i += 2) {
          font(true, 6.6, dark); pdf.text(`${row[i]}:`, x, y + 2.5, { baseline: "top" });
          font(false, 7.1, dark);
          const lines = wrap(String(row[i + 1] || "-"), metaWidths[i + 1] - 1, 7.1);
          pdf.text(lines[0], x + metaWidths[i], y + 2.5, { baseline: "top" });
          x += metaWidths[i] + metaWidths[i + 1];
        }
        y += 9;
      }
      rule(M, y, W - M, y, [82,82,82], 0.3); y += 4;

      if (sr.request_details) {
        font(true, 7.2, dark); pdf.text("Request Details:", M, y, { baseline: "top" });
        const lines = wrap(sr.request_details, contentW - 28, 7.2);
        font(false, 7.2, dark); pdf.text(lines, M + 28, y, { baseline: "top" });
        y += Math.max(7, lines.length * 3.1) + 4;
        rule(M, y, W - M, y, [82,82,82], 0.3); y += 4;
      }

      const columns = [
        { title:"NO.", w:8, center:true }, { title:"ITEM", w:42, center:false }, { title:"SPECIFICATION", w:52, center:false },
        { title:"BRAND / MODEL", w:27, center:false }, { title:"REQ.", w:14, center:true }, { title:"STOCK", w:12, center:true },
        { title:"ISSUED", w:14, center:true }, { title:"NOTE", w:17, center:false },
      ];
      const drawHeader = () => {
        let x = M;
        for (const col of columns) {
          box(x, y, col.w, 9, soft);
          font(true, 6.2, primary);
          pdf.text(col.title, col.center ? x + col.w/2 : x + 2, y + 2.2, { align: col.center ? "center" : "left", baseline: "top" });
          x += col.w;
        }
        y += 9;
      };
      drawHeader();

      sr.items.forEach((item, index) => {
        const values = [
          String(index + 1),
          item.item_name || "-",
          item.specification || item.item_type || "-",
          item.brand || "-",
          `${item.requested_quantity ?? 0} ${item.unit || ""}`.trim(),
          String(item.current_stock ?? "-"),
          String(item.issued_quantity ?? 0),
          String(remaining(item)),
        ];
        const subs = [
          "",
          item.item_code || "",
          item.details || "",
          item.model || "",
          "",
          "",
          "",
          item.item_note || item.note || "",
        ];
        const lines = values.map((value, i) => wrap(value, columns[i].w - 4, 7));
        const subLines = subs.map((value, i) => value ? wrap(value, columns[i].w - 4, 5.8) : []);
        const rowH = Math.max(10, ...lines.map((ls, i) => (ls.length + subLines[i].length) * 3.1 + 3.5));
        if (y + rowH > H - 45) { pdf.addPage(); y = M; drawHeader(); }
        let x = M;
        columns.forEach((col, i) => {
          box(x, y, col.w, rowH);
          font(i === 1, 7, dark);
          pdf.text(lines[i], col.center ? x + col.w/2 : x + 2, y + 2, { align: col.center ? "center" : "left", baseline: "top" });
          if (subLines[i].length) {
            font(false, 5.8, muted);
            pdf.text(subLines[i], col.center ? x + col.w/2 : x + 2, y + 2 + lines[i].length * 3.1, { align: col.center ? "center" : "left", baseline: "top" });
          }
          x += col.w;
        });
        y += rowH;
      });

      y += 5;
      const totalQty = sr.items.reduce((sum, item) => sum + Number(item.requested_quantity || 0), 0);
      box(W - M - 42, y, 42, 13, undefined, [203,213,225]);
      font(false, 6.5, dark); pdf.text(`Requested Items: ${sr.items.length}`, W - M - 39, y + 3, { baseline: "top" });
      pdf.text(`Total Quantity: ${totalQty}`, W - M - 39, y + 8, { baseline: "top" }); y += 21;

      if (sr.admin_note) {
        const noteLines = wrap(sr.admin_note, contentW - 6, 7);
        const noteH = 10 + noteLines.length * 3.1;
        box(M, y, contentW, noteH, soft, [203,213,225]);
        font(true, 6.7, primary); pdf.text("ADMIN NOTE", M + 3, y + 2.5, { baseline: "top" });
        font(false, 7, dark); pdf.text(noteLines, M + 3, y + 7, { baseline: "top" }); y += noteH + 5;
      }

      if (y > H - 55) { pdf.addPage(); y = M; }
      const sigY = Math.min(y + 18, H - 42), gap = 10, sigW = (contentW - gap) / 2;
      rule(M, sigY, M + sigW, sigY, [75,85,99], 0.35); rule(M + sigW + gap, sigY, W - M, sigY, [75,85,99], 0.35);
      font(true, 7, dark); pdf.text("Prepared By", M + sigW/2, sigY + 2.5, { align:"center", baseline:"top" }); pdf.text("Approved By", M + sigW + gap + sigW/2, sigY + 2.5, { align:"center", baseline:"top" });
      font(true, 8.2, dark); pdf.text(requesterName, M + sigW/2, sigY + 8, { align:"center", baseline:"top" }); pdf.text(approverName, M + sigW + gap + sigW/2, sigY + 8, { align:"center", baseline:"top" });
      font(true, 6.3, primary); pdf.text(`ID: ${requesterId}`, M + sigW/2, sigY + 13, { align:"center", baseline:"top" }); pdf.text(`ID: ${approverId}`, M + sigW + gap + sigW/2, sigY + 13, { align:"center", baseline:"top" });
      font(false, 5.8, muted); pdf.text(formatDate(sr.requested_at), M + sigW/2, sigY + 17, { align:"center", baseline:"top" }); pdf.text(formatDate(sr.processed_at), M + sigW + gap + sigW/2, sigY + 17, { align:"center", baseline:"top" });
      rule(M, H - 13, W - M, H - 13, [226,232,240], 0.25); font(false, 5.5, muted); pdf.text(`Service Request: ${sr.sr_number}`, M, H - 10, { baseline:"top" }); pdf.text(`Generated: ${formatDate(new Date().toISOString())}`, W - M, H - 10, { align:"right", baseline:"top" });
      pdf.save(`${sr.sr_number}.pdf`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "PDF generation failed. Please try again.");
    } finally { setBusy(""); }
  };

  const printPdf = async () => {
    if (!pageRef.current || !sr) return;
    setBusy("print");
    setError("");
    try {
      const printWindow = window.open("", "_blank", "width=900,height=1200");
      if (!printWindow) throw new Error("Print window was blocked by the browser. Please allow pop-ups for this site.");
      const pageHtml = pageRef.current.outerHTML;
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${sr.sr_number}</title><style>${PRINT_STYLES}</style></head><body><div class="sr-print-scroll">${pageHtml}</div></body></html>`);
      printWindow.document.close();
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        if (printWindow.document.readyState === "complete") window.setTimeout(done, 150);
        else printWindow.onload = () => window.setTimeout(done, 150);
      });
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => printWindow.close(), 500);
    } catch (printError) {
      setError(printError instanceof Error ? printError.message : "Unable to open print preview.");
    } finally { setBusy(""); }
  };

  return (
    <div className="sr-print-overlay fixed inset-0 z-[100] flex flex-col bg-black/60 p-3 sm:p-5">
      <style>{PRINT_STYLES}</style>
      <div className="sr-print-toolbar mb-3 flex shrink-0 items-center justify-between rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 shadow-xl">
        <div><p className="text-xs font-black theme-primary">Print Preview</p><p className="text-[10px] text-[var(--school-muted)]">{srNumber} · Service Request</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void downloadPdf()} disabled={!sr || loading || !!busy} className="rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-2 text-[10px] font-black theme-primary disabled:opacity-50">{busy === "download" ? "Preparing PDF..." : "Download PDF"}</button>
          <button type="button" onClick={() => void printPdf()} disabled={!sr || loading || !!busy} className="rounded-lg theme-primary-bg px-3 py-2 text-[10px] font-black text-white disabled:opacity-50">{busy === "print" ? "Opening Print..." : "Print"}</button>
          <button type="button" onClick={onClose} disabled={!!busy} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-[10px] font-bold text-[var(--school-text)]">Close</button>
        </div>
      </div>
      <div className="sr-print-scroll min-h-0 flex-1 overflow-auto rounded-xl bg-slate-500/30 p-3 sm:p-5">
        {loading || !sr ? (
          <div className="mx-auto flex min-h-[70vh] max-w-[794px] items-center justify-center rounded-lg bg-white text-sm text-slate-500">{error || "Loading service request..."}</div>
        ) : (
          <div ref={pageRef} className="sr-print-page">
            <div className="sr-print-header">
              {logoUrl ? <img src={logoUrl} alt="C.T. Model School" className="sr-print-logo" /> : <div className="sr-print-logo" />}
              <div className="sr-print-heading"><p className="sr-print-school">C.T. Model School</p><h1 className="sr-print-title">Item Service Request</h1></div>
              <div className="sr-print-id"><strong>{sr.sr_number}</strong><span>Service Request</span><span className="sr-print-status">{status}</span></div>
            </div>
            <div className="sr-print-meta">
              <div><span className="sr-print-label">Requester:</span> {requesterName}</div><div><span className="sr-print-label">ID:</span> {requesterId}</div><div><span className="sr-print-label">Class:</span> {sr.class_name || "-"}</div><div><span className="sr-print-label">Department:</span> {sr.department || "-"}</div>
              <div><span className="sr-print-label">Request Date:</span> {formatDate(sr.requested_at)}</div><div><span className="sr-print-label">Email:</span> {sr.requester_email || "-"}</div><div><span className="sr-print-label">Phone:</span> {sr.requester_phone || "-"}</div><div><span className="sr-print-label">Processed:</span> {formatDate(sr.processed_at)}</div>
            </div>
            {sr.request_details ? <div className="sr-print-details"><span className="sr-print-label">Request Details:</span> {sr.request_details}</div> : null}
            <div className="sr-print-table-wrap"><table className="sr-print-table"><thead><tr><th className="c-no">No.</th><th className="c-item">Item</th><th className="c-spec">Specification</th><th className="c-brand">Brand / Model</th><th className="c-qty">Req.</th><th className="c-stock">Stock</th><th className="c-issued">Issued</th><th className="c-note">Note</th></tr></thead><tbody>
              {sr.items.map((item, index) => <tr key={item.item_id || `${item.item_code}-${index}`}><td className="c-no">{index + 1}</td><td className="c-item"><strong>{item.item_name || "-"}</strong><span className="sr-print-sub">{item.item_code || "-"}</span></td><td className="c-spec">{item.specification || item.item_type || "-"}{item.details ? <span className="sr-print-sub">{item.details}</span> : null}</td><td className="c-brand">{item.brand || "-"}{item.model ? <span className="sr-print-sub">{item.model}</span> : null}</td><td className="c-qty">{item.requested_quantity ?? 0} {item.unit || ""}</td><td className="c-stock">{item.current_stock ?? "-"}</td><td className="c-issued">{item.issued_quantity ?? 0}</td><td className="c-note">{remaining(item)}{item.item_note || item.note ? <span className="sr-print-sub">{item.item_note || item.note}</span> : null}</td></tr>)}
            </tbody></table></div>
            <div className="sr-print-totals"><div className="sr-print-totals-box">Requested Items: <strong>{sr.items.length}</strong><br />Total Quantity: <strong>{sr.items.reduce((sum, item) => sum + Number(item.requested_quantity || 0), 0)}</strong></div></div>
            {sr.admin_note ? <div className="sr-print-section"><div className="sr-print-section-title">Admin Note</div><div className="sr-print-section-body">{sr.admin_note}</div></div> : null}
            <div className="sr-print-signatures"><div className="sr-print-signature"><strong>Prepared By</strong><span className="name">{requesterName}</span><span className="id">ID: {requesterId}</span><small>{formatDate(sr.requested_at)}</small></div><div className="sr-print-signature"><strong>Approved By</strong><span className="name">{approverName}</span><span className="id">ID: {approverId}</span><small>{formatDate(sr.processed_at)}</small></div></div>
            <div className="sr-print-footer"><span>Service Request: {sr.sr_number}</span><span>Generated: {formatDate(new Date().toISOString())}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
