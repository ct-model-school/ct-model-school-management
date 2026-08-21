import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[var(--school-background)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold theme-primary">
            C.T. Model School
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Admin Dashboard
              </h1>

              <p className="mt-2 text-slate-500">
                {profile.full_name || profile.email}
              </p>
            </div>

            <span className="w-fit rounded-full px-4 py-2 text-xs font-bold text-white theme-primary-bg">
              {profile.role.name}
            </span>
          </div>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Students", "Student records and registration"],
            ["Accounts", "Income, expense, fees and payroll"],
            ["Inventory", "Stock, handover and takeover"],
            ["Management", "Academic and financial overview"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="mb-5 h-2 w-16 rounded-full theme-primary-bg" />

              <h2 className="text-lg font-bold text-slate-900">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
