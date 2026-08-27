export type OwnerAction = { label: string; href: string };
export type OwnerGroup = { label: string; href?: string; actions?: OwnerAction[] };
export type OwnerModule = { code: string; title: string; description: string; groups: OwnerGroup[] };

// Owner navigation is intentionally outcome/workspace based.
// One destination appears once. Detailed actions belong inside the workspace,
// not as duplicate navigation leaves.
export const ownerModules: OwnerModule[] = [
  {
    code: "01",
    title: "Dashboard",
    description: "Owner overview, pending work, activity and audit.",
    groups: [
      { label: "Overview", href: "/admin" },
      { label: "Pending Actions", href: "/admin?view=pending" },
      { label: "System Activity", href: "/admin?view=activity" },
      { label: "Audit", href: "/admin?view=audit" },
    ],
  },
  {
    code: "02",
    title: "People",
    description: "Students, parents, teachers, staff and members.",
    groups: [
      { label: "Students", href: "/admin/students" },
      { label: "Parents & Guardians", href: "/admin/parents" },
      { label: "Members", href: "/admin/members" },
    ],
  },
  {
    code: "03",
    title: "Human Resources",
    description: "Employee records, attendance and payroll.",
    groups: [
      { label: "HR Workspace", href: "/admin/hr" },
    ],
  },
  {
    code: "04",
    title: "Inventory & Procurement",
    description: "Items, stock, suppliers, requisitions and purchase orders.",
    groups: [
      {
        label: "Inventory Workspace",
        href: "/admin/inventory",
        actions: [
          { label: "Stock In", href: "/admin/inventory/stock-in" },
          { label: "Stock Out", href: "/admin/inventory/stock-out" },
          { label: "Suppliers", href: "/admin/inventory/suppliers" },
          { label: "Inventory Persons", href: "/admin/inventory/persons" },
          { label: "Issue", href: "/admin/inventory/issue" },
          { label: "Return", href: "/admin/inventory/return" },
          { label: "Handover", href: "/admin/inventory/handover" },
          { label: "Takeover", href: "/admin/inventory/takeover" },
          { label: "Reports", href: "/admin/inventory/reports" },
        ],
      },
      {
        label: "PR & PO Workspace",
        href: "/admin/inventory/procurement",
      },
    ],
  },
  {
    code: "05",
    title: "Service Requests",
    description: "Complete SR lifecycle from request to issue and history.",
    groups: [
      { label: "SR Workspace", href: "/admin/item-sr" },
    ],
  },
  {
    code: "06",
    title: "Accounts & Finance",
    description: "Fees, income, expenses, bills, cash, bank, ledger and reports.",
    groups: [
      { label: "Accounts Dashboard", href: "/admin/accounts" },
      { label: "Fees Collection", href: "/admin/accounts/fees" },
      { label: "Income", href: "/admin/accounts/income" },
      { label: "Expense", href: "/admin/accounts/expense" },
      { label: "Bill Payments", href: "/admin/accounts/bill-payments" },
      { label: "Cashbook", href: "/admin/accounts/cashbook" },
      { label: "Bank", href: "/admin/accounts/bank" },
      { label: "Journal", href: "/admin/accounts/journal" },
      { label: "Ledger", href: "/admin/accounts/ledger" },
      { label: "Reports", href: "/admin/accounts/reports" },
    ],
  },
  {
    code: "07",
    title: "Academic",
    description: "Students, examinations, results and academic reporting.",
    groups: [
      { label: "Students", href: "/admin/students" },
      { label: "Results Workspace", href: "/admin/results" },
      { label: "Result Entry", href: "/admin/results/entry" },
      { label: "Result Reports", href: "/admin/results/reports" },
      { label: "Notices", href: "/admin/notices" },
    ],
  },
  {
    code: "08",
    title: "Access Control",
    description: "Users, roles, permissions, portals and audit controls.",
    groups: [
      { label: "User Management", href: "/admin/members" },
      { label: "Role Management", href: "/admin/roles" },
      { label: "PR & PO Permissions", href: "/admin/roles/procurement" },
      { label: "Portal Management", href: "/admin/portals" },
    ],
  },
  {
    code: "09",
    title: "Website & Communication",
    description: "Public-facing notices and school communication controls.",
    groups: [
      { label: "Notice Management", href: "/admin/notices" },
      { label: "Community / People", href: "/admin/people" },
    ],
  },
];

export const ownerLeafCount = ownerModules.reduce(
  (count, module) => count + module.groups.reduce((n, group) => n + (group.actions?.length || 1), 0),
  0,
);
