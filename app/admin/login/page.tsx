"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("shafa.ctmodel@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-label="C.T. Model School admin login">
        <div className="admin-login-brand">
          <div className="admin-login-brand-mark" aria-hidden="true">
            CT
          </div>

          <div>
            <div className="admin-login-school-name">C.T. Model School</div>
            <div className="admin-login-system-name">Digital Management System</div>
          </div>
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-eyebrow">ADMINISTRATION</span>
          <h1>Welcome back</h1>
          <p>Sign in to continue to the school management system.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-login-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="Enter your email"
              required
            />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="admin-login-button"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="admin-login-footer">
          <span>Authorized access only</span>
          <span>•</span>
          <span>C.T. Model School</span>
        </div>
      </section>
    </main>
  );
}
