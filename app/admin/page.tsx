import { getCurrentProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OwnerCommandCenterRouter from "@/components/admin/OwnerCommandCenterRouter";

const isSuperAdmin = (roleName: string) => ["super_admin", "super admin"].includes(roleName.toLowerCase().replace(/_/g, " "));

type ActivityItem = { id: string; module: string; action: string; reference?: string | null; detail?: string | null; status?: string | null; createdAt: string };
type OwnerMetrics = { students:number; parents:number; teachers:number; staff:number; inventoryItems:number; lowStockItems:number; pendingSr:number; pendingPr:number; pendingPo:number; pendingBills:number; pendingStudentAdmission:number; pendingParentRegistration:number; pendingPayroll:number; totalOutstandingBills:number; totalFeeDue:number };

async function getRecentActivity(): Promise<ActivityItem[]> {
 const supabase=await createServerSupabaseClient();
 const [sr,pr,po,bills,payroll,stock,parent,student]=await Promise.all([
  supabase.from("store_service_requests").select("id,sr_number,status,requested_at,department").order("requested_at",{ascending:false}).limit(8),
  supabase.from("procurement_requests").select("id,pr_number,status,created_at,department,requester_name").order("created_at",{ascending:false}).limit(8),
  supabase.from("purchase_orders").select("id,po_number,status,created_at,supplier_name").order("created_at",{ascending:false}).limit(8),
  supabase.from("accounts_bills").select("id,bill_no,status,created_at,bill_category,payee_name").order("created_at",{ascending:false}).limit(8),
  supabase.from("hr_payroll_sheets").select("id,member_id,member_name,status,created_at,payroll_month").order("created_at",{ascending:false}).limit(8),
  supabase.from("inventory_stock_movements").select("id,movement_type,quantity,reference_type,reference_id,created_at,note").order("created_at",{ascending:false}).limit(8),
  supabase.from("parent_registration_requests").select("id,registration_no,full_name,status,created_at").order("created_at",{ascending:false}).limit(8),
  supabase.from("student_registration_requests").select("id,application_no,student_name,status,created_at").order("created_at",{ascending:false}).limit(8)
 ]);
 const out:ActivityItem[]=[];
 for(const r of sr.data??[]) out.push({id:`sr-${r.id}`,module:"Service Requests",action:"Request updated",reference:r.sr_number,detail:r.department,status:r.status,createdAt:r.requested_at});
 for(const r of pr.data??[]) out.push({id:`pr-${r.id}`,module:"Procurement",action:"PR updated",reference:r.pr_number,detail:r.requester_name||r.department,status:r.status,createdAt:r.created_at});
 for(const r of po.data??[]) out.push({id:`po-${r.id}`,module:"Purchase Orders",action:"PO updated",reference:r.po_number,detail:r.supplier_name,status:r.status,createdAt:r.created_at});
 for(const r of bills.data??[]) out.push({id:`bill-${r.id}`,module:"Accounts",action:"Bill updated",reference:r.bill_no,detail:r.payee_name||r.bill_category,status:r.status,createdAt:r.created_at});
 for(const r of payroll.data??[]) out.push({id:`payroll-${r.id}`,module:"Human Resources",action:"Payroll updated",reference:r.member_id,detail:`${r.member_name} · ${r.payroll_month}`,status:r.status,createdAt:r.created_at});
 for(const r of stock.data??[]) out.push({id:`stock-${r.id}`,module:"Inventory",action:`Stock ${r.movement_type}`,reference:r.reference_id,detail:`${r.quantity} quantity${r.note?` · ${r.note}`:""}`,status:r.movement_type,createdAt:r.created_at});
 for(const r of parent.data??[]) out.push({id:`parent-${r.id}`,module:"Parents & Guardians",action:"Registration updated",reference:r.registration_no,detail:r.full_name,status:r.status,createdAt:r.created_at});
 for(const r of student.data??[]) out.push({id:`student-${r.id}`,module:"Student Registration",action:"Registration updated",reference:r.application_no,detail:r.student_name,status:r.status,createdAt:r.created_at});
 return out.filter(x=>x.createdAt).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,30);
}

async function getOwnerMetrics():Promise<OwnerMetrics>{
 const s=await createServerSupabaseClient();
 const [students,parents,teachers,staff,items,low,sr,pr,po,bills,sa,pa,pay,billRows,fees]=await Promise.all([
  s.from("students").select("id",{count:"exact",head:true}).eq("status","active"),s.from("parents").select("id",{count:"exact",head:true}).eq("is_active",true),s.from("teacher_members").select("id",{count:"exact",head:true}).eq("is_active",true),s.from("staff_members").select("id",{count:"exact",head:true}).eq("is_active",true),s.from("inventory_items").select("id",{count:"exact",head:true}).eq("is_active",true),s.from("inventory_items").select("id",{count:"exact",head:true}).eq("is_active",true).filter("current_stock","lte","reorder_level"),s.from("store_service_requests").select("id",{count:"exact",head:true}).eq("status","pending"),s.from("procurement_requests").select("id",{count:"exact",head:true}).eq("status","submitted"),s.from("purchase_orders").select("id",{count:"exact",head:true}).in("status",["submitted","accounts_submitted"]),s.from("accounts_bills").select("id",{count:"exact",head:true}).in("status",["submitted","approved","partial","due"]),s.from("student_registration_requests").select("id",{count:"exact",head:true}).in("status",["pending","reviewing"]),s.from("parent_registration_requests").select("id",{count:"exact",head:true}).in("status",["pending","reviewing"]),s.from("hr_payroll_sheets").select("id",{count:"exact",head:true}).in("status",["draft","submitted"]),s.from("accounts_bills").select("due_amount").in("status",["approved","partial","due"]),s.from("student_fee_accounts").select("balance_due").gt("balance_due",0)
 ]);
 const sum=(rows:any[]|null|undefined,key:string)=>(rows??[]).reduce((n,r)=>n+Number(r[key]??0),0);
 return {students:students.count??0,parents:parents.count??0,teachers:teachers.count??0,staff:staff.count??0,inventoryItems:items.count??0,lowStockItems:low.count??0,pendingSr:sr.count??0,pendingPr:pr.count??0,pendingPo:po.count??0,pendingBills:bills.count??0,pendingStudentAdmission:sa.count??0,pendingParentRegistration:pa.count??0,pendingPayroll:pay.count??0,totalOutstandingBills:sum(billRows.data,"due_amount"),totalFeeDue:sum(fees.data,"balance_due")};
}

export default async function AdminPage(){
 const profile=await getCurrentProfile(); if(!profile)return null;
 if(isSuperAdmin(profile.role.name)){const [activityItems,metrics]=await Promise.all([getRecentActivity(),getOwnerMetrics()]);return <OwnerCommandCenterRouter fullName={profile.full_name} email={profile.email} roleName={profile.role.name} activityItems={activityItems} metrics={metrics}/>;}
 return <div className="mx-auto max-w-7xl"><header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] theme-primary">Administration</p><h1 className="mt-2 text-3xl font-bold">Admin Dashboard</h1><p className="mt-2 text-sm text-[var(--school-muted)]">Welcome back, {profile.full_name||profile.email}.</p></header></div>;
}
