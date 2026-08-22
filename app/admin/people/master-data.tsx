"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PeopleMasterData() {
  const supabase = useMemo(() => createClient(), []);
  const [type, setType] = useState("department");
  const [value, setValue] = useState("");
  const [rows, setRows] = useState<Array<{ id:string; master_type:string; value:string; is_active:boolean }>>([]);
  const [message, setMessage] = useState("");
  async function load(){ const {data,error}=await supabase.from("school_master_data").select("id,master_type,value,is_active").eq("master_type",type).order("sort_order").order("value"); if(error)setMessage(error.message); else setRows(data??[]); }
  useEffect(()=>{void load();},[type]);
  async function add(){ if(!value.trim()) return; const {error}=await supabase.rpc("people_admin_master_upsert",{p_type:type,p_value:value.trim(),p_sort_order:rows.length*10+10}); if(error)setMessage(error.message); else {setValue("");await load();} }
  async function toggle(row:{id:string;is_active:boolean}){const {error}=await supabase.rpc("people_admin_master_set_active",{p_id:row.id,p_active:!row.is_active});if(error)setMessage(error.message);else await load();}
  return <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 md:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="sm:w-56"><span className="label">Master Data</span><select className="field" value={type} onChange={e=>setType(e.target.value)}>{["class","section","department","subject","designation","committee","committee_position","achievement_type","exam","academic_year","scholarship_type","status"].map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label><label className="flex-1"><span className="label">Add Option</span><input className="field" value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void add();}}}/></label><button onClick={()=>void add()} className="rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">Add</button></div>{message?<p className="mt-3 text-sm font-semibold theme-primary">{message}</p>:null}<div className="mt-4 flex flex-wrap gap-2">{rows.map(r=><button key={r.id} onClick={()=>void toggle(r)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${r.is_active?"theme-primary":"opacity-50"}`}>{r.value}</button>)}</div></section>;
}
