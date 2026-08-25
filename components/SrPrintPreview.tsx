"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type SrItem = { item_id?: string; item_code?: string; item_name?: string; item_type?: string | null; specification?: string | null; brand?: string | null; model?: string | null; unit?: string | null; note?: string | null; item_note?: string | null; requested_quantity?: number | null };
type SrData = { sr_number: string; requester_name?: string | null; requester_login_id?: string | null; requester_email?: string | null; requester_phone?: string | null; class_name?: string | null; department?: string | null; request_details?: string | null; status?: string | null; admin_note?: string | null; requested_at?: string | null; processed_at?: string | null; processed_by?: string | null; approver_name?: string | null; approver_id?: string | null; approver_role?: string | null; items: SrItem[] };

export default function SrPrintPreview({ srNumber, open, onClose }: { srNumber: string; open: boolean; onClose: () => void }) {
  const [sr, setSr] = useState<SrData | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !srNumber) return;
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const client = createClient();
      const token = window.localStorage.getItem("ctms_store_token");
      try {
        let data: SrData | null = null;
        if (token) {
          const { data: live } = await client.rpc("store_get_sr", { p_token: token, p_sr_number: srNumber });
          data = live ?? null;
          if (data && !data.requester_name) {
            const { data: current } = await client.rpc("store_get_current_user_profile", { p_token: token });
            data.requester_name = current?.full_name ?? null;
            data.requester_login_id = data.requester_login_id || current?.member_id || null;
          }
        }
        const { data: settings } = await client.from("school_settings").select("logo_url").eq("id", 1).maybeSingle();
        if (!cancelled) {
          setSr(data);
          setLogoUrl(typeof settings?.logo_url === "string" ? settings.logo_url.trim() : "");
        }
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [open, srNumber]);

  if (!open) return null;

  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "-";
  const status = (sr?.status || "pending").replace(/_/g, " ");
  const requesterName = sr?.requester_name || "Requester";
  const requesterId = sr?.requester_login_id || "-";
  const approverName = sr?.approver_name || (sr?.processed_by ? "Administrator" : "Pending Approval");
  const approverId = sr?.approver_id || sr?.approver_role || sr?.processed_by || (sr?.processed_at ? "-" : "Pending");

  const downloadPdf = async () => {
    if (!pageRef.current || !sr) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollX: 0, scrollY: -window.scrollY });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`${sr.sr_number}.pdf`);
    } finally { setDownloading(false); }
  };

  const printPage = () => window.print();

  return (
    <>
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } body * { visibility: hidden !important; } .sr-print-overlay, .sr-print-overlay * { visibility: visible !important; } .sr-print-overlay { position: absolute !important; inset: 0 !important; display: block !important; padding: 0 !important; background: #fff !important; } .sr-print-toolbar { display: none !important; } .sr-print-scroll { overflow: visible !important; padding: 0 !important; background: #fff !important; } .sr-print-page { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; padding: 10mm !important; box-shadow: none !important; } }`}</style>
      <div className="sr-print-overlay fixed inset-0 z-[100] flex flex-col bg-black/60 p-3 sm:p-5">
        <div className="sr-print-toolbar mb-3 flex shrink-0 items-center justify-between rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 shadow-xl">
          <div><p className="text-xs font-black theme-primary">Print Preview</p><p className="text-[10px] text-[var(--school-muted)]">{srNumber} · Service Request</p></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void downloadPdf()} disabled={!sr || loading || downloading} className="rounded-lg border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-3 py-2 text-[10px] font-black theme-primary disabled:opacity-50">{downloading ? "Preparing PDF..." : "Download PDF"}</button>
            <button type="button" onClick={printPage} disabled={!sr || loading} className="rounded-lg theme-primary-bg px-3 py-2 text-[10px] font-black text-white disabled:opacity-50">Print</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--school-border)] px-3 py-2 text-[10px] font-bold text-[var(--school-text)]">Close</button>
          </div>
        </div>
        <div className="sr-print-scroll min-h-0 flex-1 overflow-auto rounded-xl bg-slate-500/30 p-3 sm:p-5">
          {loading || !sr ? <div className="mx-auto flex min-h-[70vh] max-w-[794px] items-center justify-center rounded-lg bg-white text-sm text-slate-500">Loading service request...</div> : (
            <div ref={pageRef} className="sr-print-page mx-auto min-h-[1123px] w-[794px] bg-white p-[42px] font-sans text-[10px] text-slate-800 shadow-2xl">
              <div className="border-b-2 pb-3" style={{ borderColor: "var(--school-primary)" }}><div className="flex items-center gap-3">
                {logoUrl ? <img src={logoUrl} alt="C.T. Model School" className="h-12 w-12 object-contain" crossOrigin="anonymous" /> : <div className="h-12 w-12" />}
                <div className="flex-1 text-center"><h1 className="text-[19px] font-black" style={{ color: "var(--school-primary)" }}>C.T. Model School</h1><p className="text-[9px] text-slate-500">Item Requisition &amp; Service Request</p></div>
                <div className="w-[105px] text-right"><strong className="block text-[13px]" style={{ color: "var(--school-primary)" }}>SERVICE REQUEST</strong><span className="text-[9px] text-slate-500">{sr.sr_number}</span></div>
              </div></div>
              <div className="my-2 text-center"><span className="inline-block rounded border px-4 py-1 text-[13px] font-black tracking-wider" style={{ color: "var(--school-primary)", borderColor: "var(--school-primary-border)" }}>ITEM SERVICE REQUEST</span></div>
              <div className="grid grid-cols-4 border border-slate-300">{[["Requester", requesterName], ["ID", requesterId], ["Class / Section", sr.class_name || "-"], ["Department", sr.department || "-"]].map(([label, value]) => <div key={label} className="border-r border-slate-300 p-2 last:border-r-0"><span className="block text-[7px] uppercase tracking-wide text-slate-500">{label}</span><strong className="text-[10px]">{value}</strong></div>)}</div>
              <div className="mt-2 grid grid-cols-4 border border-slate-300">{[["Request Date", formatDate(sr.requested_at)], ["Email", sr.requester_email || "-"], ["Phone", sr.requester_phone || "-"], ["Status", status]].map(([label, value]) => <div key={label} className="border-r border-slate-300 p-2 last:border-r-0"><span className="block text-[7px] uppercase tracking-wide text-slate-500">{label}</span><strong className="text-[9px]">{value}</strong></div>)}</div>
              <div className="mt-3 overflow-hidden border border-slate-300"><div className="px-2 py-1.5 text-[8px] font-black uppercase tracking-wider" style={{ background: "var(--school-primary-soft)", color: "var(--school-primary)" }}>Requested Items</div><table className="w-full border-collapse"><thead><tr style={{ background: "var(--school-primary-soft)", color: "var(--school-primary)" }}><th className="border border-slate-300 p-1.5 text-center">SL</th><th className="border border-slate-300 p-1.5 text-left">ITEM CODE</th><th className="border border-slate-300 p-1.5 text-left">ITEM DESCRIPTION</th><th className="border border-slate-300 p-1.5 text-center">QTY</th><th className="border border-slate-300 p-1.5 text-center">UNIT</th><th className="border border-slate-300 p-1.5 text-left">NOTE</th></tr></thead><tbody>{sr.items.map((item, index) => <tr key={item.item_id || `${item.item_code}-${index}`}><td className="border border-slate-300 p-1.5 text-center">{index + 1}</td><td className="border border-slate-300 p-1.5 font-mono font-bold" style={{ color: "var(--school-primary)" }}>{item.item_code || "-"}</td><td className="border border-slate-300 p-1.5"><strong>{item.item_name || "-"}</strong><div className="text-[7px] text-slate-500">{item.specification || item.model || item.item_type || ""}</div></td><td className="border border-slate-300 p-1.5 text-center">{item.requested_quantity ?? 0}</td><td className="border border-slate-300 p-1.5 text-center">{item.unit || "-"}</td><td className="border border-slate-300 p-1.5">{item.item_note || item.note || "-"}</td></tr>)}</tbody></table></div>
              <div className="mt-2 flex justify-end"><div className="border border-slate-300 px-3 py-2 text-[9px]"><div>Requested Items: <strong style={{ color: "var(--school-primary)" }}>{sr.items.length}</strong></div><div>Total Quantity: <strong style={{ color: "var(--school-primary)" }}>{sr.items.reduce((sum, item) => sum + Number(item.requested_quantity || 0), 0)}</strong></div></div></div>
              {sr.request_details ? <div className="mt-3 overflow-hidden border border-slate-300"><div className="px-2 py-1.5 text-[8px] font-black uppercase tracking-wider" style={{ background: "var(--school-primary-soft)", color: "var(--school-primary)" }}>Request Details</div><div className="whitespace-pre-wrap p-2 text-[9px]">{sr.request_details}</div></div> : null}
              {sr.admin_note ? <div className="mt-2 border border-slate-300 p-2 text-[9px]"><strong>Admin Note:</strong> {sr.admin_note}</div> : null}
              <div className="mt-5 inline-block rounded-full border px-2 py-1 text-[8px] font-bold" style={{ color: "var(--school-primary)", borderColor: "var(--school-primary-border)" }}>Status: {status}</div>
              <div className="mt-10 grid grid-cols-2 gap-8"><div className="pt-1 text-center"><div className="mb-1 text-[9px] font-bold">{requesterName}</div><div className="text-[8px] font-bold" style={{ color: "var(--school-primary)" }}>ID: {requesterId}</div><div className="text-[7px] text-slate-500">{formatDate(sr.requested_at)}</div><div className="mt-1 border-t border-slate-600 pt-1 text-[8px] text-slate-600">Prepared By</div></div><div className="pt-1 text-center"><div className="mb-1 text-[9px] font-bold">{approverName}</div><div className="text-[8px] font-bold" style={{ color: "var(--school-primary)" }}>ID: {approverId}</div><div className="text-[7px] text-slate-500">{formatDate(sr.processed_at)}</div><div className="mt-1 border-t border-slate-600 pt-1 text-[8px] text-slate-600">Approved By</div></div></div>
              <div className="mt-5 flex justify-between border-t border-slate-200 pt-2 text-[7px] text-slate-500"><span>Service Request: {sr.sr_number}</span><span>Generated: {formatDate(new Date().toISOString())}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
