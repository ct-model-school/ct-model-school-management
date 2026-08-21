import { createServerSupabaseClient } from "@/lib/supabase/server";

const categories = [
  { value: "teacher", label: "Our Teachers" },
  { value: "committee", label: "Management Committee" },
  { value: "staff", label: "Our Staff" },
  { value: "gpa5", label: "GPA-5 Achievers" },
  { value: "scholarship", label: "Scholarship Achievers" },
  { value: "achievement", label: "Other Achievements" },
] as const;

function whatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `880${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

function Icon({ type }: { type: "mail" | "phone" | "whatsapp" }) {
  if (type === "mail") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m4 8 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>;
  }
  if (type === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M7.2 3.5 5.5 4.7c-1.1.8-1.5 2.2-1 3.5 2 5.3 6 9.3 11.3 11.3 1.3.5 2.7.1 3.5-1l1.2-1.7-3.5-2.8-2 1.8a13.7 13.7 0 0 1-4.3-4.3l1.8-2-2.8-3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M20 4.2A9.8 9.8 0 0 0 4.5 16.3L3 21l4.8-1.5A9.8 9.8 0 1 0 20 4.2Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 7.8c.2-.4.4-.4.7-.4h.6c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.7.9c.8 1.3 1.8 2.3 3.1 3.1l.9-.7c.2-.2.4-.2.7-.1l1.9.8c.3.1.4.3.4.5v.6c0 .3 0 .5-.4.7-1 .5-2.2.4-3.4-.1-2.1-.9-4.9-3.7-5.8-5.8-.5-1.2-.6-2.4-.1-3.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default async function PeoplePage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("people_profiles")
    .select("id,category,full_name,photo_url,designation,department,subject,committee_position,class_name,section,academic_year,exam_name,result_value,achievement_type,scholarship_type,short_description,email,phone,whatsapp")
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
            <a key={item.value} href={`#${item.value}`} className="shrink-0 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-4 py-2 text-xs font-bold text-[var(--school-muted)] transition hover:border-[var(--school-primary-border)] hover:text-[var(--school-primary)]">{item.label}</a>
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
                    const primaryInfo = item.designation || item.committee_position || item.subject || item.achievement_type || item.result_value || item.scholarship_type || "School Community";
                    const metaInfo = [item.department, item.class_name, item.section, item.academic_year].filter(Boolean).join(" • ");
                    const hasDetails = Boolean(item.short_description || metaInfo || item.exam_name || item.result_value || item.scholarship_type);

                    return (
                      <article key={item.id} className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[var(--school-primary-border)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)]">
                        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--school-primary-soft)]">
                          {item.photo_url ? <img src={item.photo_url} alt={item.full_name} className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />
                        </div>

                        <div className="flex flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
                          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[var(--school-text)] sm:text-base">{item.full_name}</h3>
                          <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-4 theme-primary sm:text-xs">{primaryInfo}</p>

                          {hasDetails ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer list-none text-[10px] font-bold theme-primary sm:text-xs">Read more</summary>
                              <div className="mt-2 space-y-1 text-[10px] leading-4 text-[var(--school-muted)] sm:text-xs sm:leading-5">
                                {item.short_description ? <p>{item.short_description}</p> : null}
                                {metaInfo ? <p>{metaInfo}</p> : null}
                                {item.exam_name ? <p>Exam: {item.exam_name}</p> : null}
                                {item.result_value ? <p>Result: {item.result_value}</p> : null}
                                {item.scholarship_type ? <p>Scholarship: {item.scholarship_type}</p> : null}
                              </div>
                            </details>
                          ) : <span className="mt-2 text-[10px] font-bold theme-primary sm:text-xs">Read more</span>}

                          {(item.email || item.phone || item.whatsapp) ? (
                            <div className="mt-auto flex items-center justify-center gap-3 border-t border-[var(--school-border)] pt-3 sm:gap-4">
                              {item.email ? <a href={`mailto:${item.email}`} aria-label={`Email ${item.full_name}`} title={item.email} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--school-primary-soft)] text-[var(--school-primary)] transition hover:scale-105"><Icon type="mail" /></a> : null}
                              {item.phone ? <a href={`tel:${item.phone}`} aria-label={`Call ${item.full_name}`} title={item.phone} className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition hover:scale-105"><Icon type="phone" /></a> : null}
                              {item.whatsapp ? <a href={whatsappUrl(item.whatsapp)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${item.full_name}`} title={item.whatsapp} className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600 transition hover:scale-105"><Icon type="whatsapp" /></a> : null}
                            </div>
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

        {profiles.length === 0 ? <div className="mt-10 rounded-3xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">Profiles will appear here after they are added from the Admin People & Achievements module.</div> : null}
      </div>
    </main>
  );
}
