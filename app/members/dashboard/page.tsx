"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PermissionMap = Record<string, boolean>;
type Profile = {
  user_id: string;
  member_record_id: string | null;
  member_id: string;
  member_type: string;
  access_role: string;
  role_name: string;
  permissions: PermissionMap;
  full_name: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  designation: string | null;
  department: string | null;
  subject: string | null;
  qualification: string | null;
  salary: number | null;
  details: string | null;
};

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

type SelectedItem = Item & { quantity: number; note: string };

type SrResult = {
  sr_number: string;
  status: string;
};

const classes = ["Play", "Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "SSC", "HSC"];
const departments = ["Administration", "Academic", "Accounts", "Examination", "Library", "ICT", "Maintenance", "Store", "Other"];

const featureCards = [
  { key: "students", title: "Students", text: "Student work available to your role.", icon: "👨‍🎓" },
  { key: "results", title: "Results", text: "Result entry and result access.", icon: "📊" },
  { key: "accounts", title: "Accounts", text: "Finance and account work assigned to your role.", icon: "💼" },
  { key: "inventory", title: "Inventory", text: "Inventory work assigned to your role.", icon: "📦" },
  { key: "notices", title: "Notices", text: "School notices available to your role.", icon: "📢" },
  { key: "people", title: "People", text: "Community and profile-related access.", icon: "👥" },
];

export default function MemberDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [className, setClassName] = useState("");
  const [department, setDepartment] = useState("");
  const [srDetails, setSrDetails] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const activeToken = sessionStorage.getItem("ct_member_session") || "";
    if (!activeToken) {
      router.replace("/members");
      return;
    }
    setToken(activeToken);
    void loadProfile(activeToken);
  }, [router]);

  async function loadProfile(activeToken: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("store_get_current_user", { p_token: activeToken });
    if (error) {
      sessionStorage.removeItem("ct_member_session");
      sessionStorage.removeItem("ct_member_type");
      router.replace("/members");
      return;
    }
    setProfile(data as Profile);
    setLoading(false);
  }

  function has(permission: string) {
    return profile?.permissions?.[permission] === true;
  }

  async function loadItems(query = itemSearch) {
    if (!token || !has("sr")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("store_list_items", { p_token: token, p_search: query || null });
    if (error) setMessage(error.message);
    else setItems((data ?? []) as Item[]);
    setBusy(false);
  }

  function addItem(item: Item) {
    setSelected((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) return current.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.min(entry.quantity + 1, Number(item.current_stock)) } : entry);
      return [...current, { ...item, quantity: 1, note: "" }];
    });
  }

  function updateSelected(id: string, field: "quantity" | "note", value: string) {
    setSelected((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "quantity" ? Math.max(1, Number(value) || 1) : value } : item));
  }

  async function submitSr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length) {
      setMessage("Select at least one item.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("store_submit_sr", {
      p_token: token,
      p_class_name: className,
      p_department: department,
      p_request_details: srDetails,
      p_items: selected.map((item) => ({ item_id: item.id, quantity: item.quantity, note: item.note || null })),
    });
    if (error) {
      setMessage(error.message);
    } else {
      const result = data as SrResult;
      setMessage(`SR ${result.sr_number} submitted successfully.`);
      setSelected([]);
      setSrDetails("");
      setClassName("");
      setDepartment("");
    }
    setBusy(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("store_change_password", {
      p_token: token,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
    setBusy(false);
  }

  async function logout() {
    if (token) await supabase.rpc("store_logout", { p_token: token });
    sessionStorage.removeItem("ct_member_session");
    sessionStorage.removeItem("ct_member_type");
    router.replace("/members");
  }

  if (loading) {
    return <main className="min-h-screen bg-[var(--school-background)] p-6 text-center text-sm text-[var(--school-muted)]">Loading your dashboard...</main>;
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-5 text-[var(--school-text)] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {profile.photo_url ? <img src={profile.photo_url} alt={profile.full_name} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--school-primary-soft)] text-2xl">👤</div>}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">{profile.member_type} dashboard</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">Welcome, {profile.full_name}</h1>
                <p className="mt-1 text-sm text-[var(--school-muted)]">{profile.member_id} • {profile.designation || profile.role_name}{profile.department ? ` • ${profile.department}` : ""}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-sm font-bold">Change Password</button>
              <button type="button" onClick={() => void logout()} className="rounded-xl px-4 py-2.5 text-sm font-bold theme-primary-bg">Logout</button>
            </div>
          </div>
        </header>

        {message ? <p className="mt-4 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary" role="alert">{message}</p> : null}

        {showPassword ? (
          <form onSubmit={changePassword} className="mt-4 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">Security</p><h2 className="mt-1 text-xl font-black">Change your password</h2></div><button type="button" onClick={() => setShowPassword(false)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Close</button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label><span className="label">Current Password</span><input className="field w-full" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
              <label><span className="label">New Password</span><input className="field w-full" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
              <label><span className="label">Confirm New Password</span><input className="field w-full" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label>
            </div>
            <button disabled={busy} className="mt-4 rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{busy ? "Updating..." : "Update Password"}</button>
          </form>
        ) : null}

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.filter((card) => has(card.key)).map((card) => (
            <article key={card.key} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm">
              <div className="text-2xl">{card.icon}</div>
              <h2 className="mt-3 text-lg font-black">{card.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--school-muted)]">{card.text}</p>
            </article>
          ))}
          {has("sr") ? <article className="rounded-3xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5 shadow-sm"><div className="text-2xl">🧾</div><h2 className="mt-3 text-lg font-black theme-primary">Service Request (SR)</h2><p className="mt-1 text-sm leading-6 text-[var(--school-muted)]">Search item codes, select items, enter quantities and submit an SR using your own profile.</p></article> : null}
        </section>

        <section className="mt-5 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">My Profile</p>
              <h2 className="mt-1 text-2xl font-black">Personal & role information</h2>
              <p className="mt-2 text-sm text-[var(--school-muted)]">Only your own member information is shown here. Other members and the administrator dashboard are separate.</p>
            </div>
            <span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1.5 text-xs font-black theme-primary">{profile.role_name}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Member ID", profile.member_id], ["Role", profile.role_name], ["Designation", profile.designation], ["Department", profile.department],
              ["Subject", profile.subject], ["Qualification", profile.qualification], ["Email", profile.email], ["Phone", profile.phone], ["WhatsApp", profile.whatsapp],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-4"><p className="text-xs font-bold text-[var(--school-muted)]">{label}</p><p className="mt-1 break-words text-sm font-bold">{value || "Not provided"}</p></div>)}
          </div>
        </section>

        {has("sr") ? (
          <section className="mt-5 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">Role Permission: SR</p>
              <h2 className="mt-1 text-2xl font-black">Create Service Request</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Your name, Member ID, role and contact details come from your logged-in profile automatically.</p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1"><span className="label">Search Item by Code / Name</span><input className="field w-full" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void loadItems(); } }} placeholder="e.g. ITM-000001" /></label>
                  <button type="button" onClick={() => void loadItems()} disabled={busy} className="rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">Search</button>
                </div>
                <div className="mt-4 space-y-3">
                  {items.map((item) => <article key={item.id} className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black theme-primary">{item.item_code}</p><h3 className="font-black">{item.item_name}</h3><p className="mt-1 text-xs text-[var(--school-muted)]">{item.specification || item.item_type || ""}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-[var(--school-primary-soft)] px-3 py-1 text-xs font-bold theme-primary">{item.current_stock} {item.unit}</span><button type="button" disabled={item.current_stock <= 0} onClick={() => addItem(item)} className="rounded-xl border border-[var(--school-primary-border)] px-4 py-2 text-xs font-bold theme-primary disabled:opacity-40">Select</button></div></div></article>)}
                  {!items.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Search an item to select it for your SR.</p> : null}
                </div>
              </div>

              <form onSubmit={submitSr} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-background)] p-5">
                <h3 className="text-xl font-black">SR Details</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label><span className="label">Member Name</span><input className="field w-full" value={profile.full_name} readOnly /></label>
                  <label><span className="label">Member ID</span><input className="field w-full" value={profile.member_id} readOnly /></label>
                  <label><span className="label">Department</span><select className="field w-full" value={department} onChange={(e) => setDepartment(e.target.value)} required><option value="">Select department</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span className="label">Class</span><select className="field w-full" value={className} onChange={(e) => setClassName(e.target.value)}><option value="">Select class</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
                </div>

                <div className="mt-4"><p className="label">Selected Items</p><div className="mt-2 space-y-3">{selected.map((item) => <div key={item.id} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black theme-primary">{item.item_code}</p><p className="font-bold">{item.item_name}</p><p className="text-xs text-[var(--school-muted)]">Available: {item.current_stock} {item.unit}</p></div><button type="button" onClick={() => setSelected((current) => current.filter((entry) => entry.id !== item.id))} className="text-xs font-bold text-red-600">Remove</button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className="label">Quantity</span><input className="field w-full" type="number" min="1" max={item.current_stock} value={item.quantity} onChange={(e) => updateSelected(item.id, "quantity", e.target.value)} required /></label><label><span className="label">Item Details</span><input className="field w-full" value={item.note} onChange={(e) => updateSelected(item.id, "note", e.target.value)} placeholder="Optional" /></label></div></div>)}{!selected.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-6 text-center text-xs text-[var(--school-muted)]">No items selected yet.</p> : null}</div></div>
                <label className="mt-4 block"><span className="label">Request Details</span><textarea className="field min-h-24 w-full py-3" value={srDetails} onChange={(e) => setSrDetails(e.target.value)} placeholder="Purpose, notes or additional information..." /></label>
                <button disabled={busy || !selected.length} className="mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-black theme-primary-bg disabled:opacity-50">{busy ? "Processing..." : "Submit Service Request"}</button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
