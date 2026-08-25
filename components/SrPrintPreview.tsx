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
      const W = 210;
      const H = 297;
      const M = 12;
      const contentW = W - M * 2;
      let y = M;

      const setBodyFont = (bold = false, size = 8) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(...dark);
        pdf.setCharSpace(-0.05);
      };
      const text = (value: string, x: number, yy: number, width?: number, size = 8, bold = false, color: [number, number, number] = dark) => {
        setBodyFont(bold, size);
        pdf.setTextColor(...color);
        const lines = width ? pdf.splitTextToSize(value || "-", width) : [value || "-"];
        pdf.text(lines, x, yy, { baseline: "top" });
        return lines.length * (size * 0.42);
      };
      const line = (x1: number, y1: number, x2: number, y2: number, color: [number, number, number] = border, width = 0.25) => {
        pdf.setDrawColor(...color);
        pdf.setLineWidth(width);
        pdf.line(x1, y1, x2, y2);
      };
      const rect = (x: number, yy: number, w: number, h: number, fill?: [number, number, number], stroke: [number, number, number] = border) => {
        if (fill) pdf.setFillColor(...fill);
        pdf.setDrawColor(...stroke);
        pdf.setLineWidth(0.25);
        pdf.rect(x, yy, w, h, fill ? "FD" : "S");
      };

      const logo = await imageToDataUrl(logoUrl);
      if (logo) {
        try {
          pdf.addImage(logo, "PNG", M, y, 16, 16, undefined, "FAST");
        } catch {
          // Keep the document usable if the configured logo is not PDF-compatible.
        }
      }
      const headerLeft = logo ? M + 20 : M;
      const headerRight = W - M - 48;
      setBodyFont(true, 10);
      pdf.setTextColor(...primary);
      pdf.text("C.T. MODEL SCHOOL", W / 2, y + 2, { align: "center", baseline: "top" });
      setBodyFont(false, 17);
      pdf.setTextColor(...dark);
      pdf.text("Item Service Request", W / 2, y + 8, { align: "center", baseline: "top" });
      setBodyFont(true, 9);
      pdf.setTextColor(...primary);
      pdf.text(sr.sr_number, W - M, y + 1, { align: "right", baseline: "top" });
      setBodyFont(false, 7);
      pdf.setTextColor(...muted);
      pdf.text("Service Request", W - M, y + 7, { align: "right", baseline: "top" });
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(217, 119, 6);
      pdf.roundedRect(W - M - 28, y + 11, 28, 6, 3, 3, "S");
      setBodyFont(true, 6.5);
      pdf.setTextColor(146, 64, 14);
      pdf.text(status.toUpperCase(), W - M - 14, y + 12.2, { align: "center", baseline: "top" });
      line(M, y + 20, W - M, y + 20, primary, 0.6);
      y += 25;

      const metaRows = [
        ["Requester", requesterName, "ID", requesterId, "Class", sr.class_name || "-", "Department", sr.department || "-"],
        ["Request Date", formatDate(sr.requested_at), "Email", sr.requester_email || "-", "Phone", sr.requester_phone || "-", "Processed", formatDate(sr.processed_at)],
      ];
      const colW = [23, 47, 12, 36, 18, 25, 24, 15];
      for (const row of metaRows) {
        let x = M;
        const rowHeight = 10;
        for (let i = 0; i < row.length; i += 2) {
          const label = row[i];
          const value = row[i + 1];
          const labelW = colW[i];
          const valueW = colW[i + 1];
          setBodyFont(true, 6.7);
          pdf.setTextColor(...dark);
          pdf.text(`${label}:`, x, y + 2.5, { baseline: "top" });
          setBodyFont(false, 7.2);
          pdf.setTextColor(...dark);
          pdf.text(String(value || "-"), x + labelW, y + 2.5, { baseline: "top", maxWidth: valueW - 1 });
          x += labelW + valueW;
        }
        y += rowHeight;
      }
      line(M, y, W - M, y, [82, 82, 82], 0.3);
      y += 4;

      if (sr.request_details) {
        setBodyFont(true, 7.2);
        pdf.text("Request Details:", M, y, { baseline: "top" });
        const detailH = text(sr.request_details, M + 27, y, contentW - 27, 7.2, false);
        y += Math.max(7, detailH) + 4;
        line(M, y, W - M, y, [82, 82, 82], 0.3);
        y += 4;
      }

      const columns = [
        { title: "NO.", w: 8, align: "center" as const },
        { title: "ITEM", w: 42, align: "left" as const },
        { title: "SPECIFICATION", w: 52, align: "left" as const },
        { title: "BRAND / MODEL", w: 27, align: "left" as const },
        { title: "REQ.", w: 14, align: "center" as const },
        { title: "STOCK", w: 12, align: "center" as const },
        { title: "ISSUED", w: 14, align: "center" as const },
        { title: "NOTE", w: 17, align: "left" as const },
      ];
      const drawTableHeader = () => {
        const h = 9;
        let x = M;
        for (const col of columns) {
          rect(x, y, col.w, h, soft);
          setBodyFont(true, 6.2);
          pdf.setTextColor(...primary);
          const tx = col.align === "center" ? x + col.w / 2 : x + 2;
          pdf.text(col.title, tx, y + 2.2, { align: col.align, baseline: "top" });
          x += col.w;
        }
        y += h;
      };
      drawTableHeader();

      const drawRow = (item: SrItem, index: number) => {
        const values = [
          String(index + 1),
          `${item.item_name || "-"}\n${item.item_code || "-"}`,
          `${item.specification || item.item_type || "-"}${item.details ? `\n${item.details}` : ""}`,
          `${item.brand || "-"}${item.model ? `\n${item.model}` : ""}`,
          `${item.requested_quantity ?? 0} ${item.unit || ""}`,
          String(item.current_stock ?? "-"),
          String(item.issued_quantity ?? 0),
          `${remaining(item)}${item.item_note || item.note ? `\n${item.item_note || item.note}` : ""}`,
        ];
        const fontSize = 7;
        const lineH = 3.3;
        const lineSets = values.map((value, i) => pdf.splitTextToSize(value, columns[i].w - 4));
        const rowH = Math.max(10, ...lineSets.map((lines) => lines.length * lineH + 4));
        if (y + rowH > H - 38) {
          pdf.addPage();
          y = M;
          drawTableHeader();
        }
        let x = M;
        values.forEach((_, i) => {
          rect(x, y, columns[i].w, rowH);
          setBodyFont(i === 1, fontSize);
          pdf.setTextColor(...dark);
          const lines = lineSets[i];
          const tx = columns[i].align === "center" ? x + columns[i].w / 2 : x + 2;
          pdf.text(lines, tx, y + 2, { align: columns[i].align, baseline: "top" });
          if (i === 1 || i === 2 || i === 3 || i === 7) {
            setBodyFont(false, 5.8);
            pdf.setTextColor(...muted);
            if (lines.length > 1) pdf.text(lines.slice(1), tx, y + 2 + lineH, { align: columns[i].align, baseline: "top" });
          }
          x += columns[i].w;
        });
        y += rowH;
      };
      sr.items.forEach(drawRow);

      y += 5;
      const totalQty = sr.items.reduce((sum, item) => sum + Number(item.requested_quantity || 0), 0);
      const totalsW = 42;
      const totalsH = 13;
      rect(W - M - totalsW, y, totalsW, totalsH, undefined, [203, 213, 225]);
      setBodyFont(false, 6.5);
      pdf.setTextColor(...dark);
      pdf.text(`Requested Items: ${sr.items.length}`, W - M - totalsW + 3, y + 3, { baseline: "top" });
      pdf.text(`Total Quantity: ${totalQty}`, W - M - totalsW + 3, y + 8, { baseline: "top" });
      y += totalsH + 8;

      if (sr.admin_note) {
        rect(M, y, contentW, 18, soft, [203, 213, 225]);
        setBodyFont(true, 6.7);
        pdf.setTextColor(...primary);
        pdf.text("ADMIN NOTE", M + 3, y + 2.5, { baseline: "top" });
        text(sr.admin_note, M + 3, y + 7, contentW - 6, 7);
        y += 22;
      }

      if (y > H - 48) {
        pdf.addPage();
        y = M;
      }
      const sigY = Math.min(y + 20, H - 38);
      const gap = 10;
      const sigW = (contentW - gap) / 2;
      line(M, sigY, M + sigW, sigY, [75, 85, 99], 0.35);
      line(M + sigW + gap, sigY, W - M, sigY, [75, 85, 99], 0.35);
      setBodyFont(true, 7);
      pdf.setTextColor(...dark);
      pdf.text("Prepared By", M + sigW / 2, sigY + 2.5, { align: "center", baseline: "top" });
      pdf.text("Approved By", M + sigW + gap + sigW / 2, sigY + 2.5, { align: "center", baseline: "top" });
      setBodyFont(true, 8.2);
      pdf.text(requesterName, M + sigW / 2, sigY + 8, { align: "center", baseline: "top" });
      pdf.text(approverName, M + sigW + gap + sigW / 2, sigY + 8, { align: "center", baseline: "top" });
      setBodyFont(true, 6.3);
      pdf.setTextColor(...primary);
      pdf.text(`ID: ${requesterId}`, M + sigW / 2, sigY + 13, { align: "center", baseline: "top" });
      pdf.text(`ID: ${approverId}`, M + sigW + gap + sigW / 2, sigY + 13, { align: "center", baseline: "top" });
      setBodyFont(false, 5.8);
      pdf.setTextColor(...muted);
      pdf.text(formatDate(sr.requested_at), M + sigW / 2, sigY + 17, { align: "center", baseline: "top" });
      pdf.text(formatDate(sr.processed_at), M + sigW + gap + sigW / 2, sigY + 17, { align: "center", baseline: "top" });

      const footerY = H - 10;
      line(M, footerY - 3, W - M, footerY - 3, [226, 232, 240], 0.25);
      setBodyFont(false, 5.5);
      pdf.setTextColor(...muted);
      pdf.text(`Service Request: ${sr.sr_number}`, M, footerY, { baseline: "top" });
      pdf.text(`Generated: ${formatDate(new Date().toISOString())}`, W - M, footerY, { align: "right", baseline: "top" });

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
    const cleanup = () => {
      document.body.classList.remove("sr-printing");
      setBusy("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    document.body.classList.add("sr-printing");
    window.setTimeout(() => window.print(), 120);
  };

  return (
    <div className="sr-print-overlay fixed inset-0 z-[100] flex flex-col bg-black/60 p-3 sm:p-5">
      <style>{`
        .sr-print-page{width:794px;min-height:1123px;margin:0 auto;padding:42px;background:#fff;color:#111827;font-family:"Aptos Narrow","Arial Narrow",Arial,sans-serif;font-size:9px;line-height:1.45;box-sizing:border-box}
        .sr-print-page *{box-sizing:border-box;font-family:inherit}
        .sr-print-page .sr-print-header{display:flex;align-items:center;gap:12px;border-bottom:2px solid var(--school-primary);padding-bottom:12px}
        .sr-print-logo{width:48px;height:48px;object-fit:contain;flex:none}
        .sr-print-heading{flex:1;text-align:center}
        .sr-print-school{margin:0;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--school-primary)}
        .sr-print-title{margin:3px 0 0;font-size:18px;line-height:1.1;font-weight:500;color:#111827}
        .sr-print-id{width:110px;text-align:right;flex:none}
        .sr-print-id strong{display:block;font-size:10px;line-height:1.35;color:var(--school-primary)}
        .sr-print-id span{display:block;font-size:8px;line-height:1.35;color:#64748b}
        .sr-print-status{display:inline-block!important;margin-top:3px;padding:2px 7px;border:1px solid #d97706;border-radius:999px;font-size:6px!important;line-height:1.25!important;font-weight:800;text-transform:uppercase;color:#92400e!important}
        .sr-print-label{font-weight:800;color:#111827}
        .sr-print-meta{display:grid;grid-template-columns:1.25fr 1.05fr .9fr 1fr;gap:7px 18px;padding:11px 0 9px;border-bottom:1px dashed #555}
        .sr-print-meta div{min-width:0;white-space:normal;overflow:visible;font-size:8.5px;line-height:1.5;overflow-wrap:anywhere}
        .sr-print-details{padding:7px 0 9px;border-bottom:1px dashed #555;font-size:8.5px;line-height:1.5;overflow-wrap:anywhere}
        .sr-print-table-wrap{margin-top:9px;overflow:visible}
        .sr-print-table{width:100%;border-collapse:collapse;table-layout:fixed}
        .sr-print-table th,.sr-print-table td{border:1px solid #9ca3af;padding:5px 5px;vertical-align:top;overflow-wrap:anywhere;line-height:1.35}
        .sr-print-table th{background:var(--school-primary-soft);color:var(--school-primary);font-size:7px;line-height:1.25;text-transform:uppercase;letter-spacing:.02em;text-align:left}
        .sr-print-table td{font-size:8.2px}
        .sr-print-table .c-no{width:4%;text-align:center}.sr-print-table .c-item{width:22%}.sr-print-table .c-spec{width:28%}.sr-print-table .c-brand{width:14%}.sr-print-table .c-qty{width:8%;text-align:center}.sr-print-table .c-stock{width:7%;text-align:center}.sr-print-table .c-issued{width:8%;text-align:center}.sr-print-table .c-note{width:9%}
        .sr-print-sub{display:block;margin-top:2px;font-size:6.5px;line-height:1.35;color:#64748b;overflow-wrap:anywhere}
        .sr-print-totals{display:flex;justify-content:flex-end;margin-top:8px}.sr-print-totals-box{border:1px solid #cbd5e1;padding:6px 9px;font-size:7px;line-height:1.6}.sr-print-totals-box strong{color:var(--school-primary)}
        .sr-print-section{margin-top:10px;border:1px solid #cbd5e1}.sr-print-section-title{padding:5px 7px;background:var(--school-primary-soft);color:var(--school-primary);font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.sr-print-section-body{padding:7px;font-size:8.5px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
        .sr-print-signatures{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:32px}.sr-print-signature{text-align:center;padding-top:3px;border-top:1px solid #4b5563}.sr-print-signature strong{display:block;font-size:8px;line-height:1.4}.sr-print-signature .name{display:block;margin-top:7px;font-size:9px;line-height:1.4;font-weight:900}.sr-print-signature .id{display:block;margin-top:2px;font-size:7px;line-height:1.4;font-weight:800;color:var(--school-primary)}.sr-print-signature small{display:block;margin-top:2px;font-size:6.5px;line-height:1.4;color:#64748b}.sr-print-footer{display:flex;justify-content:space-between;gap:10px;margin-top:18px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:6.5px;line-height:1.4;color:#64748b}
        @media print{
          @page{size:A4 portrait;margin:0}
          html,body{margin:0!important;padding:0!important;background:#fff!important}
          body.sr-printing *{visibility:hidden!important}
          body.sr-printing .sr-print-overlay,body.sr-printing .sr-print-overlay *{visibility:visible!important}
          body.sr-printing .sr-print-overlay{position:static!important;inset:auto!important;display:block!important;padding:0!important;margin:0!important;background:#fff!important;overflow:visible!important}
          body.sr-printing .sr-print-toolbar{display:none!important}
          body.sr-printing .sr-print-scroll{display:block!important;overflow:visible!important;padding:0!important;margin:0!important;background:#fff!important}
          body.sr-printing .sr-print-page{width:210mm!important;min-height:297mm!important;margin:0!important;padding:10mm!important;box-shadow:none!important}
          body.sr-printing .sr-print-table tr{break-inside:avoid;page-break-inside:avoid}
        }
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

      <div className="sr-print-scroll min-h-0 flex-1 overflow-auto rounded-xl bg-slate-500/30 p-3 sm:p-5">
        {loading || !sr ? (
          <div className="mx-auto flex min-h-[70vh] max-w-[794px] items-center justify-center rounded-lg bg-white text-sm text-slate-500">
            {error || "Loading service request..."}
          </div>
        ) : (
          <div ref={pageRef} className="sr-print-page">
            <div className="sr-print-header">
              {logoUrl ? <img src={logoUrl} alt="C.T. Model School" className="sr-print-logo" /> : <div className="sr-print-logo" />}
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
