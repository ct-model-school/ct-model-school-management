import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getCurrentAdminPermissions } from "@/lib/adminPermissions";
import ProcurementWorkspace from "../procurement-workspace";

export default async function ProcurementPage() {
  const access = await getCurrentAdminPermissions();
  const roleName = access?.profile.role.name?.toLowerCase().replace(/_/g, " ") || "";
  const adminMode = ["admin", "administrator", "super admin"].includes(roleName);
  return (
    <AdminPageShell
      eyebrow="Inventory & Store • Procurement"
      title="PR & PO Management"
      description="Role-based procurement workflow from member PR request through Admin approval, PO, Accounts clearance, payment and Store stock-in."
      action={{ href: "/admin/inventory", label: "Back to Inventory" }}
    >
      <ProcurementWorkspace permissions={access?.permissions || {}} adminMode={adminMode} />
    </AdminPageShell>
  );
}
