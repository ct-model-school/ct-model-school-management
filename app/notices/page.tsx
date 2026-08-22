import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NoticesPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("notices").select("id,title,content,published_at,attachment_url").eq("is_published", true).order("published_at", { ascending: false });
  const notices = data ?? [];

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-10 text-[var(--school-text)] md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <header><p className="text-xs font-bold uppercase tracking-[0.18em] theme-primary">Notice</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">School Notices</h1><p className="mt-3 text-sm leading-6 text-[var(--school-muted)]">Official announcements and notices published by the school.</p></header>
        <div className="mt-8 space-y-4">
          {notices.map((notice) => <article key={notice.id} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-7"><time className="text-xs font-bold theme-primary" dateTime={notice.published_at}>{new Date(notice.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</time><h2 className="mt-2 text-xl font-bold md:text-2xl">{notice.title}</h2><p className="mt-4 whitespace-pre-line leading-7 text-[var(--school-muted)]">{notice.content}</p>{notice.attachment_url ? <a href={notice.attachment_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl border border-[var(--school-border)] px-4 py-2 text-sm font-bold">View Attachment</a> : null}</article>)}
          {!notices.length ? <div className="rounded-3xl border border-dashed border-[var(--school-border)] bg-[var(--school-surface)] p-10 text-center text-sm text-[var(--school-muted)]">No published notices are available.</div> : null}
        </div>
      </div>
    </main>
  );
}
