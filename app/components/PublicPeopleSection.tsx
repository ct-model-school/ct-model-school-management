"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  category: string;
  full_name: string;
  photo_url: string | null;
  designation: string | null;
  department: string | null;
  subject: string | null;
  committee_position: string | null;
  class_name: string | null;
  section: string | null;
  academic_year: string | null;
  result_value: string | null;
  achievement_type: string | null;
  scholarship_type: string | null;
  short_description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const categories = [
  { value: "teacher", label: "Our Teachers", icon: "🎓" },
  { value: "committee", label: "Management Committee", icon: "🏛️" },
  { value: "staff", label: "Our Staff", icon: "👥" },
  { value: "gpa5", label: "GPA-5 Achievers", icon: "🏆" },
  { value: "scholarship", label: "Scholarship Achievers", icon: "🎖️" },
  { value: "achievement", label: "Other Achievements", icon: "⭐" },
] as const;

function ContactIcon({ type }: { type: "email" | "phone" | "whatsapp" }) {
  if (type === "email") return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
  if (type === "phone") return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true"><path d="M7 4l3 2-1.5 3a14 14 0 0 0 6.5 6.5l3-1.5 2 3c.4.6.2 1.4-.4 1.7l-1.7.9C11.5 20 4 12.5 4.4 5.6l.9-1.7C5.6 3.3 6.4 3.1 7 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true"><path d="M12 21a9 9 0 1 0-8.3-5.5L3 21l5.7-.7A9 9 0 0 0 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 9.2c.3 3.2 2.1 5.1 5.3 6.3l1.5-1.5-1.6-1.1-1 .8c-1.1-.5-1.8-1.2-2.3-2.3l.8-1-1.1-1.6-1.6.4Z" fill="currentColor" /></svg>;
}

function primaryInfo(item: Profile) {
  return item.designation || item.committee_position || item.subject || item.achievement_type || item.result_value || item.scholarship_type || "School Community";
}

export default function PublicPeopleSection() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const footer = document.querySelector("footer");
    if (!footer?.parentElement) return;
    const node = document.createElement("div");
    node.id = "public-people-section";
    footer.parentElement.insertBefore(node, footer);
    setMountNode(node);
    return () => node.remove();
  }, []);

  useEffect(() => {
    if (!mountNode) return;
    let mounted = true;
    const supabase = createClient();
    void supabase
      .from("people_profiles")
      .select("id,category,full_name,photo_url,designation,department,subject,committee_position,class_name,section,academic_year,result_value,achievement_type,scholarship_type,short_description,email,phone,whatsapp")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        if (mounted) setProfiles((data ?? []) as Profile[]);
      });
    return () => { mounted = false; };
  }, [mountNode]);

  if (!mountNode || profiles.length === 0) return null;

  return createPortal(
    <section className="border-t border-[var(--school-border)] bg-[var(--school-background)] px-5 py-14 lg:px-8 lg:py-18">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] theme-primary">People & Achievements</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Our School Community</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--school-muted)] sm:text-base">Meet the teachers, committee members, staff and students who make C.T. Model School special.</p>
        </div>

        <div className="mt-9 space-y-12">
          {categories.map((category) => {
            const items = profiles.filter((profile) => profile.category === category.value);
            if (!items.length) return null;
            const visibleItems = items.slice(0, 4);
            return (
              <section key={category.value} id={`home-${category.value}`}>
                <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border bg-[var(--school-surface)] px-4 py-3.5" style={{ backgroundColor: "color-mix(in srgb, var(--school-primary) 6%, var(--school-surface))", borderColor: "color-mix(in srgb, var(--school-primary) 20%, var(--school-border))" }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl theme-primary-bg text-base text-white shadow-sm">{category.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] theme-primary">School Community</p>
                      <h3 className="truncate text-lg font-black tracking-tight sm:text-xl">{category.label}</h3>
                    </div>
                  </div>
                  <a href={`/people#${category.value}`} className="shrink-0 rounded-full border border-[var(--school-primary-border)] bg-[var(--school-surface)] px-3 py-1.5 text-[10px] font-extrabold theme-primary transition hover:-translate-y-0.5 sm:px-4 sm:text-xs">See more</a>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {visibleItems.map((item) => {
                    const meta = [item.department, item.class_name, item.section, item.academic_year].filter(Boolean).join(" • ");
                    const primary = primaryInfo(item);
                    return (
                      <article key={item.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-[0_5px_18px_rgba(15,23,42,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,.14)]">
                        <div className="h-2 theme-primary-bg" />
                        <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
                          <div className="absolute left-3 top-3 rounded-full bg-[var(--school-surface)]/90 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] theme-primary shadow-sm sm:left-4 sm:top-4">{category.label}</div>
                          <div className="mx-auto aspect-[4/5] max-w-[190px] overflow-hidden rounded-2xl border-[3px] border-[var(--school-primary)] bg-[var(--school-primary-soft)] shadow-inner">
                            {item.photo_url ? <img src={item.photo_url} alt={item.full_name} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col px-3 pb-3 pt-3 text-center sm:px-4 sm:pb-4">
                          <h4 className="line-clamp-2 text-sm font-black leading-5 text-[var(--school-text)] sm:text-base">{item.full_name}</h4>
                          <span className="mx-auto mt-2 max-w-full rounded-sm theme-primary-bg px-2.5 py-1 text-[9px] font-black uppercase leading-3 text-white sm:text-[10px]">{primary}</span>
                          {meta ? <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[var(--school-muted)] sm:text-[10px]">{meta}</p> : null}
                          {item.short_description ? <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[var(--school-muted)] sm:text-[10px]">{item.short_description}</p> : null}

                          {(item.email || item.phone || item.whatsapp) ? (
                            <div className="mt-3 flex items-center justify-center gap-2 border-t border-dashed border-[var(--school-border)] pt-3">
                              {item.email ? <a href={`mailto:${item.email}`} aria-label={`Email ${item.full_name}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--school-primary-soft)] theme-primary transition hover:scale-110"><ContactIcon type="email" /></a> : null}
                              {item.phone ? <a href={`tel:${item.phone.replace(/\s+/g, "")}`} aria-label={`Call ${item.full_name}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-500 transition hover:scale-110"><ContactIcon type="phone" /></a> : null}
                              {item.whatsapp ? <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${item.full_name}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:scale-110"><ContactIcon type="whatsapp" /></a> : null}
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
      </div>
    </section>,
    mountNode,
  );
}
