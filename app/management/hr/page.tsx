import { getCurrentProfile } from "@/lib/auth";
import HRPayrollWorkspace from "@/app/admin/hr/HRPayrollWorkspace";

export default async function ManagementHRPage(){
 const profile=await getCurrentProfile();
 if(!profile)return null;
 return <div className="mx-auto max-w-7xl"><header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Management • Human Resources</p><h1 className="mt-2 text-3xl font-black">Attendance & Payroll</h1><p className="mt-2 text-sm text-[var(--school-muted)]">Prepare monthly salary sheets from Teacher and Staff attendance, then send the payable amount directly to Accounts.</p></header><HRPayrollWorkspace/></div>;
}
