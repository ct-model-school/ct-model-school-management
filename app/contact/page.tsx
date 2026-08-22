import { createServerSupabaseClient } from "@/lib/supabase/server";

function mapsUrl(value: string | null, address: string | null) {
  if (value && /^https?:\/\//i.test(value)) return value;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "C.T. Model School Kumira Sitakunda Chattogram")}`;
}

async function geocode(address: string | null) {
  if (!address) return null;
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`, {
      headers: { "User-Agent": "CT-Model-School-Website/1.0" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const results = await response.json() as Array<{ lat: string; lon: string }>;
    if (!results[0]) return null;
    return { lat: Number(results[0].lat), lon: Number(results[0].lon) };
  } catch {
    return null;
  }
}

export default async function ContactPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("school_settings").select("school_name,address,phone,telephone,email,whatsapp,office_time,google_map,facebook,messenger,instagram,youtube,linkedin,tiktok").limit(1).maybeSingle();
  const school = data;
  const coordinates = await geocode(school?.address || null);
  const mapFrame = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon - 0.008}%2C${coordinates.lat - 0.006}%2C${coordinates.lon + 0.008}%2C${coordinates.lat + 0.006}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`
    : null;
  const satelliteUrl = coordinates ? `https://www.google.com/maps/@?api=1&map_action=map&center=${coordinates.lat},${coordinates.lon}&zoom=17&basemap=satellite` : mapsUrl(school?.google_map || null, school?.address || null);

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-10 text-[var(--school-text)] md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <header><p className="text-xs font-bold uppercase tracking-[0.18em] theme-primary">Contact Us</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">Get in touch with {school?.school_name || "C.T. Model School"}</h1></header>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-8">
            <h2 className="text-2xl font-bold">Contact Information</h2>
            <dl className="mt-6 space-y-4">
              {[["Address", school?.address], ["Phone", school?.phone], ["Telephone", school?.telephone], ["WhatsApp", school?.whatsapp], ["Email", school?.email], ["Office Hours", school?.office_time]].map(([label, value]) => value ? <div key={label as string}><dt className="text-xs font-bold uppercase tracking-wide text-[var(--school-muted)]">{label}</dt><dd className="mt-1 break-words font-medium">{label === "Email" ? <a href={`mailto:${value}`} className="theme-primary">{value}</a> : label === "Phone" || label === "Telephone" || label === "WhatsApp" ? <a href={`tel:${String(value).replace(/\s/g, "")}`} className="theme-primary">{value}</a> : value}</dd></div> : null)}
            </dl>
            <div className="mt-7 flex flex-wrap gap-3"><a href={mapsUrl(school?.google_map || null, school?.address || null)} target="_blank" rel="noreferrer" className="rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">Open in Maps</a><a href={satelliteUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--school-border)] px-5 py-3 text-sm font-bold">Satellite View</a></div>
          </section>
          <section className="overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 md:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Location</h2><span className="text-xs text-[var(--school-muted)]">{coordinates ? "Interactive map" : "Map fallback"}</span></div>
            {mapFrame ? <iframe title="C.T. Model School location map" src={mapFrame} className="mt-4 h-[340px] w-full rounded-2xl border-0" loading="lazy" /> : <div className="mt-4 flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-[var(--school-border)] bg-[var(--school-background)] p-6 text-center"><div><p className="font-bold">{school?.address || "School location"}</p><p className="mt-2 text-sm text-[var(--school-muted)]">The configured address could not be geocoded right now. Use Open in Maps for navigation.</p></div></div>}
          </section>
        </div>
        <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-8"><h2 className="text-2xl font-bold">Official Links</h2><div className="mt-5 flex flex-wrap gap-3">{[["Facebook",school?.facebook],["Messenger",school?.messenger],["Instagram",school?.instagram],["YouTube",school?.youtube],["LinkedIn",school?.linkedin],["TikTok",school?.tiktok]].map(([label,url]) => url ? <a key={label as string} href={String(url)} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--school-border)] px-4 py-2 text-sm font-semibold">{label}</a> : null)}</div></section>
      </div>
    </main>
  );
}
