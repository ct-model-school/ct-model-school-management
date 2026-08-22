import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AboutPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("school_settings").select("school_name,school_headline,school_description,school_motto,established_year,eiin,board,principal_name,principal_message").limit(1).maybeSingle();
  const school = data;

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-10 text-[var(--school-text)] md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] theme-primary">About</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{school?.school_name || "C.T. Model School"}</h1>
          {school?.school_headline ? <p className="mt-3 text-lg text-[var(--school-muted)]">{school.school_headline}</p> : null}
        </header>

        <section className="mt-8 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-8">
          <h2 className="text-2xl font-bold">School Overview</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-[var(--school-muted)]">{school?.school_description || "School information will be published from Admin Settings."}</p>
          {school?.school_motto ? <p className="mt-5 font-semibold theme-primary">{school.school_motto}</p> : null}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Established", school?.established_year], ["EIIN", school?.eiin], ["Board", school?.board], ["Principal", school?.principal_name]].map(([label, value]) => value ? <div key={label as string} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5"><p className="text-xs font-bold uppercase tracking-wide text-[var(--school-muted)]">{label}</p><p className="mt-2 font-bold">{value}</p></div> : null)}
        </section>

        {school?.principal_message ? <section className="mt-6 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-8"><h2 className="text-2xl font-bold">Message from the Principal</h2><p className="mt-4 whitespace-pre-line leading-7 text-[var(--school-muted)]">{school.principal_message}</p></section> : null}
      </div>
    </main>
  );
}
