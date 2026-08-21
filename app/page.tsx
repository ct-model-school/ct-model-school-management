"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SchoolSettings = {
  school_name: string | null; school_short_name: string | null; school_motto: string | null; school_headline: string | null; school_description: string | null;
  established_year: number | null; eiin: string | null; board: string | null; principal_name: string | null; principal_message: string | null;
  logo_url: string | null; hero_image: string | null; address: string | null; phone: string | null; whatsapp: string | null; telephone: string | null;
  email: string | null; website: string | null; google_map: string | null; office_time: string | null; facebook: string | null; messenger: string | null;
  instagram: string | null; youtube: string | null; linkedin: string | null; tiktok: string | null;
  hero_badge: string | null; hero_subtitle: string | null; hero_title: string | null; hero_description: string | null;
  hero_button_1_text: string | null; hero_button_1_link: string | null; hero_button_2_text: string | null; hero_button_2_link: string | null;
  show_hero: boolean; hero_auto_slide: boolean; hero_slide_interval: number; hero_transition_speed: number; hero_max_items: number;
};

type HeroSlide = { id: string; image_url: string; storage_path: string; alt_text: string; sort_order: number; is_active: boolean };

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: "C.T. Model School", school_short_name: "CTMS", school_motto: null, school_headline: null, school_description: null,
  established_year: 2010, eiin: null, board: null, principal_name: null, principal_message: null, logo_url: null, hero_image: null,
  address: "Station Road, Kumira, Sitakunda, Chattogram", phone: "+880 1831-988846", whatsapp: null, telephone: null, email: null,
  website: null, google_map: null, office_time: null, facebook: null, messenger: null, instagram: null, youtube: null, linkedin: null, tiktok: null,
  hero_badge: "WELCOME TO C.T. MODEL SCHOOL", hero_subtitle: "A place to learn, grow and build the future.", hero_title: "C.T. Model School",
  hero_description: null, hero_button_1_text: "Explore the School", hero_button_1_link: "#about", hero_button_2_text: "Contact Us", hero_button_2_link: "#contact",
  show_hero: true, hero_auto_slide: true, hero_slide_interval: 5, hero_transition_speed: 600, hero_max_items: 5,
};

