"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

type SrDetailItem = { item_id: string; item_code: string; item_name: string; item_type?: string | null; specification?: string | null; brand?: string | null; model?: string | null; unit: string; details?: string | null; note?: string | null; current_stock?: number | null; requested_quantity: number; issued_quantity: number; remaining_quantity?: number | null; item_note?: string | null };
type SrDetail = { sr_number: string; requester_name?: string | null; requester_login_id?: string | null; requester_email?: string | null; requester_phone?: string | null; class_name?: string | null; department?: string | null; request_details?: string | null; status: string; admin_note?: string | null; requested_at: string; processed_at?: string | null; processed_by?: string | null; approver_name?: string | null; approver_id?: string | null; approver_role?: string | null; items: SrDetailItem[] };

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "-";
const remaining = (item: SrDetailItem) => item.remaining_quantity ?? Math.max(Number(item.requested_quantity) - Number(item.issued_quantity), 0);

export default function SrDetailModal({ sr, open, onClose }: { sr: SrDetail | null; open: boolean; onClose: () => void }) {
  const previewRef = useRef<HTMLElement | null>(null);
  const [schoolLogo, setSchoolLogo] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!open || !sr) { setSchoolLogo(""); setBusy(""); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await createClient().from("school_settings").select("logo_url").eq("id", 1).maybeSingle();
        if (!cancelled) setSchoolLogo(typeof data?.logo_url === "string" ? data.logo_url.trim() : "");
      } catch { if (!cancelled) setSchoolLogo(""); }
    };
    void load();
    return () => { cancelled = true; };
  }, [open, sr]);

  if (!open || !sr) return null;
  const currentSr = sr;

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setBusy("download");
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pw - w) / 2, 0, w, h, undefined, "FAST");
      pdf.save(`${currentSr.sr_number}.pdf`);
    } finally { setBusy(""); }
  };

  const printPdf = () => { setBusy("print"); window.setTimeout(() => { window.print(); setBusy(""); }, 80); };

  return (
    <>
      <style>{`@page{size:A4 portrait;margin:7mm}.sr-preview-overlay{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#eef1f5}.sr-preview-toolbar{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:#fff;border-bottom:1px solid #d5dbe3}.sr-preview-actions{display:flex;align-items:center;gap:8px}.sr-preview-btn{border:1px solid #d0d7e2;border-radius:9px;padding:9px 15px;font-size:13px;font-weight:800;cursor:pointer;background:#fff;color:#17233b}.sr-preview-btn.primary{background:var(--school-primary);border-color:var(--school-primary);color:#fff}.sr-preview-btn:disabled{opacity:.55;cursor:wait}.sr-preview-scroll{flex:1;overflow:auto;padding:24px}.sr-a4{width:100%;max-width:794px;min-height:1123px;margin:0 auto;padding:42px 48px;background:#fff;color:#111;font:8px/1.25 Arial,Helvetica,sans-serif;box-sizing:border-box;box-shadow:0 8px 35px rgba(0,0,0,.12)}.sr-a4-header{position:relative;text-align:center;border-bottom:1.5px solid var(--school-primary);padding-bottom:7px;margin-bottom:9px}.sr-a4-brand{display:flex;align-items:center;justify-content:center;gap:10px;min-height:44px}.sr-a4-logo{width:46px;height:46px;object-fit:contain}.sr-a4-school{margin:0;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.sr-a4-title{margin:3px 0 0;font-size:16px;line-height:1.05}.sr-a4-number{position:absolute;right:0;top:0;margin:0;font-size:8px;font-weight:800}.sr-a4-status{position:absolute;right:0;top:14px;padding:2px 8px;border:1px solid #d97706;border-radius:999px;font-size:6px;font-weight:700;text-transform:uppercase}.sr-a4-meta{display:grid;grid-template-columns:1.35fr 1.15fr 1fr 1fr;gap:18px;margin-bottom:8px}.sr-a4-meta-cell{display:flex;gap:7px;min-width:0;align-items:baseline;white-space:nowrap}.sr-a4-label{font-size:7px;font-weight:800}.sr-a4-value{font-size:8px;overflow:hidden;text-overflow:ellipsis}.sr-a4-request,.sr-a4-admin{display:flex;gap:8px;border-bottom:1px dashed #555;padding-bottom:7px;margin-bottom:9px}.sr-a4-table{width:100%;border-collapse:collapse;table-layout:fixed}.sr-a4-table th,.sr-a4-table td{border:1px solid #9ca3af;padding:4px 5px;vertical-align:top}.sr-a4-table th{background:var(--school-primary-soft);color:var(--school-primary);font-size:7px;text-transform:uppercase}.sr-a4-table td{font-size:8px}.col-no{width:3.5%;text-align:center}.col-item{width:22%}.col-spec{width:31%}.col-brand{width:14%}.col-qty{width:8%;text-align:center}.col-stock{width:6.5%;text-align:center}.col-issued{width:7.5%;text-align:center}.col-note{width:7.5%}.sr-a4-signatures{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:18px}.sr-a4-signatures>div{min-height:48px;padding-top:12px;border-top:1px solid #555;text-align:center;font-size:7px}.sr-a4-signatures strong,.sr-a4-signatures span,.sr-a4-signatures small{display:block}.sr-a4-signatures span{margin-top:3px;font-size:8px;font-weight:800}.sr-a4-footer{display:flex;justify-content:space-between;margin-top:8px;font-size:7px}@media print{html,body{margin:0!important;padding:0!important;background:#fff!important}body *{visibility:hidden!important}.sr-direct-print,.sr-direct-print *{visibility:visible!important}.sr-preview-overlay{position:static!important;display:block!important;background:#fff!important}.sr-preview-toolbar{display:none!important}.sr-preview-scroll{overflow:visible!important;padding:0!important}.sr-a4{width:100%!important;max-width:none!important;min-height:auto!important;margin:0!important;padding:0!important;box-shadow:none!important}}`}</style>
      <div className="sr-preview-overlay">
        <div className="sr-preview-toolbar"><div><div style={{fontSize:12,fontWeight:800,color:"#667085"}}>SERVICE REQUEST PREVIEW</div><div style={{fontSize:16,fontWeight:900,color:"#17233b"}}>{currentSr.sr_number}</div></div><div className="sr-preview-actions"><button className="sr-preview-btn" onClick={onClose} disabled={!!busy}>Close</button><button className="sr-preview-btn" onClick={() => void downloadPdf()} disabled={!!busy}>{busy === "download" ? "Downloading..." : "Download PDF"}</button><button className="sr-preview-btn primary" onClick={printPdf} disabled={!!busy}>{busy === "print" ? "Opening Print..." : "Print"}</button></div></div>
        <div className="sr-preview-scroll"><div className="sr-direct-print"><main className="sr-a4" ref={node => { previewRef.current = node; }}>
          <header className="sr-a4-header"><div className="sr-a4-brand">{schoolLogo ? <img src={schoolLogo} alt="C.T. Model School logo" className="sr-a4-logo" crossOrigin="anonymous" /> : null}<div><p className="sr-a4-school">C.T. Model School</p><h1 className="sr-a4-title">Item Service Request</h1></div></div><p className="sr-a4-number">{currentSr.sr_number}</p><span className="sr-a4-status">{currentSr.status.replace(/_/g," ")}</span></header>
          <section className="sr-a4-meta"><div className="sr-a4-meta-cell"><span className="sr-a4-label">Requester:</span><span className="sr-a4-value">{currentSr.requester_name || "-"}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">ID:</span><span className="sr-a4-value">{currentSr.requester_login_id || "-"}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Class:</span><span className="sr-a4-value">{currentSr.class_name || "-"}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Department:</span><span className="sr-a4-value">{currentSr.department || "-"}</span></div></section>
          <section className="sr-a4-meta"><div className="sr-a4-meta-cell"><span className="sr-a4-label">Request Date:</span><span className="sr-a4-value">{formatDate(currentSr.requested_at)}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Email:</span><span className="sr-a4-value">{currentSr.requester_email || "-"}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Phone:</span><span className="sr-a4-value">{currentSr.requester_phone || "-"}</span></div><div className="sr-a4-meta-cell"><span className="sr-a4-label">Processed:</span><span className="sr-a4-value">{formatDate(currentSr.processed_at)}</span></div></section>
          {currentSr.request_details ? <section className="sr-a4-request"><strong>Request Details:</strong><div>{currentSr.request_details}</div></section> : null}
          <table className="sr-a4-table"><thead><tr><th className="col-no">No.</th><th className="col-item">Item</th><th className="col-spec">Specification</th><th className="col-brand">Brand / Model</th><th className="col-qty">Req.</th><th className="col-stock">Stock</th><th className="col-issued">Issued</th><th className="col-note">Note</th></tr></thead><tbody>{currentSr.items.map((item,index)=><tr key={item.item_id || `${item.item_code}-${index}`}><td className="col-no">{index+1}</td><td className="col-item"><strong>{item.item_name || "-"}</strong><div>{item.item_code || "-"}</div></td><td className="col-spec"><div>{item.specification || "-"}</div>{item.details ? <small>{item.details}</small> : null}</td><td className="col-brand"><div>{item.brand || "-"}</div>{item.model ? <small>{item.model}</small> : null}</td><td className="col-qty">{item.requested_quantity} {item.unit}</td><td className="col-stock">{item.current_stock ?? "-"}</td><td className="col-issued">{item.issued_quantity}</td><td className="col-note">{remaining(item)}{item.item_note || item.note ? <small>{item.item_note || item.note}</small> : null}</td></tr>)}</tbody></table>
          {currentSr.admin_note ? <section className="sr-a4-admin"><strong>Admin Note:</strong><div>{currentSr.admin_note}</div></section> : null}
          <section className="sr-a4-signatures"><div><strong>Prepared By</strong><span>{currentSr.requester_name || "Requester"}</span><small>ID: {currentSr.requester_login_id || "-"}</small><small>{formatDate(currentSr.requested_at)}</small></div><div><strong>Approved By</strong><span>{currentSr.approver_name || (currentSr.processed_by ? "Administrator" : "Pending Approval")}</span><small>ID: {currentSr.approver_id || currentSr.processed_by || "Pending"}</small><small>{formatDate(currentSr.processed_at)}</small></div></section>
          <footer className="sr-a4-footer"><span>Service Request: {currentSr.sr_number}</span><span>Generated: {formatDate(new Date().toISOString())}</span></footer>
        </main></div></div>
      </div>
    </>
  );
}
