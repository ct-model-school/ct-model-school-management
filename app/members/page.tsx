"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MemberType = "teacher" | "staff" | "accounts" | "other";

const memberTypes: Array<{ key: MemberType; title: string; subtitle: string; icon: string }> = [
  { key: "teacher", title: "Teachers", subtitle: "Teacher dashboard & academic work", icon: "🎓" },
  { key: "staff", title: "Staff", subtitle: "Staff dashboard & assigned work", icon: "👥" },
  { key: "accounts", title: "Accounts", subtitle: "Accounts dashboard & finance work", icon: "💼" },
  { key: "other", title: "Others", subtitle: "Role-based member dashboard", icon: "🧩" },
];

export default function MemberLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<MemberType | null>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function choose(type: MemberType) {
    setSelected(type);
    setLoginId("");
    setPassword("");
    setMessage("");
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("store_login", {
      p_login_id: loginId.trim(),
      p_password: password,
      p_member_type: selected,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const result = data as { token?: string } | null;
    if (!result?.token) {
      setMessage("Login session could not be created.");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("ct_member_session", result.token);
    sessionStorage.setItem("ct_member_type", selected);
    router.replace("/members/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-8 text-[var(--school-text)] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] theme-primary">C.T. Model School</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Member Portal</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--school-muted)] sm:text-base">
              Choose your member category. Login access, dashboard features and work areas are controlled by your assigned role and permissions.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {memberTypes.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => choose(item.key)}
                className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selected === item.key ? "theme-primary-bg text-white" : "border-[var(--school-border)] bg-[var(--school-background)]"}`}
              >
                <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                <h2 className="mt-4 text-xl font-black">{item.title}</h2>
                <p className={`mt-2 text-xs leading-5 ${selected === item.key ? "text-white/80" : "text-[var(--school-muted)]"}`}>{item.subtitle}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">Administration</p>
              <h2 className="mt-2 text-xl font-black">Admin Login</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">Continue to the separate administrator dashboard.</p>
            </button>
            <button
              type="button"
              onClick={() => router.push("/members/forgot-password")}
              className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--school-primary-border)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">Account Help</p>
              <h2 className="mt-2 text-xl font-black">Forgot Password?</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--school-muted)]">Send a password-reset request to the school administrator.</p>
            </button>
          </div>

          {selected ? (
            <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-[var(--school-border)] bg-[var(--school-background)] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] theme-primary">{memberTypes.find((item) => item.key === selected)?.title} Login</p>
                  <h2 className="mt-1 text-2xl font-black">Sign in to your dashboard</h2>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Change</button>
              </div>

              <form onSubmit={login} className="mt-6 space-y-4">
                <label className="block">
                  <span className="label">Member ID</span>
                  <input className="field w-full" value={loginId} onChange={(event) => setLoginId(event.target.value)} placeholder="e.g. TCID000003" autoComplete="username" required />
                </label>
                <label className="block">
                  <span className="label">Password</span>
                  <input className="field w-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
                </label>

                {message ? <p className="rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary" role="alert">{message}</p> : null}

                <button disabled={loading} className="w-full rounded-xl px-5 py-3.5 text-sm font-black theme-primary-bg disabled:opacity-60">
                  {loading ? "Signing in..." : `Login as ${memberTypes.find((item) => item.key === selected)?.title.replace(/s$/, "")}`}
                </button>
                <button type="button" onClick={() => router.push("/members/forgot-password")} className="w-full text-center text-xs font-bold theme-primary">Forgot password?</button>
              </form>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
