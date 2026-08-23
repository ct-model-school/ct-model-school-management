import styles from "./members-mobile.module.css";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
