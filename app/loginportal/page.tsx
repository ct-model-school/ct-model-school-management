"use client";

import { useState } from "react";
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
  const [selected, setSelected] = useState<LoginType | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
            return <button key={type.id} type="button" className={`${styles.typeCard} ${active ? styles.typeCardActive : ""}`} onClick={() => { setSelected(type); setShowPassword(false); }} aria-pressed={active}>
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

            <form onSubmit={(event) => event.preventDefault()} className={styles.form}>
              <label className={styles.field}>
                <span>Member ID / Username</span>
                <div className={styles.selectWrap}>
                  <span className={styles.inputPrefix}>{selected.prefix}</span>
                  <select name="memberId" defaultValue="" aria-label="Select Member ID or Username">
                    <option value="" disabled>Select your Member ID</option>
                    <option value="placeholder">Enter or select your ID</option>
                  </select>
                </div>
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <div className={styles.passwordWrap}>
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" />
                  <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
                </div>
              </label>

              <div className={styles.formActions}>
                <div className={styles.secondaryActions}>
                  <button type="button" className={styles.forgotButton}>Forgot Password?</button>
                  {selected.canRegister && <a className={styles.registerButton} href={`/register?type=${selected.id}`}>Register</a>}
                </div>
                <button type="submit" className={styles.loginButton}>Login <span aria-hidden="true">→</span></button>
              </div>
            </form>
          </> : <div className={styles.emptyState}><span className={styles.emptyIcon}>→</span><div><strong>Choose your account type</strong><p>Your Member ID and password fields will appear here.</p></div></div>}
        </div>

        <footer className={styles.footer}><span>Authorized school access</span><span className={styles.footerDot}>•</span><span>C.T. Model School</span></footer>
      </section>
    </main>
  );
}
