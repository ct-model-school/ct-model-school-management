"use client";

import SrPrintPreview from "@/components/SrPrintPreview";

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
  id?: string;
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
  processed_by?: string | null;
  approver_name?: string | null;
  approver_id?: string | null;
  approver_role?: string | null;
  items: SrDetailItem[];
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
  if (!open || !sr) return null;

  return (
    <SrPrintPreview
      srNumber={sr.sr_number}
      srData={{ ...sr, items: Array.isArray(sr.items) ? sr.items : [] }}
      open={open}
      onClose={onClose}
    />
  );
}
