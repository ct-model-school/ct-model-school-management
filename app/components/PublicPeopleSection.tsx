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
  { value: "teacher", label: "Our Teachers" },
  { value: "committee", label: "Management Committee" },
  { value: "staff", label: "Our Staff" },
  { value: "gpa5", label: "GPA-5 Achievers" },
  { value: "scholarship", label: "Scholarship Achievers" },
  { value: "achievement", label: "Other Achievements" },
] as const;

function ContactIcon({ type }: { type: "email" | "phone" | "whatsapp" }) {
  if (type === "email") {
    return <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
  }
  if (type === "phone") {
    return <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M7 4l3 2-1.5 3a14 14 0 0 0 6.5 6.5l3-1.5 2 3c.4.6.2 1.4-.4 1.7l-1.7.9C11.5 20 4 12.5 4.4 5.6l.9-1.7C5.6 3.3 6.4 3.1 7 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  return <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M12 21a9 9 0 1 0-8.3-5.5L3 21l5.7-.7A9 9 0 0 0 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 9.2c.3 3.2 2.1 5.1 5.3 6.3l1.5-1.5-1.6-1.1-1 .8c-1.1-.5-1.8-1.2-2.3-2.3l.8-1-1.1-1.6-1.6.4Z" fill="currentColor" /></svg>;
}

export default function PublicPeopleSection() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

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
    <section className="border-t border-[var(--school-border)] bg-[var(--school-background)] px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] theme-primary">People & Achievements</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Our School Community</h2>
          <p className="mt-4 text-base leading-7 text-[var(--school-muted)]">Meet the teachers, committee members, staff and students who make C.T. Model School special.</p>
        </div>

        <div className="mt-10 space-y-12">
          {categories.map((category) => {
            const items = profiles.filter((profile) => profile.category === category.value);
            if (!items.length) return null;
            return (
              <div key={category.value}>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] theme-primary">{category.label}</p>
                    <h3 className="mt-1 text-2xl font-black">{items.length} Profile{items.length === 1 ? "" : "s"}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
                  {items.map((item) => {
                    const expanded = expandedProfile === item.id;
                    const primary = item.designation || item.committee_position || item.subject || item.achievement_type || item.result_value || item.scholarship_type || "School Community";
                    const description = item.short_description || [item.department, item.class_name, item.section, item.academic_year].filter(Boolean).join(" • ");

                    return (
                      <article key={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                        <div className="aspect-square overflow-hidden bg-[var(--school-primary-soft)]">
                          {item.photo_url ? <img src={item.photo_url} alt={item.full_name} className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}
                        </div>

                        <div className="flex min-h-[205px] flex-1 flex-col p-3 sm:min-h-[220px] sm:p-4">
                          <h4 className="line-clamp-2 text-xs font-extrabold leading-5 sm:text-sm">{item.full_name}</h4>
                          <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-4 theme-primary sm:text-[11px]">{primary}</p>

                          <div className="mt-2 min-h-[48px] text-[10px] leading-4 text-[var(--school-muted)] sm:text-[11px] sm:leading-5">
                            {description ? <p className={expanded ? "" : "line-clamp-3"}>{description}</p> : <p>Meet our school community and learn more about this profile.</p>}
                          </div>

                          <button type="button" onClick={() => setExpandedProfile(expanded ? null : item.id)} className="mt-2 self-start text-[10px] font-extrabold theme-primary hover:underline sm:text-xs">
                            {expanded ? "Show less" : "Read more"}
                          </button>

                          <div className="mt-auto flex items-center justify-center gap-2 border-t border-[var(--school-border)] pt-3 sm:gap-3 sm:pt-4">
                            {item.email ? <a href={`mailto:${item.email}`} aria-label={`Email ${item.full_name}`} title="Email" className="theme-primary flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--school-primary-soft)] transition hover:scale-105"><ContactIcon type="email" /></a> : null}
                            {item.phone ? <a href={`tel:${item.phone.replace(/\s+/g, "")}`} aria-label={`Call ${item.full_name}`} title="Phone" className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 transition hover:scale-105"><ContactIcon type="phone" /></a> : null}
                            {item.whatsapp ? <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${item.full_name}`} title="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:scale-105"><ContactIcon type="whatsapp" /></a> : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>,
    mountNode,
  );
}
