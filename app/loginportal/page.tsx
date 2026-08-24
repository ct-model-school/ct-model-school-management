"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./loginportal.module.css";

type LoginType = {
  id: "admin" | "teacher" | "staff" | "accounts" | "other" | "parent" | "student" | "committee";
  label: string;
  description: string;
  prefix: string;
  icon: string;
  canRegister?: boolean;
};

const LOGIN_TYPES: LoginType[] = [
  { id: "admin", label: "Admin", description: "School administration", prefix: "ADMIN", icon: "A" },
  { id: "teacher", label: "Teacher", description: "Teaching & academics", prefix: "TCID", icon: "T" },
  { id: "staff", label: "Staff", description: "Staff & operations", prefix: "STID", icon: "S" },
  { id: "accounts", label: "Accounts", description: "Accounts & finance", prefix: "ACID", icon: "C" },
  { id: "other", label: "Other Member", description: "Other school members", prefix: "OTID", icon: "O" },
  { id: "parent", label: "Parent", description: "Parent & guardian access", prefix: "PARENT", icon: "P", canRegister: true },
  { id: "student", label: "Student", description: "Student access", prefix: "STUDENT", icon: "S", canRegister: true },
  { id: "committee", label: "Committee", description: "Management committee access", prefix: "COMMITTEE", icon: "M", canRegister: true },
];

export default function LoginPortalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<LoginType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectLoginType(type: LoginType) {
    setSelected(type);
    setShowPassword(false);
    setMemberId("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selected) return;

    if (selected.id !== "admin") {
      setError("This account type is not connected yet. Please use Admin for now.");
      return;
    }

    if (!memberId.trim() || !password) {
      setError("Please enter your Admin ID / Username and password.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: memberId.trim(),
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
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.shell} aria-label="C.T. Model School login portal">
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>CT</div>
          <div><p className={styles.schoolName}>C.T. Model School</p><p className={styles.systemName}>Digital Management System</p></div>
        </div>

        <div className={styles.header}>
          <span className={styles.eyebrow}>SECURE ACCESS</span>
          <h1>Login Portal</h1>
          <p>Select your account type to continue.</p>
        </div>

        <div className={styles.typeGrid}>
          {LOGIN_TYPES.map((type) => {
            const active = selected?.id === type.id;
            return <button key={type.id} type="button" className={`${styles.typeCard} ${active ? styles.typeCardActive : ""}`} onClick={() => selectLoginType(type)} aria-pressed={active}>
              <span className={styles.typeIcon}>{type.icon}</span>
              <span className={styles.typeContent}><strong>{type.label}</strong><small>{type.description}</small></span>
              <span className={styles.chevron} aria-hidden="true">›</span>
            </button>;
          })}
        </div>

        <div className={`${styles.formPanel} ${selected ? styles.formPanelVisible : ""}`}>
          {selected ? <>
            <div className={styles.selectedHeader}>
              <div><span className={styles.selectedEyebrow}>{selected.label.toUpperCase()}</span><h2>Sign in to your account</h2></div>
              <button type="button" className={styles.changeButton} onClick={() => setSelected(null)}>Change</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>{selected.id === "admin" ? "Admin ID / Username" : "Member ID / Username"}</span>
                {selected.id === "admin" ? (
                  <div className={styles.inputWrap}>
                    <span className={styles.inputPrefix}>{selected.prefix}</span>
                    <input name="memberId" type="text" value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="Enter your Admin ID" autoComplete="username" inputMode="email" required />
                  </div>
                ) : (
                  <div className={styles.selectWrap}>
                    <span className={styles.inputPrefix}>{selected.prefix}</span>
                    <select name="memberId" defaultValue="" aria-label="Select your ID" disabled>
                      <option value="" disabled>Select your ID</option>
                    </select>
                  </div>
                )}
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <div className={styles.passwordWrap}>
                  <input name="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
                  <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
                </div>
              </label>

              {error ? <div className={styles.errorMessage} role="alert">{error}</div> : null}

              <div className={styles.formActions}>
                <div className={styles.secondaryActions}>
                  <button type="button" className={styles.forgotButton}>Forgot Password?</button>
                  {selected.canRegister && <a className={styles.registerButton} href={`/register?type=${selected.id}`}>Register</a>}
                </div>
                <button type="submit" className={styles.loginButton} disabled={loading}>{loading ? "Signing in..." : <>Login <span aria-hidden="true">→</span></>}</button>
              </div>
            </form>
          </> : <div className={styles.emptyState}><span className={styles.emptyIcon}>→</span><div><strong>Choose your account type</strong><p>Your Member ID and password fields will appear here.</p></div></div>}
        </div>

        <footer className={styles.footer}><span>Authorized school access</span><span className={styles.footerDot}>•</span><span>C.T. Model School</span></footer>
      </section>
    </main>
  );
}
