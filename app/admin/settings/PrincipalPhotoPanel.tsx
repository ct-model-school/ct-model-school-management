"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "school-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function PrincipalPhotoPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: loadError } = await supabase.from("school_settings").select("principal_photo_url").eq("id", 1).maybeSingle();
      if (!active) return;
      if (loadError) setError(loadError.message);
      else setPhotoUrl(data?.principal_photo_url ?? "");
    }
    void load();
    return () => { active = false; };
  }, [supabase]);

  async function upload(file: File) {
    setBusy(true); setMessage(""); setError("");
    if (!file.type.startsWith("image/")) { setError("Principal photo must be an image."); setBusy(false); return; }
    if (file.size > MAX_FILE_SIZE) { setError("Principal photo must be 5 MB or smaller."); setBusy(false); return; }

    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
    const path = `principal/principal-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (uploadError) { setError(uploadError.message); setBusy(false); return; }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData.publicUrl;
    const { error: updateError } = await supabase.from("school_settings").update({ principal_photo_url: publicUrl }).eq("id", 1);
    if (updateError) { await supabase.storage.from(BUCKET).remove([path]); setError(updateError.message); setBusy(false); return; }

    setPhotoUrl(publicUrl); setMessage("Principal photo uploaded successfully."); setBusy(false);
  }

  async function removePhoto() {
    if (!photoUrl) return;
    if (!window.confirm("Remove the principal photo from the website?")) return;
    setBusy(true); setMessage(""); setError("");
    const { error: updateError } = await supabase.from("school_settings").update({ principal_photo_url: null }).eq("id", 1);
    if (updateError) { setError(updateError.message); setBusy(false); return; }
    setPhotoUrl(""); setMessage("Principal photo removed."); setBusy(false);
  }

  return (
    <section className="mx-auto mt-6 max-w-6xl rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Principal / Head</p>
      <h2 className="mt-2 text-2xl font-bold text-[var(--school-text)]">Principal Photo</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">Upload a professional portrait. It will appear above the principal's name in the homepage Message from the Principal section.</p>
      {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm theme-primary">{message}</p> : null}
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-primary-soft)]">
          {photoUrl ? <img src={photoUrl} alt="Principal preview" className="h-full w-full object-cover object-top" /> : <span className="text-xs font-bold theme-primary">NO PHOTO</span>}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />
            {busy ? "Processing..." : photoUrl ? "Replace Photo" : "Upload Photo"}
          </label>
          {photoUrl ? <button type="button" disabled={busy} onClick={() => void removePhoto()} className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50">Remove</button> : null}
        </div>
      </div>
    </section>
  );
}
