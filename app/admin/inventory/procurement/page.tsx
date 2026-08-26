import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getCurrentAdminPermissions } from "@/lib/adminPermissions";
import { ProcurementWorkspace } from "@/components/workspaces";

export default async function ProcurementPage() {
  const access = await getCurrentAdminPermissions();
  const roleName = access?.profile.role.name?.toLowerCase().replace(/_/g, " ") || "";
  const adminMode = ["admin", "administrator", "super admin"].includes(roleName);
  return (
    <AdminPageShell
      eyebrow="Inventory & Store • Procurement"
      title="PR & PO Management"
      description="PR approval → PO generation → Accounts item pricing → Admin quantity and price approval → Accounts payment → Store stock-in."
      action={{ href: "/admin/inventory", label: "Back to Inventory" }}
    >
      <ProcurementWorkspace permissions={access?.permissions || {}} adminMode={adminMode} />
    </AdminPageShell>
  );
}
