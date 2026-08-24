"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CurrentUser = {
  member_id: string;
  member_type: string;
  access_role: string;
  role_name: string;
  permissions: Record<string, boolean>;
  full_name: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  subject: string | null;
};

type Module = { key: string; label: string; description: string; icon: string };

const modules: Module[] = [
  { key: "dashboard", label: "Dashboard", description: "Your role-based overview", icon: "⌂" },
  { key: "profile", label: "Profile", description: "View your member profile", icon: "P" },
  { key: "item_sr", label: "Item SR", description: "Create and view service requests", icon: "SR" },
  { key: "attendance", label: "Attendance", description: "Access attendance features", icon: "A" },
  { key: "notices", label: "Notices", description: "View school notices", icon: "N" },
];

export default function MemberDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadUser() {
      const token = window.localStorage.getItem("ctms_store_token");
      if (!token) {
        router.replace("/loginportal");
        return;
      }
      const { data, error: userError } = await supabase.rpc("store_get_current_user", { p_token: token });
      if (!active) return;
      if (userError) {
        window.localStorage.removeItem("ctms_store_token");
        setError(userError.message);
        router.replace("/loginportal");
        return;
      }
      setUser(data as CurrentUser);
      setLoading(false);
    }
    void loadUser();
    return () => { active = false; };
  }, [router, supabase]);

  async function logout() {
    const token = window.localStorage.getItem("ctms_store_token");
    if (token) await supabase.rpc("store_logout", { p_token: token });
    window.localStorage.removeItem("ctms_store_token");
    router.replace("/loginportal");
  }

  if (loading) {
    return <main className="min-h-screen bg-[var(--school-background)] p-6"><div className="mx-auto max-w-5xl rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">Loading your dashboard...</div></main>;
  }

  if (!user) {
    return <main className="min-h-screen bg-[var(--school-background)] p-6"><div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">{error || "Unable to load your account."}</div></main>;
  }

  const visibleModules = modules.filter((module) => Boolean(user.permissions?.[module.key]));

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--school-primary-soft)] font-black theme-primary">
              {user.photo_url ? <img src={user.photo_url} alt="" className="h-full w-full object-cover" /> : "CT"}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">C.T. Model School</p>
              <h1 className="mt-1 truncate text-xl font-black text-[var(--school-text)] sm:text-2xl">Welcome, {user.full_name}</h1>
              <p className="mt-1 text-xs text-[var(--school-muted)]">{user.member_id} • {user.member_type} • {user.role_name}</p>
            </div>
          </div>
          <button type="button" onClick={() => void logout()} className="rounded-xl border border-[var(--school-border)] px-4 py-2.5 text-xs font-bold text-[var(--school-text)] hover:bg-[var(--school-primary-soft)]">Logout</button>
        </header>

        <section className="mb-6 rounded-3xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Role Access</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-xl font-black text-[var(--school-text)]">{user.role_name}</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Only the modules granted to this role are shown below.</p></div>
            <span className="w-fit rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-xs font-bold theme-primary">{visibleModules.length} permitted</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((module) => (
            <article key={module.key} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--school-primary-soft)] text-xs font-black theme-primary">{module.icon}</div>
                <div className="min-w-0 flex-1"><h3 className="text-base font-black text-[var(--school-text)]">{module.label}</h3><p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">{module.description}</p></div>
              </div>
              <div className="mt-5 flex items-center justify-between"><span className="rounded-full bg-[var(--school-primary-soft)] px-2.5 py-1 text-[10px] font-black theme-primary">ACCESS GRANTED</span><span className="text-xs font-bold theme-primary">›</span></div>
            </article>
          ))}
        </section>

        <section id="profile" className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Profile</p><h2 className="mt-1 text-lg font-black">Account information</h2></div><span className="rounded-full border border-[var(--school-border)] px-3 py-1 text-[10px] font-bold">{user.access_role}</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">Member ID</p><p className="mt-1 text-sm font-bold">{user.member_id}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">Designation</p><p className="mt-1 text-sm font-bold">{user.designation || "-"}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">Department</p><p className="mt-1 text-sm font-bold">{user.department || "-"}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">Subject</p><p className="mt-1 text-sm font-bold">{user.subject || "-"}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">Email</p><p className="mt-1 break-words text-sm font-bold">{user.email || "-"}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">Phone</p><p className="mt-1 text-sm font-bold">{user.phone || "-"}</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
