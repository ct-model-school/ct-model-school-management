import { createServerSupabaseClient } from "@/lib/supabase/server";

const categories = [
  { value: "teacher", label: "Our Teachers" },
  { value: "committee", label: "Management Committee" },
  { value: "staff", label: "Our Staff" },
  { value: "gpa5", label: "GPA-5 Achievers" },
  { value: "scholarship", label: "Scholarship Achievers" },
  { value: "achievement", label: "Other Achievements" },
] as const;

export default async function PeoplePage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("people_profiles")
    .select("id,category,full_name,photo_url,designation,department,subject,committee_position,class_name,section,academic_year,exam_name,result_value,achievement_type,scholarship_type,short_description")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  const profiles = data ?? [];

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-10 text-[var(--school-text)] md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] theme-primary">People & Achievements</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Our School Community</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">Meet the teachers, committee members, staff and students who make C.T. Model School special.</p>
        </header>

        <nav className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Profile categories">
          {categories.map((item) => (
            <a
              key={item.value}
              href={`#${item.value}`}
              className="shrink-0 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-4 py-2 text-xs font-bold text-[var(--school-muted)] transition hover:border-[var(--school-primary-border)] hover:text-[var(--school-primary)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-12">
          {categories.map((category) => {
            const items = profiles.filter((profile) => profile.category === category.value);
            if (items.length === 0) return null;

            return (
              <section key={category.value} id={category.value}>
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">{category.label}</p>
                  <h2 className="mt-1 text-2xl font-bold">{items.length} Profile{items.length === 1 ? "" : "s"}</h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => {
                    const primaryInfo =
                      item.designation ||
                      item.committee_position ||
                      item.subject ||
                      item.achievement_type ||
                      item.result_value ||
                      item.scholarship_type ||
                      "School Community";

                    const secondaryInfo =
                      item.short_description ||
                      [item.department, item.class_name, item.section, item.academic_year]
                        .filter(Boolean)
                        .join(" • ");

                    return (
                      <article
                        key={item.id}
                        className="group overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[var(--school-primary-border)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)]"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--school-primary-soft)]">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.full_name}
                              className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.025]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />
                        </div>

                        <div className="px-3 py-3 sm:px-4 sm:py-4">
                          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[var(--school-text)] sm:text-base">
                            {item.full_name}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-4 theme-primary sm:text-xs">
                            {primaryInfo}
                          </p>
                          {secondaryInfo ? (
                            <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[var(--school-muted)] sm:text-xs sm:leading-5">
                              {secondaryInfo}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {profiles.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">
            Profiles will appear here after they are added from the Admin People & Achievements module.
          </div>
        ) : null}
      </div>
    </main>
  );
}
