"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Role={id:string;role_name:string;role_category:string;permissions:Record<string,any>;is_system:boolean;is_active:boolean};
const permissions=[
  ["pr_view","PR View / History"],
  ["pr_make","PR Make / Submit"],
  ["pr_approve","PR Approval (Admin Qty)"],
  ["pr_convert_po","PR Convert to PO"],
  ["po_view","PO View"],
  ["po_approve","PO Approval (Admin)"],
  ["po_accounts_submit","PO Accounts Expense / Submit"],
  ["po_payment_approve","PO Payment Approval / Clearance"],
  ["po_payment_paid","PO Paid / Record Payment"],
  ["po_restock","PO Restock / Stock In"],
  ["po_history","PO History"],
] as const;

export default function ProcurementPermissionsPage(){
  const supabase=useMemo(()=>createClient(),[]);
  const [roles,setRoles]=useState<Role[]>([]); const [selected,setSelected]=useState<string>(""); const [values,setValues]=useState<Record<string,boolean>>({}); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function load(){setLoading(true);const r=await supabase.rpc("store_admin_list_member_roles");if(r.error)setError(r.error.message);else{const list=(r.data||[]) as Role[];setRoles(list);if(!selected&&list[0])setSelected(list[0].id);}setLoading(false)}
  useEffect(()=>{void load()},[]);
  useEffect(()=>{const role=roles.find(r=>r.id===selected);const p=role?.permissions?.procurement||{};setValues(Object.fromEntries(permissions.map(([k])=>[k,Boolean(p[k])] )));setMessage("");},[roles,selected]);
  async function save(){const role=roles.find(r=>r.id===selected);if(!role)return;setSaving(true);setError("");setMessage("");const merged={...(role.permissions||{}),procurement:values};const r=await supabase.rpc("store_admin_save_member_role",{p_id:role.id,p_role_name:role.role_name,p_role_category:role.role_category,p_permissions:merged});if(r.error)setError(r.error.message);else{setMessage(`${role.role_name} procurement permissions updated.`);await load();}setSaving(false)}
  const role=roles.find(r=>r.id===selected);
  return <AdminPageShell eyebrow="Access Control • Procurement" title="PR & PO Permissions" description="Control each role's procurement access separately from Inventory item permissions and Accounts permissions.">
    {error&&<p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message&&<p className="mb-5 rounded-xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-3 text-sm font-semibold theme-primary">{message}</p>}
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">Role Category</p><h2 className="mt-1 text-xl font-black">Select Role</h2>{loading?<p className="mt-5 text-xs text-[var(--school-muted)]">Loading roles...</p>:<div className="mt-5 space-y-2">{roles.map(r=><button key={r.id} onClick={()=>setSelected(r.id)} className={`w-full rounded-2xl border p-3 text-left ${selected===r.id?"border-[var(--school-primary-border)] bg-[var(--school-primary-soft)]":"border-[var(--school-border)]"}`}><p className="text-sm font-black">{r.role_name}</p><p className="mt-1 text-[10px] text-[var(--school-muted)]">{r.role_category}</p></button>)}</div>}</section>
      <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] theme-primary">Procurement Permissions</p><h2 className="mt-1 text-xl font-black">{role?.role_name||"Select a role"}</h2><p className="mt-1 text-xs text-[var(--school-muted)]">PR is the request stage. PO is the approved procurement stage. Accounts and Store permissions are independent.</p></div><div className="flex gap-2"><button onClick={()=>setValues(Object.fromEntries(permissions.map(([k])=>[k,true])))} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Enable All</button><button onClick={()=>setValues(Object.fromEntries(permissions.map(([k])=>[k,false])))} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Disable All</button></div></div><div className="mt-5 grid gap-2 md:grid-cols-2">{permissions.map(([key,text])=><label key={key} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[var(--school-border)] p-4"><input type="checkbox" checked={Boolean(values[key])} onChange={()=>setValues(v=>({...v,[key]:!v[key]}))} className="h-4 w-4"/><span className="text-sm font-bold">{text}</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${values[key]?"theme-primary-bg":"border border-[var(--school-border)] text-[var(--school-muted)]"}`}>{values[key]?"ON":"OFF"}</span></label>)}</div><button disabled={saving||!role} onClick={()=>void save()} className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-black theme-primary-bg disabled:opacity-60">{saving?"Saving...":"Save Procurement Permissions"}</button></section>
    </div>
  </AdminPageShell>;
}
