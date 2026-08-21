"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";

const DEFAULT_COLOR = "#1E3A5F";

type SchoolSettings = {
  id: number;
  school_name: string; school_short_name: string; school_motto: string; school_headline: string; school_description: string;
  established_year: number | null; eiin: string; board: string; principal_name: string; principal_message: string;
  logo_url: string; favicon_url: string; hero_image: string;
  address: string; phone: string; whatsapp: string; telephone: string; email: string; website: string; google_map: string; office_time: string;
  facebook: string; messenger: string; instagram: string; youtube: string; linkedin: string; tiktok: string;
  theme_color: string;
  hero_badge: string; hero_subtitle: string; hero_title: string; hero_description: string;
  hero_button_1_text: string; hero_button_1_link: string; hero_button_2_text: string; hero_button_2_link: string;
  show_hero: boolean; hero_auto_slide: boolean; hero_slide_interval: number; hero_transition_speed: number; hero_max_items: number;
  meta_title: string; meta_description: string; meta_keywords: string; og_image: string;
  currency: string; currency_symbol: string; timezone: string; maintenance_mode: boolean;
};

const emptySettings: SchoolSettings = {
  id: 1, school_name: "C.T. Model School", school_short_name: "CTMS", school_motto: "", school_headline: "", school_description: "",
  established_year: null, eiin: "", board: "", principal_name: "", principal_message: "", logo_url: "", favicon_url: "", hero_image: "",
  address: "", phone: "", whatsapp: "", telephone: "", email: "", website: "", google_map: "", office_time: "",
  facebook: "", messenger: "", instagram: "", youtube: "", linkedin: "", tiktok: "", theme_color: DEFAULT_COLOR,
  hero_badge: "C.T. Model School", hero_subtitle: "", hero_title: "", hero_description: "", hero_button_1_text: "", hero_button_1_link: "",
  hero_button_2_text: "", hero_button_2_link: "", show_hero: true, hero_auto_slide: true, hero_slide_interval: 5,
  hero_transition_speed: 600, hero_max_items: 5, meta_title: "", meta_description: "", meta_keywords: "", og_image: "",
  currency: "BDT", currency_symbol: "৳", timezone: "Asia/Dhaka", maintenance_mode: false,
};

const inputClass = "h-11 w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 text-sm text-[var(--school-text)] outline-none focus:border-[var(--school-primary)]";
const textareaClass = "w-full rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] px-3 py-3 text-sm text-[var(--school-text)] outline-none focus:border-[var(--school-primary)]";