const clean = (value: string | null) => value?.trim() || "";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadHome() {
      const [settingsResult, slidesResult] = await Promise.all([
        supabase.from("school_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("hero_slides").select("id,image_url,storage_path,alt_text,sort_order,is_active").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      ]);
      if (!mounted) return;
      if (settingsResult.data) setSettings({ ...DEFAULT_SETTINGS, ...(settingsResult.data as SchoolSettings) });
      if (!slidesResult.error && slidesResult.data?.length) setSlides((slidesResult.data as HeroSlide[]).slice(0, Math.max(1, settingsResult.data?.hero_max_items ?? 5)));
      setLoading(false);
    }
    void loadHome();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    if (slides.length < 2 || !settings.hero_auto_slide) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), Math.max(2, settings.hero_slide_interval || 5) * 1000);
    return () => window.clearInterval(timer);
  }, [slides.length, settings.hero_auto_slide, settings.hero_slide_interval]);

  useEffect(() => { if (activeSlide >= slides.length && slides.length) setActiveSlide(0); }, [activeSlide, slides.length]);

  const schoolName = settings.school_name || DEFAULT_SETTINGS.school_name;
  const heroImages = slides.length ? slides : settings.hero_image ? [{ id: "primary", image_url: settings.hero_image, storage_path: "hero/primary", alt_text: schoolName, sort_order: 0, is_active: true }] : [];
  const logoUrl = clean(settings.logo_url);
  const phone = clean(settings.phone || settings.telephone);
  const whatsapp = clean(settings.whatsapp);
  const email = clean(settings.email);
  const heroTitle = settings.hero_title || settings.school_headline || schoolName;
  const heroDescription = settings.hero_description || settings.school_description || "Welcome to C.T. Model School. Discover our school, community and educational journey.";

  return (
    <main className="min-h-screen bg-[var(--school-background)] text-[var(--school-text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            {logoUrl ? <img src={logoUrl} alt={`${schoolName} logo`} className="h-12 w-16 rounded-lg object-contain" /> : <span className="theme-primary-bg flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold">CT</span>}
            <span className="min-w-0"><span className="block truncate text-sm font-extrabold sm:text-base">{schoolName}</span><span className="block truncate text-xs text-[var(--school-muted)]">{settings.school_short_name || "CTMS"}</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
            <a href="#top" className="theme-primary">Home</a><a href="#about">About</a><a href="#principal">Principal</a><a href="#contact">Contact</a>
          </nav>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-sm font-bold lg:hidden">Menu</button>
        </div>
        {mobileMenuOpen ? <nav className="border-t border-[var(--school-border)] px-5 py-3 lg:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{[["Home","#top"],["About","#about"],["Principal","#principal"],["Contact","#contact"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold">{label}</a>)}</div></nav> : null}
      </header>

      <div id="top" />

      {settings.show_hero ? <>
        <section className="relative w-full overflow-hidden bg-[var(--school-text)]">
          <div className="relative w-full overflow-hidden">
            {heroImages.length ? <img src={heroImages[0].image_url} alt="" aria-hidden="true" className="block h-auto w-full select-none opacity-0" /> : <div className="aspect-video w-full theme-primary-bg" />}
            {heroImages.map((slide, index) => <div key={slide.id} className={`absolute inset-0 h-full w-full overflow-hidden transition-opacity ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`} style={{ transitionDuration: `${Math.max(200, settings.hero_transition_speed || 600)}ms` }}>
              <img src={slide.image_url} alt={String(slide.alt_text || schoolName)} className="block h-full w-full object-cover object-center" />
            </div>)}
            {heroImages.length > 1 ? <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">{heroImages.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "theme-primary-bg w-9" : "w-2.5 bg-white/70"}`} aria-label={`Show hero slide ${index + 1}`} />)}</div> : null}
          </div>
        </section>

        <section className="border-b border-[var(--school-border)] bg-[var(--school-surface)]">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14"><div className="max-w-4xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] theme-primary">{settings.hero_badge || DEFAULT_SETTINGS.hero_badge}</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{heroTitle}</h1>{settings.hero_subtitle ? <p className="mt-4 text-xl font-semibold text-[var(--school-muted)] sm:text-2xl">{settings.hero_subtitle}</p> : null}<p className="mt-5 max-w-3xl text-base leading-8 text-[var(--school-muted)] sm:text-lg">{heroDescription}</p><div className="mt-7 flex flex-wrap gap-3"><a href={settings.hero_button_1_link || "#about"} className="theme-primary-bg rounded-xl px-5 py-3 text-sm font-extrabold text-white">{settings.hero_button_1_text || "Explore the School"}</a><a href={settings.hero_button_2_link || "#contact"} className="rounded-xl border border-[var(--school-primary-border)] px-5 py-3 text-sm font-extrabold">{settings.hero_button_2_text || "Contact Us"}</a></div></div></div>
        </section>
      </> : null}

      <section className="border-b border-[var(--school-border)] bg-[var(--school-surface)]"><div className="mx-auto grid max-w-7xl gap-px bg-[var(--school-border)] sm:grid-cols-2 lg:grid-cols-4">{[["Established", settings.established_year ? String(settings.established_year) : "2010"],["Board", settings.board || "Bangladesh"],["School", settings.school_short_name || "CTMS"],["Location", settings.address || DEFAULT_SETTINGS.address]].map(([label,value]) => <div key={label} className="bg-[var(--school-surface)] px-6 py-7"><p className="text-xs font-extrabold uppercase tracking-[0.14em] theme-primary">{label}</p><p className="mt-2 text-xl font-black leading-7">{value}</p></div>)}</div></section>

      <section id="about" className="scroll-mt-24 px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">About the School</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{settings.school_headline || `Welcome to ${schoolName}`}</h2><p className="mt-6 text-base leading-8 text-[var(--school-muted)]">{settings.school_description || `Learn more about ${schoolName}, its educational journey, school community and the people who make it a place for learning and growth.`}</p>{settings.school_motto ? <div className="mt-7 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-xs font-extrabold uppercase tracking-[0.14em] theme-primary">School Motto</p><p className="mt-2 text-lg font-bold">{settings.school_motto}</p></div> : null}</div><div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-7 shadow-sm sm:p-9"><p className="text-xs font-extrabold uppercase tracking-[0.14em] theme-primary">School Information</p><div className="mt-6 divide-y divide-[var(--school-border)]">{[["Established",settings.established_year ? String(settings.established_year) : ""],["EIIN",settings.eiin || ""],["Board",settings.board || ""],["Address",settings.address || ""]].filter(([,v]) => v).map(([label,value]) => <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-4"><span className="text-sm font-bold text-[var(--school-muted)]">{label}</span><span className="text-sm font-semibold">{value}</span></div>)}</div></div></div></section>

      {settings.principal_name || settings.principal_message ? <section id="principal" className="scroll-mt-24 border-y border-[var(--school-border)] bg-[var(--school-surface)] px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.35fr_.65fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">Message from the Principal</p><h2 className="mt-3 text-3xl font-black tracking-tight">{settings.principal_name || "Principal"}</h2></div><blockquote className="border-l-4 border-[var(--school-primary)] pl-6 text-lg leading-8 text-[var(--school-muted)]">{settings.principal_message || "Welcome to our school community."}</blockquote></div></section> : null}

      <section id="contact" className="scroll-mt-24 px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl theme-primary-bg p-8 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75">Contact</p><h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Get in touch with {schoolName}</h2><p className="mt-4 max-w-xl leading-7 text-white/75">For school information, admission enquiries or other official communication, use the contact details below.</p><div className="mt-8 space-y-3 text-sm font-semibold text-white">{settings.address ? <p>{settings.address}</p> : null}{phone ? <p><a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a></p> : null}{whatsapp ? <p><a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}>WhatsApp: {whatsapp}</a></p> : null}{email ? <p><a href={`mailto:${email}`}>{email}</a></p> : null}{settings.office_time ? <p>{settings.office_time}</p> : null}</div></div><div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-8 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">Official Links</p><div className="mt-6 space-y-3">{[["Facebook",settings.facebook],["Messenger",settings.messenger],["Instagram",settings.instagram],["YouTube",settings.youtube],["LinkedIn",settings.linkedin],["Website",settings.website]].filter(([,url]) => url).map(([label,url]) => <a key={label} href={url as string} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-[var(--school-border)] px-4 py-3 text-sm font-bold"><span>{label}</span><span className="theme-primary">↗</span></a>)}{!settings.facebook && !settings.messenger && !settings.instagram && !settings.youtube && !settings.linkedin && !settings.website ? <p className="text-sm leading-6 text-[var(--school-muted)]">Official links will appear here when configured from Admin Settings.</p> : null}</div></div></div></section>

      <footer className="border-t border-[var(--school-border)] bg-[var(--school-surface)] px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--school-muted)] sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[var(--school-text)]">{schoolName}</p><p className="mt-1">{settings.address || DEFAULT_SETTINGS.address}</p></div><div className="text-left sm:text-right"><p>{settings.school_motto || "C.T. Model School"}</p><p className="mt-1">© {new Date().getFullYear()} {schoolName}. All rights reserved.</p></div></div></footer>
      {loading ? <div className="pointer-events-none fixed bottom-5 right-5 rounded-full border border-[var(--school-border)] bg-[var(--school-surface)] px-4 py-2 text-xs font-semibold text-[var(--school-muted)] shadow-sm">Loading school information…</div> : null}
    </main>
  );
}
