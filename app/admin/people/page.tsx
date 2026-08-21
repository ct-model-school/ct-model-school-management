"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Category = "teacher" | "committee" | "staff" | "gpa5" | "scholarship" | "achievement";

type Profile = {
  id: string;
  category: Category;
  full_name: string;
  photo_url: string | null;
  designation: string | null;
  department: string | null;
  subject: string | null;
  committee_position: string | null;
  class_name: string | null;
  section: string | null;
  academic_year: string | null;
  exam_name: string | null;
  result_value: string | null;
  achievement_type: string | null;
  scholarship_type: string | null;
  short_description: string | null;
  is_active: boolean;
  display_order: number;
};

const categories: { value: Category; label: string }[] = [
  { value: "teacher", label: "Our Teacher" },
  { value: "committee", label: "Management Committee" },
  { value: "staff", label: "Staff / Employee" },
  { value: "gpa5", label: "GPA-5 Achiever" },
  { value: "scholarship", label: "Scholarship Achiever" },
  { value: "achievement", label: "Other Achievement" },
];

const achievementTypes = ["Academic", "Sports", "Cultural", "Competition", "Other"];
const scholarshipTypes = ["General Scholarship", "Talent Scholarship", "Government Scholarship", "Other"];

const emptyForm = {
  category: "teacher" as Category,
  full_name: "",
  photo_url: "",
  designation: "",
  department: "",
  subject: "",
  committee_position: "",
  class_name: "",
  section: "",
  academic_year: "",
  exam_name: "",
  result_value: "",
  achievement_type: "",
  scholarship_type: "",
  short_description: "",
  email: "",
  phone: "",
  whatsapp: "",
  display_order: "0",
};

