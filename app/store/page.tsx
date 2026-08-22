"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "choice" | "user";
type Item = {
  id: string;
  item_code: string;
  item_name: string;
  item_type: string | null;
  specification: string | null;
  brand: string | null;
  model: string | null;
  unit: string;
  current_stock: number;
  stock_status: string;
};
type Profile = {
  user_id: string;
  profile_id: string | null;
  full_name: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  designation: string | null;
  department: string | null;
  class_name: string | null;
  section: string | null;
};
type SelectedItem = Item & { quantity: number; note: string };
type SrResult = {
  id: string;
  sr_number: string;
  status: string;
  class_name: string | null;
  department: string | null;
  request_details: string | null;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_whatsapp: string | null;
  items: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    unit: string;
    requested_quantity: number;
    issued_quantity: number;
    item_note: string | null;
  }>;
};

const classes = ["Play", "Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "SSC", "HSC"];
const departments = ["Administration", "Academic", "Accounts", "Examination", "Library", "ICT", "Maintenance", "Store", "Other"];

export default function StorePage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("choice");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [department, setDepartment] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sr, setSr] = useState<SrResult | null>(null);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.rpc("store_login", { p_login_id: loginId, p_password: password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    const result = data as Profile & { token: string };
    setToken(result.token);
    setProfile(result);
    setPassword("");
    setMessage("");
    await loadItems(result.token, "");
    setLoading(false);
  }

  async function loadItems(activeToken = token, query = search) {
    if (!activeToken) return;
    const { data, error } = await supabase.rpc("store_list_items", { p_token: activeToken, p_search: query || null });
    if (error) setMessage(error.message);
    else setItems((data ?? []) as Item[]);
  }

  function addItem(item: Item) {
    setSelected((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) return current.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.min(Number(entry.quantity) + 1, Number(item.current_stock)) } : entry);
      return [...current, { ...item, quantity: 1, note: "" }];
    });
  }

  function updateSelected(id: string, field: "quantity" | "note", value: string) {
    setSelected((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "quantity" ? Math.max(1, Number(value) || 1) : value } : item));
  }

  async function submitSr(event: FormEvent) {
    event.preventDefault();
    if (!token || selected.length === 0) {
      setMessage("Select at least one item.");
      return;
    }
    setLoading(true);
    setMessage("");
    const payload = selected.map((item) => ({ item_id: item.id, quantity: item.quantity, note: item.note || null }));
    const { data, error } = await supabase.rpc("store_submit_sr", {
      p_token: token,
      p_class_name: className,
      p_department: department,
      p_request_details: details,
      p_items: payload,
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    const created = data as { sr_number: string };
    await loadSr(created.sr_number);
    setSelected([]);
    setDetails("");
    setMessage("SR submitted successfully.");
    setLoading(false);
  }

  async function loadSr(srNumber: string) {
    if (!token) return;
    const { data, error } = await supabase.rpc("store_get_sr", { p_token: token, p_sr_number: srNumber });
    if (error) setMessage(error.message);
    else setSr(data as SrResult);
  }

  function logout() {
    if (token) void supabase.rpc("store_logout", { p_token: token });
    setToken("");
    setProfile(null);
    setItems([]);
    setSelected([]);
    setSr(null);
    setMode("choice");
  }

  if (mode === "choice") {
    return (
      <main className="min-h-screen bg-[var(--school-background)] px-5 py-10 text-[var(--school-text)] md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] theme-primary">C.T. Model School</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Store & Service Request</h1>
            <p className="mt-3 text-sm text-[var(--school-muted)]">Choose how you want to continue.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <button onClick={() => setMode("user")} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)]">
              <span className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">A. User</span>
              <h2 className="mt-3 text-2xl font-black">Submit an SR</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Login with your Store ID and password, select available items and submit a Service Request.</p>
            </button>
            <a href="/admin/inventory" className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)]">
              <span className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">B. Admin</span>
              <h2 className="mt-3 text-2xl font-black">Manage Store</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Add, edit and deactivate items, then review, approve, reject and issue User SRs.</p>
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[var(--school-background)] px-5 py-10 text-[var(--school-text)] md:px-8">
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-7 shadow-sm">
          <button onClick={() => setMode("choice")} className="text-sm font-bold theme-primary">← Back</button>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] theme-primary">Store User</p>
          <h1 className="mt-2 text-3xl font-black">User Login</h1>
          <form onSubmit={login} className="mt-7 space-y-4">
            <label className="block"><span className="label">ID</span><input className="field" value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required /></label>
            <label className="block"><span className="label">Password</span><input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
            {message ? <p className="rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
            <button disabled={loading} className="w-full rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{loading ? "Signing in..." : "Login"}</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-6 text-[var(--school-text)] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Service Request</p>
            <h1 className="mt-1 text-2xl font-black">Welcome, {profile.full_name || "User"}</h1>
            <p className="mt-1 text-sm text-[var(--school-muted)]">{profile.designation || "Community Member"}{profile.department ? ` • ${profile.department}` : ""}</p>
          </div>
          <button onClick={logout} className="rounded-xl border border-[var(--school-border)] px-4 py-2 text-sm font-bold">Logout</button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1"><span className="label">Search Item by Name / Code</span><input className="field" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void loadItems(); } }} placeholder="e.g. ITM-000001 or Cable" /></label>
              <button onClick={() => void loadItems()} className="rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">Search</button>
            </div>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--school-border)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold theme-primary">{item.item_code}</p>
                      <h3 className="font-bold">{item.item_name}</h3>
                      <p className="mt-1 text-xs text-[var(--school-muted)]">{item.specification || item.item_type || ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.current_stock > 0 ? "bg-[var(--school-primary-soft)] theme-primary" : "bg-gray-100 text-gray-500"}`}>{item.stock_status}: {item.current_stock} {item.unit}</span>
                      <button disabled={item.current_stock <= 0} onClick={() => addItem(item)} className="rounded-xl border border-[var(--school-primary-border)] px-4 py-2 text-xs font-bold theme-primary disabled:opacity-40">Select</button>
                    </div>
                  </div>
                </div>
              ))}
              {!items.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Search for an item to see current stock.</p> : null}
            </div>
          </section>

          <form onSubmit={submitSr} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
            <h2 className="text-xl font-black">New SR</h2>
            <p className="mt-1 text-sm text-[var(--school-muted)]">Your profile information is loaded automatically.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label><span className="label">Name</span><input className="field bg-[var(--school-background)]" value={profile.full_name || ""} readOnly /></label>
              <label><span className="label">Department</span><select className="field" value={department} onChange={(e) => setDepartment(e.target.value)} required><option value="">Select department</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="label">Class</span><select className="field" value={className} onChange={(e) => setClassName(e.target.value)}><option value="">Select class</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="label">Profile Role</span><input className="field bg-[var(--school-background)]" value={profile.designation || "Community Member"} readOnly /></label>
            </div>

            <div className="mt-5">
              <p className="label">Selected Items</p>
              <div className="mt-2 space-y-3">
                {selected.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--school-border)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs font-bold theme-primary">{item.item_code}</p><p className="font-bold">{item.item_name}</p><p className="text-xs text-[var(--school-muted)]">Available: {item.current_stock} {item.unit}</p></div>
                      <button type="button" onClick={() => setSelected((current) => current.filter((entry) => entry.id !== item.id))} className="text-xs font-bold text-red-600">Remove</button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label><span className="label">Quantity</span><input className="field" type="number" min="1" max={item.current_stock} value={item.quantity} onChange={(e) => updateSelected(item.id, "quantity", e.target.value)} required /></label>
                      <label><span className="label">Item Details</span><input className="field" value={item.note} onChange={(e) => updateSelected(item.id, "note", e.target.value)} placeholder="Optional" /></label>
                    </div>
                  </div>
                ))}
                {!selected.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-5 text-center text-xs text-[var(--school-muted)]">No items selected yet.</p> : null}
              </div>
            </div>

            <label className="mt-5 block"><span className="label">Additional Details</span><textarea className="field min-h-24 py-3" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Purpose / requirement / other details" /></label>
            {message ? <p className="mt-4 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
            <button disabled={loading || !selected.length} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-50">{loading ? "Submitting..." : "Submit SR"}</button>
          </form>
        </div>

        {sr ? (
          <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7 print:mt-0 print:border-0 print:shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Service Request</p><h2 className="mt-1 text-2xl font-black">{sr.sr_number}</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Status: {sr.status}</p></div>
              <button onClick={() => window.print()} className="rounded-xl border border-[var(--school-border)] px-4 py-2 text-sm font-bold print:hidden">Print / Save PDF</button>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><span className="label">Requester</span><p className="font-semibold">{sr.requester_name}</p></div><div><span className="label">Department</span><p className="font-semibold">{sr.department || "-"}</p></div><div><span className="label">Class</span><p className="font-semibold">{sr.class_name || "-"}</p></div></div>
            <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[var(--school-border)]"><th className="px-3 py-3">Item</th><th className="px-3 py-3">Code</th><th className="px-3 py-3">Requested</th><th className="px-3 py-3">Issued</th></tr></thead><tbody>{sr.items.map((item) => <tr key={item.item_id} className="border-b border-[var(--school-border)]"><td className="px-3 py-3 font-semibold">{item.item_name}</td><td className="px-3 py-3">{item.item_code}</td><td className="px-3 py-3">{item.requested_quantity} {item.unit}</td><td className="px-3 py-3">{item.issued_quantity} {item.unit}</td></tr>)}</tbody></table></div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
