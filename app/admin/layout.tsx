import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

const primaryNavigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Settings" },
];

const upcomingModules = [
  "Students",
  "Parents & Guardians",
  "Teachers & Staff",
  "Accounts & Finance",
  "Inventory",
  "Notices & Results",
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return children;
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[var(--school-background)] text-[var(--school-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--school-border)] bg-[var(--school-surface)] lg:flex lg:flex-col">
          <div className="border-b border-[var(--school-border)] px-6 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">
              C.T. Model School
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--school-text)]">
              Digital Management System
            </p>
          </div>

          <nav className="flex-1 space-y-7 px-4 py-6" aria-label="Admin navigation">
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--school-muted)]">
                Administration
              </p>
              <div className="mt-2 space-y-1">
                {primaryNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--school-text)] transition hover:bg-[var(--school-primary-soft)] hover:text-[var(--school-primary)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--school-muted)]">
                Modules
              </p>
              <div className="mt-2 space-y-1">
                {upcomingModules.map((label) => (
                  <span
                    key={label}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[var(--school-muted)]"
                  >
                    {label}
                    <span className="rounded-full border border-[var(--school-border)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                      Soon
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </nav>

          <div className="border-t border-[var(--school-border)] p-4">
            <div className="rounded-2xl bg-[var(--school-primary-soft)] p-4">
              <p className="truncate text-sm font-bold text-[var(--school-text)]">
                {profile.full_name || profile.email}
              </p>
              <p className="mt-1 text-xs theme-primary">{profile.role.name}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 px-5 py-4 backdrop-blur md:px-8 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--school-text)]">C.T. Model School</p>
                <p className="mt-0.5 text-xs theme-primary">Administration</p>
              </div>
              <Link
                href="/admin/settings"
                className="rounded-xl border border-[var(--school-primary-border)] px-3 py-2 text-xs font-bold theme-primary"
              >
                Settings
              </Link>
            </div>
          </header>

          <main className="min-w-0 p-5 md:p-8 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
