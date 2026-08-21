"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AssetField = "logo_url" | "favicon_url" | "og_image";

type Asset = {
  field: AssetField;
  label: string;
  folder: "branding" | "seo";
  hint: string;
  accept: string;
};

const assets: Asset[] = [
  { field: "logo_url", label: "School Logo", folder: "branding", hint: "PNG, JPG, WEBP or SVG", accept: "image/png,image/jpeg,image/webp,image/svg+xml" },
  { field: "favicon_url", label: "Favicon", folder: "branding", hint: "ICO, PNG or SVG", accept: "image/x-icon,image/png,image/svg+xml" },
  { field: "og_image", label: "Open Graph Image", folder: "seo", hint: "PNG, JPG or WEBP", accept: "image/png,image/jpeg,image/webp" },
];

type AssetValue = { url: string; path: string };

export default function AssetUploadPanel() {
  const supabase = createClient();
  const [values, setValues] = useState<Record<AssetField, AssetValue>>({
    logo_url: { url: "", path: "" },
    favicon_url: { url: "", path: "" },
    og_image: { url: "", path: "" },
  });
  const [busy, setBusy] = useState<AssetField | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAssets() {
    const { data, error: loadError } = await supabase
      .from("school_settings")
      .select("logo_url,favicon_url,og_image")
      .eq("id", 1)
      .maybeSingle();

    if (loadError) {
      setError(loadError.message);
      return;
    }

    const toAssetValue = (url: string | null | undefined): AssetValue => ({
      url: url ?? "",
      path: "",
    });

    setValues({
      logo_url: toAssetValue(data?.logo_url),
      favicon_url: toAssetValue(data?.favicon_url),
      og_image: toAssetValue(data?.og_image),
    });
  }

  useEffect(() => { void loadAssets(); }, []);

  async function uploadAsset(asset: Asset, file: File) {
    setBusy(asset.field);
    setMessage("");
    setError("");

    if (file.size > 5 * 1024 * 1024) {
      setError(`${asset.label} must be 5 MB or smaller.`);
      setBusy(null);
      return;
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
    const path = `${asset.folder}/${asset.field}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("school-assets").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

    if (uploadError) {
      setError(uploadError.message);
      setBusy(null);
      return;
    }

    const { data: publicData } = supabase.storage.from("school-assets").getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase
      .from("school_settings")
      .update({ [asset.field]: publicUrl })
      .eq("id", 1);

    if (updateError) {
      setError(`File uploaded, but the school settings link could not be saved: ${updateError.message}`);
      setBusy(null);
      return;
    }

    setValues((current) => ({ ...current, [asset.field]: { url: publicUrl, path } }));
    setMessage(`${asset.label} uploaded and linked successfully.`);
    setBusy(null);
  }

  return (
    <section className="mx-auto mt-6 max-w-6xl rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] theme-primary">Media Library</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--school-text)]">School Assets</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--school-muted)]">
          Upload the school logo, favicon and social sharing image to the central Supabase Storage bucket. Homepage hero images are managed separately in the Hero Image Gallery below.
        </p>
      </div>

      {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-2xl border border-[var(--school-primary-border)] bg-[var(--school-primary-soft)] px-4 py-3 text-sm theme-primary">{message}</p> : null}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {assets.map((asset) => (
          <div key={asset.field} className="rounded-2xl border border-[var(--school-border)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[var(--school-text)]">{asset.label}</h3>
                <p className="mt-1 text-xs text-[var(--school-muted)]">Storage: school-assets/{asset.folder}/</p>
                <p className="mt-1 text-xs text-[var(--school-muted)]">{asset.hint}, max 5 MB</p>
              </div>
              {values[asset.field].url ? (
                <div className="h-16 w-20 overflow-hidden rounded-xl border border-[var(--school-border)] bg-[var(--school-background)] p-1">
                  <img src={values[asset.field].url} alt={`${asset.label} preview`} className="h-full w-full object-contain" />
                </div>
              ) : null}
            </div>
            <label className="mt-5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--school-primary-border)] px-4 py-3 text-sm font-semibold theme-primary hover:bg-[var(--school-primary-soft)]">
              <input type="file" accept={asset.accept} className="sr-only" disabled={busy !== null} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAsset(asset, file);
                event.currentTarget.value = "";
              }} />
              {busy === asset.field ? "Uploading..." : values[asset.field].url ? "Replace File" : "Choose File"}
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
