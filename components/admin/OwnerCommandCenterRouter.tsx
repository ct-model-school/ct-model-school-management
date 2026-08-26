"use client";

import { useSearchParams } from "next/navigation";
import OwnerCommandCenter from "./OwnerCommandCenter";
import OwnerDashboardRecords from "./OwnerDashboardRecords";

type ActivityItem = {
  id: string;
  module: string;
  action: string;
  reference?: string | null;
  detail?: string | null;
  status?: string | null;
  createdAt: string;
};

export default function OwnerCommandCenterRouter({ fullName, email, roleName, activityItems }: { fullName: string | null; email: string | null; roleName: string; activityItems: ActivityItem[] }) {
  const params = useSearchParams();
  const value = params.get("view");
  if (value === "pending" || value === "activity" || value === "audit") return <OwnerDashboardRecords view={value} fullName={fullName} roleName={roleName} activityItems={activityItems} />;
  return <OwnerCommandCenter fullName={fullName} email={email} roleName={roleName} activityItems={activityItems} />;
}
