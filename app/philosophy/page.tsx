import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function PhilosophyPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("school_settings").select("school_name,school_motto,school_description").limit(1).maybeSingle();

  const sections = [
    { title: "Vision", text: "To nurture knowledgeable, disciplined and confident students who can contribute positively to society." },
    { title: "Mission", text: "To provide a safe and supportive learning environment that combines academic excellence with character, creativity and responsibility." },
    { title: "Core Values", text: "Discipline, integrity, respect, responsibility, curiosity and continuous learning guide our school community." },
    { title: "Educational Philosophy", text: "We believe education should develop the whole person. Academic learning is strengthened by moral values, practical skills, creativity, teamwork and respect for others." },
  ];

  return (
    <main className="min-h-screen bg-[var(--school-background)] px-4 py-10 text-[var(--school-text)] md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] theme-primary">Philosophy</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{data?.school_name || "C.T. Model School"}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--school-muted)]">{data?.school_description || "Our educational philosophy is centered on learning, character and responsible citizenship."}</p>
          {data?.school_motto ? <p className="mt-3 font-semibold theme-primary">{data.school_motto}</p> : null}
        </header>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {sections.map((section) => <section key={section.title} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 md:p-7"><h2 className="text-2xl font-bold">{section.title}</h2><p className="mt-4 leading-7 text-[var(--school-muted)]">{section.text}</p></section>)}
        </div>
      </div>
    </main>
  );
}
