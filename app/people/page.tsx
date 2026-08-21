import Image from "next/image";
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
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">Meet the people who teach, lead, support and represent C.T. Model School.</p>
        </header>

        <nav className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Profile categories">
          {categories.map((item) => <a key={item.value} href={`#${item.value}`} className="shrink-0 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-4 py-2 text-xs font-bold text-[var(--school-muted)] hover:border-[var(--school-primary-border)] hover:text-[var(--school-primary)]">{item.label}</a>)}
        </nav>

        <div className="mt-8 space-y-12">
          {categories.map((category) => {
            const items = profiles.filter((profile) => profile.category === category.value);
            if (items.length === 0) return null;
            return (
              <section key={category.value} id={category.value}>
                <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">{category.label}</p><h2 className="mt-1 text-2xl font-bold">{items.length} Profile{items.length === 1 ? "" : "s"}</h2></div></div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {items.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="relative aspect-[4/5] bg-[var(--school-primary-soft)]">
                        {item.photo_url ? <Image src={item.photo_url} alt={item.full_name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 font-bold text-[var(--school-text)]">{item.full_name}</h3>
                        <p className="mt-1 text-xs font-semibold theme-primary">{item.designation || item.committee_position || item.subject || item.achievement_type || item.result_value || item.scholarship_type || "School Community"}</p>
                        <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--school-muted)]">{item.short_description || [item.department, item.class_name, item.section, item.academic_year].filter(Boolean).join(" • ") || ""}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {profiles.length === 0 ? <div className="mt-10 rounded-3xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">Profiles will appear here after they are added from the Admin People & Achievements module.</div> : null}
      </div>
    </main>
  );
}
