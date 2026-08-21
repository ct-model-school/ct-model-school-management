"use client";

import { useEffect, useState } from "react";
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
type Person = { id: string; category: string; full_name: string; photo_url: string | null; designation: string | null; committee_position: string | null; subject: string | null; short_description: string | null; email: string | null; phone: string | null; whatsapp: string | null };

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
function normalizeHomeLink(value: string | null | undefined, fallback: string) { const link = clean(value ?? null); if (!link) return fallback; if (link === "/about" || link === "/about/" || link.endsWith("/about") || link.endsWith("/about/")) return "#about"; if (link === "/contact" || link === "/contact/" || link.endsWith("/contact") || link.endsWith("/contact/")) return "#contact"; return link; }
function buildMapEmbedUrl(value: string | null, fallbackAddress: string) {
  const raw = clean(value);
  const build = (query: string) =>
    `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=k&z=17&ie=UTF8&iwloc=B&output=embed`;

  if (!raw) return build(fallbackAddress);

  // Keep an Admin Settings supplied Google Maps embed URL untouched.
  // This lets Google retain its interactive controls and saved view state.
  if (/google\.com\/maps\/embed/i.test(raw) || /[?&]output=embed(?:&|$)/i.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const query = url.searchParams.get("q") || url.searchParams.get("query");
    if (query) return build(query);

    const coords = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (coords) return build(`${coords[1]},${coords[2]}`);

    const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch?.[1]) return build(decodeURIComponent(placeMatch[1].replace(/\+/g, " ")));
  } catch {}

  return build(raw);
}

function ContactIcon({ type }: { type: "email" | "phone" | "whatsapp" }) {
  if (type === "email") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M4 6h16v12H4zM4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
  if (type === "phone") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M7 4l3 2-1.5 3a14 14 0 0 0 6.5 6.5l3-1.5 2 3c.4.6.2 1.4-.4 1.7l-1.7.9C11.5 20 4 12.5 4.4 5.6l.9-1.7C5.6 3.3 6.4 3.1 7 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M12 21a9 9 0 1 0-8.3-5.5L3 21l5.7-.7A9 9 0 0 0 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 9.2c.3 3.2 2.1 5.1 5.3 6.3l1.5-1.5-1.6-1.1-1 .8c-1.1-.5-1.8-1.2-2.3-2.3l.8-1-1.1-1.6-1.6.4Z" fill="currentColor" /></svg>;
}

