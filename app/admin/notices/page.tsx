"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Notice = { id: string; title: string; content: string; published_at: string; is_published: boolean; attachment_url: string | null };
const emptyForm = { title: "", content: "", published_at: new Date().toISOString().slice(0, 16), attachment_url: "", is_published: false };

export default function NoticesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadNotices() {
    setLoading(true);
    const { data, error } = await supabase.from("notices").select("id,title,content,published_at,is_published,attachment_url").order("published_at", { ascending: false });
    if (error) setMessage(error.message); else setNotices((data ?? []) as Notice[]);
    setLoading(false);
  }

  useEffect(() => { void loadNotices(); }, []);

  function reset() { setForm(emptyForm); setEditingId(null); }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return setMessage("Title and notice details are required.");
    setSaving(true); setMessage("");
    const payload = { title: form.title.trim(), content: form.content.trim(), published_at: new Date(form.published_at).toISOString(), attachment_url: form.attachment_url.trim() || null, is_published: form.is_published };
    const result = editingId ? await supabase.from("notices").update(payload).eq("id", editingId) : await supabase.from("notices").insert(payload);
    if (result.error) setMessage(result.error.message); else { setMessage(editingId ? "Notice updated." : "Notice added."); reset(); await loadNotices(); }
    setSaving(false);
  }

  function edit(notice: Notice) { setEditingId(notice.id); setForm({ title: notice.title, content: notice.content, published_at: new Date(notice.published_at).toISOString().slice(0, 16), attachment_url: notice.attachment_url || "", is_published: notice.is_published }); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function togglePublished(notice: Notice) { const { error } = await supabase.from("notices").update({ is_published: !notice.is_published }).eq("id", notice.id); if (error) setMessage(error.message); else await loadNotices(); }

  async function remove(notice: Notice) { if (!window.confirm(`Delete ${notice.title}?`)) return; const { error } = await supabase.from("notices").delete().eq("id", notice.id); if (error) setMessage(error.message); else await loadNotices(); }

  return (
    <AdminPageShell eyebrow="Communication" title="Notices" description="Create, publish, edit and remove school notices.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={save} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{editingId ? "Edit Notice" : "Add Notice"}</h2><p className="mt-1 text-sm text-[var(--school-muted)]">Published notices appear on the public Notice page.</p></div>{editingId ? <button type="button" onClick={reset} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}</div>
          <div className="mt-6 space-y-4">
            <label className="block"><span className="label">Title *</span><input className="field w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label className="block"><span className="label">Published Date *</span><input className="field w-full" type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} required /></label>
            <label className="block"><span className="label">Notice Details *</span><textarea className="field min-h-48 w-full py-3" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></label>
            <label className="block"><span className="label">Attachment URL</span><input className="field w-full" type="url" value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} placeholder="https://..." /></label>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Publish this notice</label>
          </div>
          {message ? <p className="mt-4 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
          <button disabled={saving} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Notice" : "Add Notice"}</button>
        </form>

        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7"><h2 className="text-xl font-bold">All Notices</h2><div className="mt-5 space-y-3">{loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading...</p> : null}{notices.map((notice) => <article key={notice.id} className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold theme-primary">{new Date(notice.published_at).toLocaleString()}</p><h3 className="mt-1 font-bold">{notice.title}</h3><p className="mt-2 whitespace-pre-line text-sm text-[var(--school-muted)]">{notice.content}</p></div><span className="w-fit rounded-full border border-[var(--school-border)] px-3 py-1 text-xs font-bold">{notice.is_published ? "Published" : "Draft"}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => edit(notice)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => void togglePublished(notice)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">{notice.is_published ? "Unpublish" : "Publish"}</button><button onClick={() => void remove(notice)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Delete</button>{notice.attachment_url ? <a href={notice.attachment_url} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Attachment</a> : null}</div></article>)}{!loading && !notices.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No notices yet.</p> : null}</div></section>
      </div>
    </AdminPageShell>
  );
}
