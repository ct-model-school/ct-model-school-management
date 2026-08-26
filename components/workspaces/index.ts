// Canonical UI entry points. Keep business logic in the existing working modules;
// every portal/page should import the shared workspace from this file instead of
// creating another visual implementation of the same workflow.
export { default as AccountsWorkspace } from "@/app/admin/accounts/accounts-workspace-v2";
export { default as BillPaymentsWorkspace } from "@/app/admin/accounts/bill-payments-workspace";
export { default as StudentFeeManager } from "@/app/admin/accounts/student-fee-manager";
export { default as FinancialOverview } from "@/app/admin/accounts/financial-overview";
export { default as HRPayrollWorkspace } from "@/app/admin/hr/HRPayrollWorkspace";
export { default as ProcurementWorkspace } from "@/app/admin/inventory/procurement-workspace-v3";
export { default as MemberAccountsWorkspace } from "@/app/member/dashboard/member-accounts-v2";
export { default as MemberInventoryWorkspace } from "@/app/member/dashboard/inventory";
export { default as MemberItemSrWorkspace } from "@/app/member/dashboard/item-sr";
export { default as MemberSrHistory } from "@/app/member/dashboard/my-sr-list";
export { default as SrDetailModal } from "@/components/SrDetailModal";
export { default as SrPrintPreview } from "@/components/SrPrintPreview";
