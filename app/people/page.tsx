import { createServerSupabaseClient } from "@/lib/supabase/server";

const categories = [
  { value: "teacher", label: "Our Teachers", icon: "🎓" },
  { value: "committee", label: "Management Committee", icon: "🏛️" },
  { value: "staff", label: "Our Staff", icon: "👥" },
  { value: "gpa5", label: "GPA-5 Achievers", icon: "🏆" },
  { value: "scholarship", label: "Scholarship Achievers", icon: "🎖️" },
  { value: "achievement", label: "Other Achievements", icon: "⭐" },
] as const;

function whatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `880${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

function Icon({ type }: { type: "mail" | "phone" | "whatsapp" }) {
  if (type === "mail") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5"><path d="M4 6h16v12H4zM4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
  if (type === "phone") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5"><path d="M7.2 3.5 5.5 4.7c-1.1.8-1.5 2.2-1 3.5 2 5.3 6 9.3 11.3 11.3 1.3.5 2.7.1 3.5-1l1.2-1.7-3.5-2.8-2 1.8a13.7 13.7 0 0 1-4.3-4.3l1.8-2-2.8-3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5"><path d="M20 4.2A9.8 9.8 0 0 0 4.5 16.3L3 21l4.8-1.5A9.8 9.8 0 1 0 20 4.2Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 7.8c.2-.4.4-.4.7-.4h.6c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.7.9c.8 1.3 1.8 2.3 3.1 3.1l.9-.7c.2-.2.4-.2.7-.1l1.9.8c.3.1.4.3.4.5v.6c0 .3 0 .5-.4.7-1 .5-2.2.4-3.4-.1-2.1-.9-4.9-3.7-5.8-5.8-.5-1.2-.6-2.4-.1-3.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

const categoryStyle = {
  backgroundColor: "color-mix(in srgb, var(--school-primary) 7%, var(--school-surface))",
  borderColor: "color-mix(in srgb, var(--school-primary) 22%, var(--school-border))",
};

export default async function PeoplePage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("people_profiles")
    .select("id,category,full_name,photo_url,designation,department,subject,committee_position,class_name,section,academic_year,exam_name,result_value,achievement_type,scholarship_type,short_description,email,phone,whatsapp,qualification")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  const profiles = data ?? [];

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-10 text-[var(--school-text)] md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] theme-primary">Community & Achievements</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Our School Community</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">Meet the teachers, committee members, staff and students who make C.T. Model School special.</p>
        </header>

        <nav className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Community categories">
          {categories.map((item) => (
            <a key={item.value} href={`#${item.value}`} className="shrink-0 rounded-full border bg-[var(--school-surface)] px-4 py-2.5 text-xs font-extrabold text-[var(--school-muted)] shadow-sm transition hover:-translate-y-0.5 hover:text-[var(--school-primary)]" style={categoryStyle}>
              <span className="mr-1.5">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>

        <div className="mt-9 space-y-14">
          {categories.map((category) => {
            const items = profiles.filter((profile) => profile.category === category.value);
            if (items.length === 0) return null;

            return (
              <section key={category.value} id={category.value} className="scroll-mt-24">
                <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border bg-[var(--school-surface)] px-5 py-4 shadow-sm" style={categoryStyle}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl theme-primary-bg text-lg text-white shadow-sm">{category.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] theme-primary">School Community</p>
                      <h2 className="mt-0.5 truncate text-xl font-black tracking-tight sm:text-2xl">{category.label}</h2>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-black theme-primary shadow-sm sm:text-xs">{items.length} {items.length === 1 ? "Profile" : "Profiles"}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => {
                    const isStudent = item.category === "gpa5" || item.category === "scholarship";
                    const primaryInfo = isStudent
                      ? "Student"
                      : item.designation || item.committee_position || item.subject || item.achievement_type || item.result_value || item.scholarship_type || "School Community";
                    const metaInfo = [item.department, item.class_name, item.section, item.academic_year].filter(Boolean).join(" • ");
                    const hasDetails = Boolean(item.short_description || metaInfo || item.exam_name || item.result_value || item.scholarship_type);

                    return (
                      <article key={item.id} className="group relative flex min-h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-[0_5px_18px_rgba(15,23,42,.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--school-primary-border)] hover:shadow-[0_16px_36px_rgba(15,23,42,.14)]">
                        <div className="h-2 theme-primary-bg" />
                        <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
                          <div className="mx-auto aspect-[4/5] max-w-[205px] overflow-hidden rounded-2xl border-[3px] border-[var(--school-primary)] bg-[var(--school-primary-soft)] shadow-inner">
                            {item.photo_url ? <img src={item.photo_url} alt={item.full_name} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col px-3 pb-4 pt-3 text-center sm:px-4 sm:pb-5">
                          <h3 className="line-clamp-2 text-sm font-black leading-5 text-[var(--school-text)] sm:text-base">{item.full_name}</h3>

                          {isStudent ? (
                            <>
                              <p className="mt-2 text-[9px] leading-4 text-[var(--school-muted)] sm:text-[10px]">{item.result_value || "Result not available"}</p>
                              {metaInfo ? <p className="mt-0.5 text-[9px] font-semibold leading-4 text-[var(--school-muted)] sm:text-[10px]">Class/Dept: {metaInfo}</p> : null}
                              {item.exam_name ? <p className="mt-0.5 text-[9px] font-semibold leading-4 text-[var(--school-muted)] sm:text-[10px]">{item.exam_name}</p> : null}
                              {hasDetails ? (
                                <details className="mt-3 text-left">
                                  <summary className="cursor-pointer list-none text-center text-[10px] font-extrabold theme-primary hover:underline sm:text-xs">Read more</summary>
                                  <div className="mt-2.5 space-y-1.5 rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] p-2.5 text-[9px] leading-4 sm:text-[10px] sm:leading-5">
                                    {item.exam_name ? <p><strong className="font-extrabold text-[var(--school-text)]">Exam:</strong> {item.exam_name}</p> : null}
                                    {item.result_value ? <p><strong className="font-extrabold text-[var(--school-text)]">Result:</strong> {item.result_value}</p> : null}
                                    {item.scholarship_type ? <p><strong className="font-extrabold text-[var(--school-text)]">Scholarship:</strong> {item.scholarship_type}</p> : null}
                                    {item.short_description ? <p><strong className="font-extrabold text-[var(--school-text)]">About:</strong> {item.short_description}</p> : null}
                                    {metaInfo ? <p><strong className="font-extrabold text-[var(--school-text)]">Class:</strong> {metaInfo}</p> : null}
                                  </div>
                                </details>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <span className="mx-auto mt-2 max-w-full rounded-sm theme-primary-bg px-2.5 py-1 text-[9px] font-black uppercase leading-3 text-white sm:text-[10px]">{primaryInfo}</span>
                              {category.value === "teacher" && item.qualification ? <p className="mt-1.5 line-clamp-2 text-[9px] font-semibold leading-4 text-[var(--school-muted)] sm:text-[10px]">{item.qualification}</p> : null}
                              {metaInfo ? <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[var(--school-muted)] sm:text-[10px]">{metaInfo}</p> : null}
                              {item.short_description ? <p className="mt-2 line-clamp-3 text-[9px] leading-4 text-[var(--school-muted)] sm:text-[10px]">{item.short_description}</p> : null}

                              {hasDetails ? (
                                <details className="mt-3 text-left">
                                  <summary className="cursor-pointer list-none text-center text-[10px] font-extrabold theme-primary hover:underline sm:text-xs">Read more</summary>
                                  <div className="mt-2.5 space-y-1.5 rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] p-2.5 text-[9px] leading-4 sm:text-[10px] sm:leading-5">
                                    {item.short_description ? <p><strong className="font-extrabold text-[var(--school-text)]">About:</strong> {item.short_description}</p> : null}
                                    {metaInfo ? <p><strong className="font-extrabold text-[var(--school-text)]">Class/Dept:</strong> {metaInfo}</p> : null}
                                    {item.exam_name ? <p><strong className="font-extrabold text-[var(--school-text)]">Exam:</strong> {item.exam_name}</p> : null}
                                    {item.result_value ? <p><strong className="font-extrabold text-[var(--school-text)]">Result:</strong> {item.result_value}</p> : null}
                                    {item.scholarship_type ? <p><strong className="font-extrabold text-[var(--school-text)]">Scholarship:</strong> {item.scholarship_type}</p> : null}
                                  </div>
                                </details>
                              ) : null}
                            </>
                          )}

                          {(item.email || item.phone || item.whatsapp) ? (
                            <div className="mt-auto flex items-center justify-center gap-2 border-t border-dashed border-[var(--school-border)] pt-4 sm:gap-3">
                              {item.email ? <a href={`mailto:${item.email}`} aria-label={`Email ${item.full_name}`} title={item.email} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--school-primary-soft)] theme-primary transition hover:scale-110"><Icon type="mail" /></a> : null}
                              {item.phone ? <a href={`tel:${item.phone}`} aria-label={`Call ${item.full_name}`} title={item.phone} className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 transition hover:scale-110"><Icon type="phone" /></a> : null}
                              {item.whatsapp ? <a href={whatsappUrl(item.whatsapp)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${item.full_name}`} title={item.whatsapp} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:scale-110"><Icon type="whatsapp" /></a> : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="h-1 theme-primary-bg opacity-80" />
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {profiles.length === 0 ? <div className="mt-10 rounded-3xl border border-dashed border-[var(--school-primary-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">Profiles will appear here after they are added from the Admin Community & Achievements module.</div> : null}
      </div>
    </main>
  );
}