export default function SettingsForm() {
  const router = useRouter();
  const supabase = createClient();
  const { primaryColor, setPrimaryColor, refreshTheme } = useTheme();
  const [settings, setSettings] = useState<SchoolSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("school_settings").select("*").eq("id", 1).maybeSingle();
    if (loadError) setError(loadError.message);
    else setSettings({ ...emptySettings, ...(data ?? {}) });
    setLoading(false);
  }

  useEffect(() => { void loadSettings(); }, []);

  function updateField<K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function handleInput(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    const normalizedColor = settings.theme_color.trim().startsWith("#") ? settings.theme_color.trim() : `#${settings.theme_color.trim()}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(normalizedColor)) { setError("Please enter a valid 6-digit HEX theme color."); setSaving(false); return; }

    const payload = {
      ...settings, theme_color: normalizedColor,
      established_year: settings.established_year ? Number(settings.established_year) : null,
      hero_slide_interval: Number(settings.hero_slide_interval) || 5,
      hero_transition_speed: Number(settings.hero_transition_speed) || 600,
      hero_max_items: Number(settings.hero_max_items) || 5,
    };
    const { error: updateError } = await supabase.from("school_settings").update(payload).eq("id", 1);
    if (updateError) { setError(updateError.message); setSaving(false); return; }
    setSettings(payload); setPrimaryColor(normalizedColor); await refreshTheme();
    setMessage("School settings saved successfully."); setSaving(false); router.refresh();
  }

  if (loading) return <div className="mx-auto max-w-6xl p-6 text-sm text-[var(--school-muted)]">Loading school settings...</div>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl pb-12">
      <header className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Administration</p><h1 className="mt-2 text-3xl font-bold text-[var(--school-text)]">School Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--school-muted)]">One central place for school identity, branding, contact details, hero content, social links, SEO and visual theme.</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => router.push("/admin")} className="rounded-xl border border-[var(--school-primary-border)] px-4 py-2 text-sm font-semibold theme-primary">Back to Dashboard</button><button type="submit" disabled={saving} className="rounded-xl px-5 py-2 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : "Save All Settings"}</button></div>
        </div>
      </header>

      {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm theme-primary">{message}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="School Identity" title="General Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School Name"><input name="school_name" value={settings.school_name} onChange={handleInput} className={inputClass} /></Field>
            <Field label="Short Name"><input name="school_short_name" value={settings.school_short_name} onChange={handleInput} className={inputClass} /></Field>
            <Field label="School Motto"><input name="school_motto" value={settings.school_motto} onChange={handleInput} className={inputClass} /></Field>
            <Field label="School Headline"><input name="school_headline" value={settings.school_headline} onChange={handleInput} className={inputClass} /></Field>
            <Field label="Established Year"><input type="number" name="established_year" value={settings.established_year ?? ""} onChange={handleInput} className={inputClass} /></Field>
            <Field label="EIIN"><input name="eiin" value={settings.eiin} onChange={handleInput} className={inputClass} /></Field>
            <Field label="Education Board"><input name="board" value={settings.board} onChange={handleInput} className={inputClass} /></Field>
            <Field label="Principal / Head Name"><input name="principal_name" value={settings.principal_name} onChange={handleInput} className={inputClass} /></Field>
          </div>
          <Field label="School Description"><textarea name="school_description" rows={4} value={settings.school_description} onChange={handleInput} className={textareaClass} /></Field>
          <Field label="Principal / Head Message"><textarea name="principal_message" rows={4} value={settings.principal_message} onChange={handleInput} className={textareaClass} /></Field>
        </SettingsCard>

        <SettingsCard eyebrow="Branding" title="Logo, Favicon & Theme">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Logo URL"><input name="logo_url" value={settings.logo_url} onChange={handleInput} className={inputClass} /></Field><Field label="Favicon URL"><input name="favicon_url" value={settings.favicon_url} onChange={handleInput} className={inputClass} /></Field></div>
          <Field label="Primary Theme Color"><div className="flex gap-3"><input name="theme_color" value={settings.theme_color} onChange={handleInput} className={inputClass} /><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(settings.theme_color) ? settings.theme_color : primaryColor || DEFAULT_COLOR} onChange={(event) => updateField("theme_color", event.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-1" aria-label="Choose school primary color" /></div></Field>
          <div className="rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Live preview</p><p className="mt-2 text-lg font-bold text-[var(--school-text)]">{settings.school_name || "C.T. Model School"}</p><p className="mt-1 text-sm text-[var(--school-muted)]">{settings.school_headline || "School headline preview"}</p><button type="button" className="mt-4 rounded-xl px-4 py-2 text-sm font-bold theme-primary-bg">Sample Action</button></div>
        </SettingsCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="Contact" title="Contact Information">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Phone"><input name="phone" value={settings.phone} onChange={handleInput} className={inputClass} /></Field><Field label="WhatsApp"><input name="whatsapp" value={settings.whatsapp} onChange={handleInput} className={inputClass} /></Field><Field label="Telephone"><input name="telephone" value={settings.telephone} onChange={handleInput} className={inputClass} /></Field><Field label="Email"><input name="email" type="email" value={settings.email} onChange={handleInput} className={inputClass} /></Field><Field label="Website"><input name="website" value={settings.website} onChange={handleInput} className={inputClass} /></Field><Field label="Office Time"><input name="office_time" value={settings.office_time} onChange={handleInput} className={inputClass} /></Field></div>
          <Field label="Address"><textarea name="address" rows={3} value={settings.address} onChange={handleInput} className={textareaClass} /></Field><Field label="Google Map / Embed URL"><input name="google_map" value={settings.google_map} onChange={handleInput} className={inputClass} /></Field>
        </SettingsCard>
        <SettingsCard eyebrow="Social" title="Social Media Links">
          <div className="grid gap-4 sm:grid-cols-2">{(["facebook","messenger","instagram","youtube","linkedin","tiktok"] as const).map((field) => <Field key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}><input name={field} value={settings[field]} onChange={handleInput} className={inputClass} /></Field>)}</div>
        </SettingsCard>
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Public Website Content</p><h2 className="mt-2 text-2xl font-bold text-[var(--school-text)]">Hero & Headline</h2><p className="mt-2 text-sm leading-6 text-[var(--school-muted)]">Central hero content for the future public school homepage. No hero text or theme colors need to be hardcoded in page components.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4"><Field label="Hero Badge"><input name="hero_badge" value={settings.hero_badge} onChange={handleInput} className={inputClass} /></Field><Field label="Hero Subtitle"><input name="hero_subtitle" value={settings.hero_subtitle} onChange={handleInput} className={inputClass} /></Field><Field label="Hero Title"><input name="hero_title" value={settings.hero_title} onChange={handleInput} className={inputClass} /></Field><Field label="Hero Description"><textarea name="hero_description" rows={5} value={settings.hero_description} onChange={handleInput} className={textareaClass} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Button 1 Text"><input name="hero_button_1_text" value={settings.hero_button_1_text} onChange={handleInput} className={inputClass} /></Field><Field label="Button 1 Link"><input name="hero_button_1_link" value={settings.hero_button_1_link} onChange={handleInput} className={inputClass} /></Field><Field label="Button 2 Text"><input name="hero_button_2_text" value={settings.hero_button_2_text} onChange={handleInput} className={inputClass} /></Field><Field label="Button 2 Link"><input name="hero_button_2_link" value={settings.hero_button_2_link} onChange={handleInput} className={inputClass} /></Field></div></div>
          <div className="space-y-4"><Field label="Hero Image URL"><input name="hero_image" value={settings.hero_image} onChange={handleInput} className={inputClass} /></Field><div className="rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Hero Preview</p><p className="mt-4 text-xs font-semibold theme-primary">{settings.hero_badge || settings.school_name}</p><h3 className="mt-2 text-2xl font-bold text-[var(--school-text)]">{settings.hero_title || settings.school_headline || "Your school headline"}</h3><p className="mt-3 text-sm leading-6 text-[var(--school-muted)]">{settings.hero_description || settings.school_description || "Your school introduction will appear here."}</p><div className="mt-5 flex flex-wrap gap-2">{settings.hero_button_1_text ? <span className="rounded-xl px-4 py-2 text-xs font-bold theme-primary-bg">{settings.hero_button_1_text}</span> : null}{settings.hero_button_2_text ? <span className="rounded-xl border border-[var(--school-primary-border)] px-4 py-2 text-xs font-bold theme-primary">{settings.hero_button_2_text}</span> : null}</div></div><Toggle label="Show Hero Section" checked={settings.show_hero} onChange={(value) => updateField("show_hero", value)} /><Toggle label="Enable Hero Auto Slide" checked={settings.hero_auto_slide} onChange={(value) => updateField("hero_auto_slide", value)} /><div className="grid gap-4 sm:grid-cols-3"><Field label="Interval (sec)"><input type="number" min={1} name="hero_slide_interval" value={settings.hero_slide_interval} onChange={handleInput} className={inputClass} /></Field><Field label="Transition (ms)"><input type="number" min={100} name="hero_transition_speed" value={settings.hero_transition_speed} onChange={handleInput} className={inputClass} /></Field><Field label="Max Items"><input type="number" min={1} name="hero_max_items" value={settings.hero_max_items} onChange={handleInput} className={inputClass} /></Field></div></div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="Search & Sharing" title="SEO Settings"><Field label="Meta Title"><input name="meta_title" value={settings.meta_title} onChange={handleInput} className={inputClass} /></Field><Field label="Meta Description"><textarea name="meta_description" rows={4} value={settings.meta_description} onChange={handleInput} className={textareaClass} /></Field><Field label="Meta Keywords"><textarea name="meta_keywords" rows={3} value={settings.meta_keywords} onChange={handleInput} className={textareaClass} /></Field><Field label="Open Graph Image URL"><input name="og_image" value={settings.og_image} onChange={handleInput} className={inputClass} /></Field></SettingsCard>
        <SettingsCard eyebrow="System" title="Regional & Application Settings"><div className="grid gap-4 sm:grid-cols-2"><Field label="Currency"><input name="currency" value={settings.currency} onChange={handleInput} className={inputClass} /></Field><Field label="Currency Symbol"><input name="currency_symbol" value={settings.currency_symbol} onChange={handleInput} className={inputClass} /></Field><Field label="Timezone"><input name="timezone" value={settings.timezone} onChange={handleInput} className={inputClass} /></Field></div><Toggle label="Maintenance Mode" checked={settings.maintenance_mode} onChange={(value) => updateField("maintenance_mode", value)} /><div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-4 text-sm text-[var(--school-muted)]">Theme-dependent colors remain controlled by the central theme system. Individual pages should never define their own primary/theme palette.</div></SettingsCard>
      </div>

      <div className="mt-8 flex justify-end"><button type="submit" disabled={saving} className="rounded-xl px-6 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : "Save All Settings"}</button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="block text-sm font-semibold text-[var(--school-text)]">{label}</span>{children}</label>; }
function SettingsCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8"><p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">{eyebrow}</p><h2 className="mt-2 text-xl font-bold text-[var(--school-text)]">{title}</h2><div className="mt-6 space-y-4">{children}</div></div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[var(--school-border)] p-4"><span className="text-sm font-semibold text-[var(--school-text)]">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