export default function Home() {
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  useEffect(() => { let mounted = true; const supabase = createClient(); async function loadHome() { const [settingsResult, slidesResult, peopleResult] = await Promise.all([supabase.from("school_settings").select("*").eq("id", 1).maybeSingle(), supabase.from("hero_slides").select("id,image_url,storage_path,alt_text,sort_order,is_active").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }), supabase.from("people_profiles").select("id,category,full_name,photo_url,designation,committee_position,subject,short_description,email,phone,whatsapp").eq("is_active", true).order("display_order", { ascending: true }).order("full_name", { ascending: true }).limit(5)]); if (!mounted) return; if (settingsResult.data) setSettings({ ...DEFAULT_SETTINGS, ...(settingsResult.data as SchoolSettings) }); if (!slidesResult.error && slidesResult.data?.length) setSlides((slidesResult.data as HeroSlide[]).slice(0, Math.max(1, settingsResult.data?.hero_max_items ?? 5))); if (!peopleResult.error) setPeople((peopleResult.data ?? []) as Person[]); } void loadHome(); return () => { mounted = false; }; }, []);
  useEffect(() => { if (slides.length < 2 || !settings.hero_auto_slide) return; const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), Math.max(2, settings.hero_slide_interval || 5) * 1000); return () => window.clearInterval(timer); }, [slides.length, settings.hero_auto_slide, settings.hero_slide_interval]);
  useEffect(() => { if (activeSlide >= slides.length && slides.length) setActiveSlide(0); }, [activeSlide, slides.length]);
  const schoolName = settings.school_name || DEFAULT_SETTINGS.school_name;
  const heroImages = slides.length ? slides : settings.hero_image ? [{ id: "primary", image_url: settings.hero_image, storage_path: "hero/primary", alt_text: schoolName, sort_order: 0, is_active: true }] : [];
  const logoUrl = clean(settings.logo_url); const phone = clean(settings.phone || settings.telephone); const whatsapp = clean(settings.whatsapp); const email = clean(settings.email);
  const heroTitle = settings.hero_title || settings.school_headline || schoolName; const heroDescription = settings.hero_description || settings.school_description || "Welcome to C.T. Model School. Discover our school, community and educational journey.";
  const heroButton1Link = normalizeHomeLink(settings.hero_button_1_link, "#about"); const heroButton2Link = normalizeHomeLink(settings.hero_button_2_link, "#contact");
  const mapLink = clean(settings.google_map);
  const mapSrc = buildMapEmbedUrl(mapLink, settings.address || DEFAULT_SETTINGS.address || "");
  return (<main className="min-h-screen bg-[var(--school-background)] text-[var(--school-text)]">
    <header className="sticky top-0 z-50 border-b border-[var(--school-border)] bg-[var(--school-surface)]/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8"><a href="#top" className="flex min-w-0 items-center gap-3">{logoUrl ? <img src={logoUrl} alt={`${schoolName} logo`} className="h-12 w-16 rounded-lg object-contain" /> : <span className="theme-primary-bg flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold">CT</span>}<span className="min-w-0"><span className="block whitespace-nowrap text-xl font-black leading-tight sm:text-2xl lg:text-3xl">{schoolName}</span></span></a><nav className="hidden items-center gap-7 text-sm font-semibold lg:flex"><a href="#top" className="theme-primary">Home</a><a href="#about">About</a><a href="#principal">Principal</a><a href="#contact">Contact</a></nav><button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-sm font-bold lg:hidden">Menu</button></div>{mobileMenuOpen ? <nav className="border-t border-[var(--school-border)] px-5 py-3 lg:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{[["Home","#top"],["About","#about"],["Principal","#principal"],["Contact","#contact"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold">{label}</a>)}</div></nav> : null}</header><div id="top" />
    {settings.show_hero ? <><section className="relative w-full overflow-hidden bg-[var(--school-text)]"><div className="relative w-full overflow-hidden">{heroImages.length ? <img src={heroImages[0].image_url} alt="" aria-hidden="true" className="block h-auto w-full select-none opacity-0" /> : <div className="aspect-video w-full theme-primary-bg" />}{heroImages.map((slide, index) => <div key={slide.id} className={`absolute inset-0 h-full w-full overflow-hidden transition-opacity ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`} style={{ transitionDuration: `${Math.max(200, settings.hero_transition_speed || 600)}ms` }}><img src={slide.image_url} alt={String(slide.alt_text || schoolName)} className="block h-full w-full object-cover object-center sm:object-center max-sm:object-contain" /></div>)}{heroImages.length > 1 ? <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">{heroImages.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "theme-primary-bg w-9" : "w-2.5 bg-white/70"}`} aria-label={`Show hero slide ${index + 1}`} />)}</div> : null}</div></section><section className="border-b border-[var(--school-border)] bg-[var(--school-surface)]"><div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14"><div className="max-w-4xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] theme-primary">{settings.hero_badge || DEFAULT_SETTINGS.hero_badge}</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{heroTitle}</h1>{settings.hero_subtitle ? <p className="mt-4 text-xl font-semibold text-[var(--school-muted)] sm:text-2xl">{settings.hero_subtitle}</p> : null}<p className="mt-5 max-w-3xl text-base leading-8 text-[var(--school-muted)] sm:text-lg">{heroDescription}</p><div className="mt-7 flex flex-wrap gap-3"><a href={heroButton1Link} className="theme-primary-bg rounded-xl px-5 py-3 text-sm font-extrabold text-white">{settings.hero_button_1_text || "Explore the School"}</a><a href={heroButton2Link} className="rounded-xl border border-[var(--school-primary-border)] px-5 py-3 text-sm font-extrabold">{settings.hero_button_2_text || "Contact Us"}</a></div></div></div></section></> : null}
    <section className="border-b border-[var(--school-border)] bg-[var(--school-surface)]"><div className="mx-auto flex max-w-7xl flex-wrap items-stretch justify-start gap-3 bg-[var(--school-surface)] px-3 py-3 sm:grid sm:grid-cols-2 sm:gap-px sm:bg-[var(--school-border)] sm:px-0 sm:py-0 lg:grid-cols-4">{[["Established", settings.established_year ? String(settings.established_year) : "2010"],["Board", settings.board || "Bangladesh"],["School", settings.school_short_name || "CTMS"],["Location", settings.address || DEFAULT_SETTINGS.address]].map(([label,value], index) => <div key={label} className={`min-w-0 overflow-hidden bg-[var(--school-surface)] px-4 py-3 sm:px-6 sm:py-7 ${index > 1 ? "hidden sm:block" : "rounded-2xl border border-[var(--school-primary-border)] shadow-sm sm:rounded-none sm:border-0 sm:shadow-none"}`}><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] theme-primary sm:text-xs">{label}</p><p className="mt-1.5 break-words text-base font-black leading-6 sm:mt-2 sm:text-xl sm:leading-7">{value}</p></div>)}</div></section>
    <section id="about" className="scroll-mt-24 px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">About the School</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{settings.school_headline || `Welcome to ${schoolName}`}</h2><p className="mt-6 text-base leading-8 text-[var(--school-muted)]">{settings.school_description || `Learn more about ${schoolName}, its educational journey, school community and the people who make it a place for learning and growth.`}</p>{settings.school_motto ? <div className="mt-7 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-xs font-extrabold uppercase tracking-[0.14em] theme-primary">School Motto</p><p className="mt-2 text-lg font-bold">{settings.school_motto}</p></div> : null}</div><div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-7 shadow-sm sm:p-9"><p className="text-xs font-extrabold uppercase tracking-[0.14em] theme-primary">School Information</p><div className="mt-6 divide-y divide-[var(--school-border)]">{[["Established",settings.established_year ? String(settings.established_year) : ""],["EIIN",settings.eiin || ""],["Board",settings.board || ""],["Address",settings.address || ""]].filter(([,v]) => v).map(([label,value]) => <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-4"><span className="text-sm font-bold text-[var(--school-muted)]">{label}</span><span className="text-sm font-semibold">{value}</span></div>)}</div></div></div></section>
    {settings.principal_name || settings.principal_message ? <section id="principal" className="scroll-mt-24 border-y border-[var(--school-border)] bg-[var(--school-surface)] px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.35fr_.65fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">Message from the Principal</p><h2 className="mt-3 text-3xl font-black tracking-tight">{settings.principal_name || "Principal"}</h2></div><blockquote className="border-l-4 border-[var(--school-primary)] pl-6 text-lg leading-8 text-[var(--school-muted)]">{settings.principal_message || "Welcome to our school community."}</blockquote></div></section> : null}
    <section id="contact" className="scroll-mt-24 px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl theme-primary-bg p-8 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75">Contact</p><h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Get in touch with {schoolName}</h2><p className="mt-4 max-w-xl leading-7 text-white/75">For school information, admission enquiries or other official communication, use the contact details below.</p><div className="mt-8 space-y-3 text-sm font-semibold text-white">{settings.address ? <p>{settings.address}</p> : null}{phone ? <p><a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a></p> : null}{whatsapp ? <p><a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}>WhatsApp: {whatsapp}</a></p> : null}{email ? <p><a href={`mailto:${email}`}>{email}</a></p> : null}{settings.office_time ? <p>{settings.office_time}</p> : null}</div></div><div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-8 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">Official Links</p><div className="mt-6 grid grid-cols-2 gap-3">{[["Facebook",settings.facebook],["Messenger",settings.messenger],["Instagram",settings.instagram],["YouTube",settings.youtube],["LinkedIn",settings.linkedin],["Website",settings.website]].filter(([,url]) => url).map(([label,url]) => <a key={label} href={url as string} target="_blank" rel="noreferrer" className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--school-border)] px-3 py-3 text-sm font-bold sm:px-4"><span className="truncate">{label}</span><span className="theme-primary shrink-0">↗</span></a>)}{!settings.facebook && !settings.messenger && !settings.instagram && !settings.youtube && !settings.linkedin && !settings.website ? <p className="col-span-2 text-sm leading-6 text-[var(--school-muted)]">Official links will appear here when configured from Admin Settings.</p> : null}</div></div></div>
      <div className="mx-auto mt-8 max-w-7xl overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm"><div className="flex items-center justify-between gap-4 border-b border-[var(--school-border)] px-5 py-4 sm:px-7"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] theme-primary">Our Location</p><h3 className="mt-1 text-lg font-black sm:text-xl">{schoolName}</h3><p className="mt-1 text-xs text-[var(--school-muted)]">{settings.address || DEFAULT_SETTINGS.address}</p></div>{mapLink ? <a href={mapLink} target="_blank" rel="noreferrer" className="hidden rounded-xl border border-[var(--school-primary-border)] px-4 py-2 text-xs font-extrabold theme-primary sm:inline-flex">Open in Maps ↗</a> : null}</div><div className="relative h-[320px] w-full sm:h-[380px] lg:h-[410px]"><iframe title={`${schoolName} location map`} src={mapSrc} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div><div className="flex items-center justify-end px-5 py-3 sm:px-7 sm:hidden">{mapLink ? <a href={mapLink} target="_blank" rel="noreferrer" className="text-xs font-extrabold theme-primary">Open in Google Maps ↗</a> : null}</div></div>
    </section>
    {people.length > 0 ? <section className="px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm sm:p-7"><div className="mb-7"><p className="text-xs font-extrabold uppercase tracking-[0.18em] theme-primary">PEOPLE & ACHIEVEMENTS</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Our School Community</h2><p className="mt-3 text-sm leading-6 text-[var(--school-muted)] sm:text-base">Meet the teachers, committee members, staff and students who make C.T. Model School special.</p></div><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">{people.map((person) => { const description = clean(person.short_description); const expanded = expandedPerson === person.id; const primary = person.designation || person.committee_position || person.subject || "School Community"; return <article key={person.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] transition hover:-translate-y-1 hover:shadow-lg"><div className="aspect-square overflow-hidden bg-[var(--school-primary-soft)]">{person.photo_url ? <img src={person.photo_url} alt={person.full_name} className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}</div><div className="flex min-h-[220px] flex-1 flex-col p-3 sm:p-4"><h3 className="line-clamp-2 text-xs font-extrabold leading-5 sm:text-sm">{person.full_name}</h3><p className="mt-1 line-clamp-2 text-[10px] font-bold leading-4 theme-primary sm:text-[11px]">{primary}</p><div className="mt-2 min-h-[48px] text-[10px] leading-4 text-[var(--school-muted)] sm:text-[11px] sm:leading-5">{description ? <p className={expanded ? "" : "line-clamp-3"}>{description}</p> : <p>Meet our school community and learn more about this profile.</p>}</div><button type="button" onClick={() => setExpandedPerson(expanded ? null : person.id)} className="mt-2 self-start text-[10px] font-extrabold theme-primary hover:underline sm:text-xs">{expanded ? "Show less" : "Read more"}</button><div className="mt-auto flex items-center justify-center gap-3 border-t border-[var(--school-border)] pt-4">{person.email ? <a href={`mailto:${person.email}`} aria-label={`Email ${person.full_name}`} title="Email" className="theme-primary flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--school-primary-soft)] transition hover:scale-105"><ContactIcon type="email" /></a> : null}{person.phone ? <a href={`tel:${person.phone.replace(/\s+/g, "")}`} aria-label={`Call ${person.full_name}`} title="Phone" className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 transition hover:scale-105"><ContactIcon type="phone" /></a> : null}{person.whatsapp ? <a href={`https://wa.me/${person.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${person.full_name}`} title="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:scale-105"><ContactIcon type="whatsapp" /></a> : null}</div></div></article>; })}</div><div className="mt-6 text-center"><a href="/people" className="text-sm font-bold theme-primary hover:underline">View all Community & achievements</a></div></div></section> : null}
    <footer className="theme-primary-bg border-t border-white/15 px-5 py-8 text-white" style={{ backgroundColor: "var(--school-primary)" }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">{schoolName}</p>
            <p className="text-xs text-white/75">{settings.address || DEFAULT_SETTINGS.address}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-white/75">© {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
            <a href="/admin/login" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/75 opacity-70 blur-[0.15px] transition hover:bg-white/15 hover:text-white hover:opacity-100 hover:blur-0">
              Admin Login
            </a>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-white/75">
            Developed by <span className="font-semibold text-white">Shafa Abid Automation BD</span>
          </p>

          <div className="flex items-center gap-3">
            {clean(settings.facebook) ? (
              <a
                href={clean(settings.facebook)}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20 hover:scale-105"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                  <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2H8v2.8h2.5v7h3Z" />
                </svg>
              </a>
            ) : null}

            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20 hover:scale-105"
              >
                <ContactIcon type="whatsapp" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  </main>);
}