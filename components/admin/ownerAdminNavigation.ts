export type OwnerAction = { label: string; href: string };
export type OwnerGroup = { label: string; href?: string; actions?: OwnerAction[] };
export type OwnerModule = { code: string; title: string; description: string; groups: OwnerGroup[] };

export const ownerModules: OwnerModule[] = [
  { code: "01", title: "Dashboard", description: "Owner overview and live controls.", groups: [
    { label: "Overview", href: "/admin" }, { label: "Pending Actions", href: "/admin?view=pending" }, { label: "System Activity", href: "/admin?view=activity" }, { label: "Audit", href: "/admin?view=audit" },
  ]},
  { code: "02", title: "People", description: "Students, parents, teachers, staff and members.", groups: [
    { label: "Students", href: "/admin/students" }, { label: "Student Admission", href: "/admin/students" }, { label: "Student Profiles", href: "/admin/students" }, { label: "Parents & Guardians", href: "/admin/parents" },
    { label: "Members", href: "/admin/members", actions: [
      { label: "All Members", href: "/admin/members" }, { label: "Teachers", href: "/admin/members?type=teacher" }, { label: "Staff", href: "/admin/members?type=staff" }, { label: "Accounts", href: "/admin/members?type=accounts" }, { label: "Other Members", href: "/admin/members?type=other" },
    ]},
  ]},
  { code: "03", title: "Human Resources", description: "Employee records, attendance and payroll.", groups: [
    { label: "Staff & Teachers", href: "/admin/hr" }, { label: "Attendance Entry", href: "/admin/hr?tab=attendance" }, { label: "Attendance Review", href: "/admin/hr?tab=attendance" }, { label: "Payroll", href: "/admin/hr?tab=payroll" }, { label: "Monthly Salary Sheet", href: "/admin/hr?tab=salary" }, { label: "Salary Processing", href: "/admin/hr?tab=salary" },
  ]},
  { code: "04", title: "Inventory & Procurement", description: "Items, stock, suppliers, requisitions and purchase orders.", groups: [
    { label: "Items", href: "/admin/inventory", actions: [ { label: "Item List", href: "/admin/inventory" }, { label: "Add Item", href: "/admin/inventory" }, { label: "Edit Item", href: "/admin/inventory" }, { label: "Product Details", href: "/admin/inventory" } ] },
    { label: "Stock", href: "/admin/inventory", actions: [ { label: "Stock In", href: "/admin/inventory/stock-in" }, { label: "Stock Out", href: "/admin/inventory/stock-out" }, { label: "Stock Adjustment", href: "/admin/inventory" }, { label: "Stock Transfer", href: "/admin/inventory" }, { label: "Stock Report", href: "/admin/inventory/reports" } ] },
    { label: "Suppliers", href: "/admin/inventory/suppliers" }, { label: "Inventory Persons", href: "/admin/inventory/persons" }, { label: "Issue", href: "/admin/inventory/issue" }, { label: "Return", href: "/admin/inventory/return" }, { label: "Handover", href: "/admin/inventory/handover" }, { label: "Takeover", href: "/admin/inventory/takeover" },
    { label: "Purchase Requisition (PR)", href: "/admin/inventory/procurement", actions: [ { label: "Create PR", href: "/admin/inventory/procurement" }, { label: "PR Approval", href: "/admin/inventory/procurement" }, { label: "PR History", href: "/admin/inventory/procurement" } ] },
    { label: "Purchase Order (PO)", href: "/admin/inventory/procurement", actions: [ { label: "Generate PO", href: "/admin/inventory/procurement" }, { label: "Price Entry", href: "/admin/inventory/procurement" }, { label: "PO Approval", href: "/admin/inventory/procurement" }, { label: "PO Payment", href: "/admin/inventory/procurement" }, { label: "PO Restock", href: "/admin/inventory/procurement" }, { label: "PO History", href: "/admin/inventory/procurement" } ] },
  ]},
  { code: "05", title: "Service Requests", description: "Complete SR lifecycle from request to issue and history.", groups: [
    { label: "Create SR", href: "/admin/item-sr" }, { label: "View Own SR", href: "/admin/item-sr" }, { label: "View All SR", href: "/admin/inventory" }, { label: "SR Approval", href: "/admin/inventory" }, { label: "SR Reject", href: "/admin/inventory" }, { label: "SR Cancel", href: "/admin/inventory" }, { label: "SR Process", href: "/admin/inventory" }, { label: "SR Issue", href: "/admin/inventory/issue" }, { label: "Print SR", href: "/admin/item-sr" }, { label: "SR History", href: "/admin/inventory" }, { label: "SR Report", href: "/admin/inventory/reports" },
  ]},
  { code: "06", title: "Accounts & Finance", description: "Fees, income, expenses, bills, cash, bank, ledger and reports.", groups: [
    { label: "Accounts Dashboard", href: "/admin/accounts" }, { label: "Fees Collection", href: "/admin/accounts/fees" }, { label: "Income Entry", href: "/admin/accounts/income" }, { label: "Expense Entry", href: "/admin/accounts/expense" }, { label: "Expense Approval", href: "/admin/accounts/expense" }, { label: "Bill Payments", href: "/admin/accounts/bill-payments" }, { label: "PO Payments", href: "/admin/accounts/salary/payroll" }, { label: "Cashbook", href: "/admin/accounts/cashbook" }, { label: "Bank", href: "/admin/accounts/bank" }, { label: "Journal", href: "/admin/accounts/journal" }, { label: "Ledger", href: "/admin/accounts/ledger" }, { label: "Invoice", href: "/admin/accounts/bill-payments" }, { label: "Financial Reports", href: "/admin/accounts/reports" },
  ]},
  { code: "07", title: "Academic", description: "Students, examinations, results and academic reporting.", groups: [
    { label: "Students", href: "/admin/students" }, { label: "Examination Management", href: "/admin/results" }, { label: "Result Entry", href: "/admin/results/entry" }, { label: "Result Edit", href: "/admin/results/entry" }, { label: "Result Approval", href: "/admin/results" }, { label: "Result Publish", href: "/admin/results" }, { label: "Result Reports", href: "/admin/results/reports" }, { label: "Notices", href: "/admin/notices" },
  ]},
  { code: "08", title: "Access Control", description: "Users, roles, permissions, portals and audit controls.", groups: [
    { label: "User Management", href: "/admin/members" }, { label: "Role Management", href: "/admin/roles" }, { label: "Permission Management", href: "/admin/roles" }, { label: "PR & PO Permissions", href: "/admin/roles/procurement" }, { label: "Portal Management", href: "/admin/portals" }, { label: "Audit Logs", href: "/admin?view=audit" }, { label: "System Activity", href: "/admin?view=activity" },
  ]},
  { code: "09", title: "Website & Communication", description: "Public-facing notices and school communication controls.", groups: [
    { label: "Notice Management", href: "/admin/notices" }, { label: "Notice Create", href: "/admin/notices" }, { label: "Notice Edit", href: "/admin/notices" }, { label: "Notice Publish", href: "/admin/notices" }, { label: "Community / People", href: "/admin/people" }, { label: "Contact Messages", href: "/admin/people" },
  ]},
];

export const ownerLeafCount = ownerModules.reduce((count, module) => count + module.groups.reduce((n, group) => n + (group.actions?.length || 1), 0), 0);
