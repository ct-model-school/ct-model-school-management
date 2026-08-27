"use client";

import { useSearchParams } from "next/navigation";
import OwnerCommandCenterV2 from "./OwnerCommandCenterV2";
import OwnerDashboardRecords from "./OwnerDashboardRecords";

type ActivityItem = { id: string; module: string; action: string; reference?: string | null; detail?: string | null; status?: string | null; createdAt: string };
type OwnerMetrics = { students: number; parents: number; teachers: number; staff: number; inventoryItems: number; lowStockItems: number; pendingSr: number; pendingPr: number; pendingPo: number; pendingBills: number; pendingStudentAdmission: number; pendingParentRegistration: number; totalOutstandingBills: number; totalFeeDue: number };

export default function OwnerCommandCenterRouter({ fullName, email, roleName, activityItems, metrics }: { fullName: string | null; email: string | null; roleName: string; activityItems: ActivityItem[]; metrics: OwnerMetrics }) {
  const params = useSearchParams();
  const value = params.get("view");
  if (value === "pending" || value === "activity" || value === "audit") return <OwnerDashboardRecords view={value} fullName={fullName} roleName={roleName} activityItems={activityItems} />;
  return <OwnerCommandCenterV2 fullName={fullName} email={email} roleName={roleName} activityItems={activityItems} metrics={metrics} />;
}