export default function PeopleAdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState(emptyForm);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");

  async function loadProfiles() {
    setLoading(true);
    const query = supabase
      .from("people_profiles")
      .select("id,category,full_name,photo_url,designation,department,subject,committee_position,class_name,section,academic_year,exam_name,result_value,achievement_type,scholarship_type,short_description,is_active,display_order")
      .order("display_order", { ascending: true })
      .order("full_name", { ascending: true });
    const { data, error } = await query;
    if (error) setMessage(error.message);
    else setProfiles((data ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  const visibleProfiles = filter === "all" ? profiles : profiles.filter((item) => item.category === filter);
  const showStudentFields = form.category === "gpa5" || form.category === "scholarship";
  const showAchievementFields = form.category === "achievement";
  const showTeacherFields = form.category === "teacher";
  const showCommitteeFields = form.category === "committee";

  function updateField(name: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setPhoto(null);
  }

  async function uploadPhoto(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${form.category}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("school_people").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("school_people").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.full_name.trim()) {
      setMessage("Name is required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      let photoUrl = form.photo_url || null;
      if (photo) photoUrl = await uploadPhoto(photo);

      const payload = {
        category: form.category,
        full_name: form.full_name.trim(),
        photo_url: photoUrl,
        designation: form.designation || null,
        department: form.department || null,
        subject: form.subject || null,
        committee_position: form.committee_position || null,
        class_name: form.class_name || null,
        section: form.section || null,
        academic_year: form.academic_year || null,
        exam_name: form.exam_name || null,
        result_value: form.result_value || null,
        achievement_type: form.achievement_type || null,
        scholarship_type: form.scholarship_type || null,
        short_description: form.short_description || null,
        email: form.email || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        display_order: Number(form.display_order) || 0,
        is_active: true,
      };

      const result = editingId
        ? await supabase.from("people_profiles").update(payload).eq("id", editingId)
        : await supabase.from("people_profiles").insert(payload);

      if (result.error) throw result.error;
      setMessage(editingId ? "Profile updated successfully." : "Profile added successfully.");
      resetForm();
      await loadProfiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function editProfile(item: Profile) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      full_name: item.full_name,
      photo_url: item.photo_url || "",
      designation: item.designation || "",
      department: item.department || "",
      subject: item.subject || "",
      committee_position: item.committee_position || "",
      class_name: item.class_name || "",
      section: item.section || "",
      academic_year: item.academic_year || "",
      exam_name: item.exam_name || "",
      result_value: item.result_value || "",
      achievement_type: item.achievement_type || "",
      scholarship_type: item.scholarship_type || "",
      short_description: item.short_description || "",
      email: "",
      phone: "",
      whatsapp: "",
      display_order: String(item.display_order),
    });
    setPhoto(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActive(item: Profile) {
    const { error } = await supabase.from("people_profiles").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) setMessage(error.message);
    else await loadProfiles();
  }

  async function removeProfile(item: Profile) {
    if (!window.confirm(`Delete ${item.full_name}?`)) return;
    const { error } = await supabase.from("people_profiles").delete().eq("id", item.id);
    if (error) setMessage(error.message);
    else {
      setMessage("Profile deleted.");
      await loadProfiles();
    }
  }

  return (
    <AdminPageShell
      eyebrow="People & Achievements"
      title="Quick Add Profiles"
      description="Manage teachers, committee members, staff and student achievements from one reusable profile system."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
        <form onSubmit={saveProfile} className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--school-text)]">{editingId ? "Edit Profile" : "Quick Add"}</h2>
              <p className="mt-1 text-sm text-[var(--school-muted)]">Use dropdowns where possible to keep entry fast and consistent.</p>
            </div>
            {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold text-[var(--school-muted)]">Cancel Edit</button> : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="label">Profile Type</span><select className="field" value={form.category} onChange={(e) => updateField("category", e.target.value)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span className="label">Full Name *</span><input className="field" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} placeholder="Full name" required /></label>
            <label><span className="label">Photo</span><input className="field" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoto(e.target.files?.[0] || null)} /></label>

            {(showTeacherFields || form.category === "staff") && <>
              <label><span className="label">Designation</span><input className="field" value={form.designation} onChange={(e) => updateField("designation", e.target.value)} placeholder="Select/type designation" /></label>
              <label><span className="label">Department</span><input className="field" value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Department" /></label>
              {showTeacherFields && <label><span className="label">Subject</span><input className="field" value={form.subject} onChange={(e) => updateField("subject", e.target.value)} placeholder="Subject" /></label>}
            </>}

            {showCommitteeFields && <>
              <label><span className="label">Committee</span><input className="field" value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Committee name" /></label>
              <label><span className="label">Position</span><input className="field" value={form.committee_position} onChange={(e) => updateField("committee_position", e.target.value)} placeholder="Position" /></label>
            </>}

            {showStudentFields && <>
              <label><span className="label">Class</span><select className="field" value={form.class_name} onChange={(e) => updateField("class_name", e.target.value)}><option value="">Select class</option>{["Play","Nursery","KG","1","2","3","4","5","6","7","8","9","10","SSC","HSC"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="label">Section</span><select className="field" value={form.section} onChange={(e) => updateField("section", e.target.value)}><option value="">Select section</option>{["A","B","C","D","E"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="label">Academic Year</span><select className="field" value={form.academic_year} onChange={(e) => updateField("academic_year", e.target.value)}><option value="">Select year</option>{Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() - index)).map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="label">Exam</span><select className="field" value={form.exam_name} onChange={(e) => updateField("exam_name", e.target.value)}><option value="">Select exam</option>{["SSC","HSC","JSC","Annual Examination","Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="label">Result / GPA</span><select className="field" value={form.result_value} onChange={(e) => updateField("result_value", e.target.value)}><option value="">Select result</option><option>GPA-5</option><option>GPA-5.00</option><option>Grade A+</option><option>Other</option></select></label>
              {form.category === "scholarship" && <label><span className="label">Scholarship Type</span><select className="field" value={form.scholarship_type} onChange={(e) => updateField("scholarship_type", e.target.value)}><option value="">Select scholarship</option>{scholarshipTypes.map((item) => <option key={item}>{item}</option>)}</select></label>}
            </>}

            {showAchievementFields && <label><span className="label">Achievement Type</span><select className="field" value={form.achievement_type} onChange={(e) => updateField("achievement_type", e.target.value)}><option value="">Select type</option>{achievementTypes.map((item) => <option key={item}>{item}</option>)}</select></label>}

            <label className="md:col-span-2"><span className="label">Short Description</span><textarea className="field min-h-24 py-3" value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} placeholder="Short profile / achievement description" /></label>
            <label><span className="label">Display Order</span><input className="field" type="number" min="0" value={form.display_order} onChange={(e) => updateField("display_order", e.target.value)} /></label>
          </div>

          {message ? <p className="mt-4 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
          <button disabled={saving} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Profile" : "Add Profile"}</button>
        </form>

        <section className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-bold text-[var(--school-text)]">Profiles</h2><p className="mt-1 text-sm text-[var(--school-muted)]">{profiles.length} total profile{profiles.length === 1 ? "" : "s"}</p></div>
            <select className="field sm:max-w-48" value={filter} onChange={(e) => setFilter(e.target.value as Category | "all")}><option value="all">All Categories</option>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? <p className="text-sm text-[var(--school-muted)]">Loading profiles...</p> : visibleProfiles.length === 0 ? <p className="rounded-2xl border border-dashed border-[var(--school-primary-border)] p-6 text-center text-sm text-[var(--school-muted)]">No profiles yet. Add the first one from Quick Add.</p> : visibleProfiles.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-[var(--school-border)] p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--school-primary-soft)]">{item.photo_url ? <img src={item.photo_url} alt={item.full_name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-bold theme-primary">PHOTO</div>}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-bold text-[var(--school-text)]">{item.full_name}</p><p className="mt-1 text-xs capitalize text-[var(--school-muted)]">{item.category.replace("gpa5", "GPA-5")}</p><p className="mt-1 truncate text-xs text-[var(--school-muted)]">{item.designation || item.achievement_type || item.result_value || "Profile"}</p></div>
              <div className="flex shrink-0 items-start gap-1"><button type="button" onClick={() => editProfile(item)} className="rounded-lg border border-[var(--school-border)] px-2 py-1 text-[11px] font-bold theme-primary">Edit</button><button type="button" onClick={() => void toggleActive(item)} className="rounded-lg border border-[var(--school-border)] px-2 py-1 text-[11px] font-bold text-[var(--school-muted)]">{item.is_active ? "Hide" : "Show"}</button><button type="button" onClick={() => void removeProfile(item)} className="rounded-lg border border-[var(--school-border)] px-2 py-1 text-[11px] font-bold text-red-700">Delete</button></div>
            </article>)}
          </div>
        </section>
      </div>
      <style jsx>{`.label{display:block;margin-bottom:7px;font-size:12px;font-weight:700;color:var(--school-muted)}.field{width:100%;min-height:44px;border:1px solid var(--school-border);border-radius:12px;background:var(--school-surface);padding:0 12px;color:var(--school-text);outline:none}.field:focus{border-color:var(--school-primary);box-shadow:0 0 0 3px var(--school-primary-soft)}`}</style>
    </AdminPageShell>
  );
}
