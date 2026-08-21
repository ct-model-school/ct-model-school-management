"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HeroSlide = {
  id: string;
  image_url: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";

export default function HeroSlidesPanel() {
  const supabase = createClient();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSlides() {
    const { data, error: loadError } = await supabase
      .from("hero_slides")
      .select("id,image_url,storage_path,alt_text,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setSlides((data ?? []) as HeroSlide[]);
  }

  useEffect(() => {
    void loadSlides();
  }, []);

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const nextOrder = slides.reduce((max, slide) => Math.max(max, slide.sort_order), -1) + 1;

      for (const [index, file] of files.entries()) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} is larger than 5 MB.`);
        }
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not a supported image.`);
        }

        const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
        const path = `hero/hero-${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage.from("school-assets").upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
          upsert: false,
        });

        if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);

        const { data: publicData } = supabase.storage.from("school-assets").getPublicUrl(path);
        const publicUrl = publicData.publicUrl;

        const { error: insertError } = await supabase.from("hero_slides").insert({
          image_url: publicUrl,
          storage_path: path,
          alt_text: "C.T. মডেল স্কুল hero image",
          sort_order: nextOrder + index,
          is_active: true,
        });

        if (insertError) {
          await supabase.storage.from("school-assets").remove([path]);
          throw new Error(`${file.name}: ${insertError.message}`);
        }
      }

      await loadSlides();
      setMessage(`${files.length} hero image${files.length > 1 ? "s" : ""} uploaded successfully.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Hero image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSlide(slide: HeroSlide) {
    setError("");
    const { error: updateError } = await supabase
      .from("hero_slides")
      .update({ is_active: !slide.is_active })
      .eq("id", slide.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSlides((current) => current.map((item) => item.id === slide.id ? { ...item, is_active: !item.is_active } : item));
  }

  async function removeSlide(slide: HeroSlide) {
    if (!window.confirm("Remove this hero image?")) return;

    setError("");
    const { error: deleteError } = await supabase.from("hero_slides").delete().eq("id", slide.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const { error: storageError } = await supabase.storage.from("school-assets").remove([slide.storage_path]);
    if (storageError) {
      setError(`Database record removed, but the storage file could not be removed: ${storageError.message}`);
    }

    setSlides((current) => current.filter((item) => item.id !== slide.id));
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Hero image URL copied.");
    } catch {
      setError("Could not copy the hero image URL. You can select it manually.");
    }
  }

  return (
    <section className="mx-auto mt-6 max-w-6xl rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Hero Media</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--school-text)]">Hero Image Gallery</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">
            Upload multiple homepage hero images. Each image is stored separately in school-assets/hero/ and remains independent from the main school settings form.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg">
          <input type="file" multiple accept={ACCEPT} className="sr-only" disabled={busy} onChange={(event) => void uploadFiles(event)} />
          {busy ? "Uploading..." : "Add Hero Images"}
        </label>
      </div>

      {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm theme-primary">{message}</p> : null}

      {slides.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <article key={slide.id} className="overflow-hidden rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)]">
              <div className="aspect-[16/7] overflow-hidden bg-[var(--school-surface)]">
                <img src={slide.image_url} alt={slide.alt_text} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] theme-primary">Slide {index + 1}</span>
                  <span className="text-xs text-[var(--school-muted)]">{slide.is_active ? "Active" : "Hidden"}</span>
                </div>
                <p className="truncate text-xs text-[var(--school-muted)]" title={slide.storage_path}>{slide.storage_path}</p>
                <div className="rounded-xl border border-[var(--school-border)] bg-[var(--school-surface)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--school-muted)]">Public Image URL</p>
                  <input
                    readOnly
                    value={slide.image_url}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-1 w-full bg-transparent text-xs text-[var(--school-text)] outline-none"
                    aria-label={`Public URL for hero slide ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => void copyUrl(slide.image_url)}
                    className="mt-2 rounded-lg border border-[var(--school-primary-border)] px-3 py-1.5 text-xs font-bold theme-primary"
                  >
                    Copy URL
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void toggleSlide(slide)} className="flex-1 rounded-xl border border-[var(--school-primary-border)] px-3 py-2 text-xs font-bold theme-primary">
                    {slide.is_active ? "Hide" : "Show"}
                  </button>
                  <button type="button" onClick={() => void removeSlide(slide)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--school-primary-border)] p-8 text-center text-sm text-[var(--school-muted)]">
          No hero images added yet. You can select multiple images at once.
        </div>
      )}
    </section>
  );
}
