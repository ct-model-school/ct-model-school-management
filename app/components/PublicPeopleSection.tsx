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
};

const categories = [
  { value: "teacher", label: "Our Teachers" },
  { value: "committee", label: "Management Committee" },
  { value: "staff", label: "Our Staff" },
  { value: "gpa5", label: "GPA-5 Achievers" },
  { value: "scholarship", label: "Scholarship Achievers" },
  { value: "achievement", label: "Other Achievements" },
] as const;

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
      .select("id,category,full_name,photo_url,designation,department,subject,committee_position,class_name,section,academic_year,result_value,achievement_type,scholarship_type,short_description")
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {items.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="aspect-[4/5] bg-[var(--school-primary-soft)]">
                        {item.photo_url ? <img src={item.photo_url} alt={item.full_name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}
                      </div>
                      <div className="p-4">
                        <h4 className="line-clamp-2 font-bold">{item.full_name}</h4>
                        <p className="mt-1 text-xs font-semibold theme-primary">{item.designation || item.committee_position || item.subject || item.achievement_type || item.result_value || item.scholarship_type || "School Community"}</p>
                        <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--school-muted)]">{item.short_description || [item.department, item.class_name, item.section, item.academic_year].filter(Boolean).join(" • ")}</p>
                      </div>
                    </article>
                  ))}
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
