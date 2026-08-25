"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SrDetailModal from "@/components/SrDetailModal";

type MySRItem = { item_id: string; item_code: string; item_name: string; item_type?: string | null; specification?: string | null; brand?: string | null; model?: string | null; unit: string; details?: string | null; note?: string | null; current_stock?: number | null; requested_quantity: number; issued_quantity: number; remaining_quantity?: number | null; item_note?: string | null };
type MySR = { id: string; sr_number: string; class_name: string | null; department: string | null; request_details: string | null; status: string; admin_note: string | null; requested_at: string; processed_at?: string | null; items: MySRItem[] };

const statusClass = (status: string) => {
  const value = status.toLowerCase();
  return value.includes("reject") || value.includes("cancel") ? "text-red-700 bg-red-50 border-red-100" : value.includes("pending") ? "text-amber-700 bg-amber-50 border-amber-100" : "theme-primary bg-[var(--school-primary-soft)] border-[var(--school-primary-border)]";
};

export default function MySrList({ canView }: { canView: boolean }) {
  const supabase = createClient();
  const [srs, setSrs] = useState<MySR[]>([]);
  const [selectedSr, setSelectedSr] = useState<MySR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const token = window.localStorage.getItem("ctms_store_token");
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase.rpc("store_list_my_srs", { p_token: token });
    if (loadError) setError(loadError.message);
    else setSrs((data ?? []).map((row: MySR) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
    setLoading(false);
  }

  useEffect(() => { if (canView) void load(); else setLoading(false); }, [canView]);

  if (!canView) return null;

  const formatDate = (value: string) => new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <section className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.14em] theme-primary">My Service Requests</p><p className="mt-0.5 text-[10px] text-[var(--school-muted)]">Your submitted SRs and current approval status. Click any SR to view the complete request.</p></div>
          <div className="flex shrink-0 items-center gap-1.5"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[9px] font-black theme-primary">{srs.length} SR{srs.length === 1 ? "" : "s"}</span><button type="button" onClick={() => void load()} className="rounded-md border border-[var(--school-border)] px-2.5 py-1.5 text-[9px] font-bold text-[var(--school-text)] hover:bg-[var(--school-primary-soft)]">Refresh</button></div>
        </div>

        {loading ? <div className="mt-3 rounded-lg bg-[var(--school-primary-soft)] p-3 text-center text-[10px] text-[var(--school-muted)]">Loading your SRs...</div> : error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] text-red-700">{error}</p> : !srs.length ? <div className="mt-3 rounded-lg border border-dashed border-[var(--school-border)] bg-[var(--school-primary-soft)] p-4 text-center text-[10px] text-[var(--school-muted)]">No service requests submitted yet.</div> : (
          <div className="mt-3 space-y-1.5">
            {srs.map((sr) => (
              <article key={sr.id} role="button" tabIndex={0} onClick={() => setSelectedSr(sr)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedSr(sr); }} className="cursor-pointer rounded-lg border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-2.5 transition-colors hover:border-[var(--school-primary-border)] hover:bg-[var(--school-primary-soft)]/35 focus:outline-none focus:ring-2 focus:ring-[var(--school-primary-border)]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] leading-5">
                  <div className="flex shrink-0 items-center gap-1.5"><span className="font-black theme-primary">{sr.sr_number}</span><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize leading-4 ${statusClass(sr.status)}`}>{sr.status.replace(/_/g, " ")}</span></div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[var(--school-muted)]"><span className="inline-flex items-center gap-1 whitespace-nowrap"><span className="font-semibold text-[var(--school-text)]">Items</span><span>{(sr.items || []).map((item) => `${item.item_code} × ${item.requested_quantity}`).join(", ") || "-"}</span></span><span className="whitespace-nowrap"><b className="text-[var(--school-text)]">Class:</b> {sr.class_name || "-"}</span><span className="whitespace-nowrap"><b className="text-[var(--school-text)]">Department:</b> {sr.department || "-"}</span></div>
                  <span className="shrink-0 whitespace-nowrap text-[9px] text-[var(--school-muted)]">{formatDate(sr.requested_at)}</span>
                </div>
                {sr.request_details || sr.admin_note ? <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--school-border)] pt-1.5 text-[9px] leading-4"><p className="min-w-0 max-w-full truncate text-[var(--school-muted)]" title={sr.request_details || undefined}><b className="text-[var(--school-text)]">Details:</b> {sr.request_details || "-"}</p>{sr.admin_note ? <p className="min-w-0 max-w-full truncate theme-primary" title={sr.admin_note}><b>Admin:</b> {sr.admin_note}</p> : null}</div> : null}
              </article>
            ))}
          </div>
        )}
      </section>
      <SrDetailModal sr={selectedSr} open={Boolean(selectedSr)} onClose={() => setSelectedSr(null)} />
    </>
  );
}
