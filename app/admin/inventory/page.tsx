import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function InventoryPage() {
  return (
    <AdminPageShell eyebrow="Finance & Operations" title="Inventory" description="Stock, issue, return, handover and takeover workflows will be connected after the existing inventory schema is mapped.">
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Stock control" description="Inventory, suppliers and stock movement areas." />
        <AdminInfoCard label="Stage" value="Foundation" description="The module shell preserves the existing route structure." />
        <AdminInfoCard label="Dependency" value="Data model" description="Existing product and movement relationships must be verified." />
      </div>
      <div className="mt-5"><AdminEmptyState title="Inventory data is not connected yet" description="The route is ready for implementation, but no stock fields or transaction rules are being invented before schema inspection." /></div>
    </AdminPageShell>
  );
}
