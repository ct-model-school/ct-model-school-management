import { getCurrentProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SuperAdminDashboard from "@/components/admin/SuperAdminDashboard";

const isSuperAdmin = (roleName: string) =>
  ["super_admin", "super admin"].includes(roleName.toLowerCase().replace(/_/g, " "));

type ActivityItem = {
  id: string;
  module: string;
  action: string;
  reference?: string | null;
  detail?: string | null;
  status?: string | null;
  createdAt: string;
};

async function getRecentActivity(): Promise<ActivityItem[]> {
  const supabase = await createServerSupabaseClient();

  const [
    serviceRequests,
    procurementRequests,
    purchaseOrders,
    bills,
    payroll,
    stockMovements,
    parentRegistrations,
    studentRegistrations,
  ] = await Promise.all([
    supabase.from("store_service_requests").select("id, sr_number, status, requested_at, department, requester:store_users(member_id)").order("requested_at", { ascending: false }).limit(8),
    supabase.from("procurement_requests").select("id, pr_number, status, created_at, department, requester_name").order("created_at", { ascending: false }).limit(8),
    supabase.from("purchase_orders").select("id, po_number, status, created_at, supplier_name").order("created_at", { ascending: false }).limit(8),
    supabase.from("accounts_bills").select("id, bill_no, status, created_at, bill_category, payee_name").order("created_at", { ascending: false }).limit(8),
    supabase.from("hr_payroll_sheets").select("id, member_id, member_name, status, created_at, payroll_month").order("created_at", { ascending: false }).limit(8),
    supabase.from("inventory_stock_movements").select("id, movement_type, quantity, reference_type, reference_id, created_at, note").order("created_at", { ascending: false }).limit(8),
    supabase.from("parent_registration_requests").select("id, registration_no, full_name, status, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("student_registration_requests").select("id, application_no, student_name, status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const items: ActivityItem[] = [];

  for (const row of serviceRequests.data ?? []) {
    items.push({ id: `sr-${row.id}`, module: "Item Service Request", action: "Service request updated", reference: row.sr_number, detail: row.department, status: row.status, createdAt: row.requested_at });
  }
  for (const row of procurementRequests.data ?? []) {
    items.push({ id: `pr-${row.id}`, module: "Procurement", action: "Purchase request created", reference: row.pr_number, detail: row.requester_name || row.department, status: row.status, createdAt: row.created_at });
  }
  for (const row of purchaseOrders.data ?? []) {
    items.push({ id: `po-${row.id}`, module: "Purchase Order", action: "Purchase order updated", reference: row.po_number, detail: row.supplier_name, status: row.status, createdAt: row.created_at });
  }
  for (const row of bills.data ?? []) {
    items.push({ id: `bill-${row.id}`, module: "Accounts", action: "Bill record updated", reference: row.bill_no, detail: row.payee_name || row.bill_category, status: row.status, createdAt: row.created_at });
  }
  for (const row of payroll.data ?? []) {
    items.push({ id: `payroll-${row.id}`, module: "Human Resources", action: "Payroll sheet updated", reference: row.member_id, detail: `${row.member_name} · ${row.payroll_month}`, status: row.status, createdAt: row.created_at });
  }
  for (const row of stockMovements.data ?? []) {
    items.push({ id: `stock-${row.id}`, module: "Inventory", action: `Stock ${row.movement_type}`, reference: row.reference_id, detail: `${row.quantity} quantity${row.note ? ` · ${row.note}` : ""}`, status: row.movement_type, createdAt: row.created_at });
  }
  for (const row of parentRegistrations.data ?? []) {
    items.push({ id: `parent-${row.id}`, module: "Parents & Guardians", action: "Parent registration updated", reference: row.registration_no, detail: row.full_name, status: row.status, createdAt: row.created_at });
  }
  for (const row of studentRegistrations.data ?? []) {
    items.push({ id: `student-${row.id}`, module: "Student Registration", action: "Student registration updated", reference: row.application_no, detail: row.student_name, status: row.status, createdAt: row.created_at });
  }

  return items
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  if (isSuperAdmin(profile.role.name)) {
    const activityItems = await getRecentActivity();
    return (
      <SuperAdminDashboard
        fullName={profile.full_name}
        email={profile.email}
        roleName={profile.role.name}
        activityItems={activityItems}
      />
    );
  }

  const modules = [
    { href: "/admin/parents", title: "Parents & Guardians", description: "Approve Parent accounts, issue Parent IDs, review child registrations and maintain Parent–Student binding." },
    { href: "/admin/inventory", title: "Inventory", description: "Manage items, stock, item information and Inventory-side SR approval and processing." },
    { href: "/admin/item-sr", title: "Item SR", description: "Inspect the shared Item Service Request form and its member-side request structure." },
    { href: "/admin/accounts", title: "Accounts", description: "School financial operations including fees, salary payment, bills, income, expense, cash, bank, vouchers, ledger and reports." },
    { href: "/admin/hr", title: "HR • Attendance & Payroll", description: "Enter Teacher/Staff attendance by Member ID, calculate salary automatically and submit the salary sheet directly to Accounts." },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Administration</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--school-text)]">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-[var(--school-muted)]">Welcome back, {profile.full_name || profile.email}.</p>
          </div>
          <span className="w-fit rounded-full px-4 py-2 text-xs font-bold capitalize theme-primary-bg">{profile.role.name.replace(/_/g, " ")}</span>
        </div>
      </header>
      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Ready administration modules">
        {modules.map(module => (
          <a key={module.href} href={module.href} className="group block rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)] hover:shadow-md md:p-8">
            <div className="mb-5 h-2 w-16 rounded-full theme-primary-bg transition-all group-hover:w-24" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Ready Module</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--school-text)]">{module.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">{module.description}</p>
            <span className="mt-6 inline-block text-xs font-bold theme-primary">Open {module.title} →</span>
          </a>
        ))}
      </section>
    </div>
  );
}
