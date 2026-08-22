"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type MemberType = "staff" | "teacher" | "accounts" | "other";
type DocumentType = "qualification_certificate" | "nid_front" | "nid_back";
type Division = { id: string; name: string; bn_name: string };
type District = { id: string; division_id: string; name: string; bn_name: string };
type Upazila = { id: string; district_id: string; name: string; bn_name: string };
type Postcode = { division_id: string; district_id: string; upazila: string; postOffice: string; postCode: string };

type Member = {
  member_type: MemberType; id: string; member_id: string; full_name: string; role: string;
  designation: string | null; department: string | null; subject: string | null; qualification: string | null;
  qualification_point: number | null; grade: string | null; institute_name: string | null; account_role: string | null;
  role_title: string | null; salary: number | null; phone: string | null; email: string | null; whatsapp: string | null;
  nid: string | null; address: string | null; joining_date: string | null; photo_url: string | null; details: string | null; is_active: boolean;
};

type FormState = {
  id: string | null; type: MemberType; full_name: string; password: string; role: string; designation: string;
  department: string; subject: string; account_role: string; role_title: string; salary: string; qualification: string;
  qualification_point: string; grade: string; institute_name: string; email: string; phone: string; whatsapp: string;
  nid: string; division: string; district: string; thana: string; post_office: string; post_code: string; city: string;
  address_line: string; address: string; joining_date: string; photo_url: string; details: string;
};

const blank: FormState = {
  id: null, type: "staff", full_name: "", password: "", role: "Staff", designation: "", department: "", subject: "",
  account_role: "Accounts Manager", role_title: "", salary: "", qualification: "", qualification_point: "", grade: "",
  institute_name: "", email: "", phone: "", whatsapp: "", nid: "", division: "", district: "", thana: "",
  post_office: "", post_code: "", city: "", address_line: "", address: "", joining_date: "", photo_url: "", details: "",
};

const defaults = (t: MemberType): Partial<FormState> =>
  t === "teacher" ? { role: "Teacher", designation: "Teacher", department: "Academic" } :
  t === "accounts" ? { role: "Accounts", designation: "Accounts", department: "Accounts", account_role: "Accounts Manager" } :
  t === "other" ? { role: "Other", designation: "", department: "" } : { role: "Staff", designation: "", department: "" };

const idPrefix = (t: MemberType) => t === "staff" ? "STID00001" : t === "teacher" ? "TCID00001" : t === "accounts" ? "ACID00001" : "OTID00001";
const departments = ["Administration", "Academic", "Accounts", "Examination", "Library", "ICT", "Maintenance", "Store", "Other"];
const accountRoles = ["Accounts Manager", "Accounts Officer", "Accountant", "Cashier", "Billing Officer", "Finance Officer", "Other Accounts"];
const otherRoles = ["Librarian", "ICT Officer", "ICT Assistant", "Maintenance Officer", "Maintenance Staff", "Lab Assistant", "Office Assistant", "Receptionist", "Driver", "Security Guard", "Cleaner", "Peon", "Support Staff", "Other"];
const photoBucket = "member-photos";
const allowedDocs = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const divisionOptions: Division[] = [
  { id: "1", name: "Barishal", bn_name: "বরিশাল" }, { id: "2", name: "Chattogram", bn_name: "চট্টগ্রাম" },
  { id: "3", name: "Dhaka", bn_name: "ঢাকা" }, { id: "4", name: "Khulna", bn_name: "খুলনা" },
  { id: "8", name: "Mymensingh", bn_name: "ময়মনসিংহ" }, { id: "5", name: "Rajshahi", bn_name: "রাজশাহী" },
  { id: "6", name: "Rangpur", bn_name: "রংপুর" }, { id: "7", name: "Sylhet", bn_name: "সিলেট" },
];
const districtsUrl = "https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/src/data/bd-districts.json";
const upazilasUrl = "https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/src/data/bd-upazilas.json";
const postcodesUrl = "https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/src/data/bd-postcodes.json";

export default function MembersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [type, setType] = useState<MemberType>("staff");
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<FormState>({ ...blank });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("store_admin_list_members", { p_member_type: type, p_search: search || null });
    if (error) setMessage(error.message); else setMembers((data ?? []) as Member[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [type]);

  useEffect(() => {
    let active = true;
    async function loadAddressData() {
      setAddressLoading(true);
      try {
        const [districtResponse, upazilaResponse, postcodeResponse] = await Promise.all([
          fetch(districtsUrl), fetch(upazilasUrl), fetch(postcodesUrl),
        ]);
        if (!districtResponse.ok || !upazilaResponse.ok || !postcodeResponse.ok) throw new Error("Address data could not be loaded.");
        const [districtJson, upazilaJson, postcodeJson] = await Promise.all([
          districtResponse.json() as Promise<{ districts: District[] }>,
          upazilaResponse.json() as Promise<{ upazilas: Upazila[] }>,
          postcodeResponse.json() as Promise<{ postcodes: Postcode[] }>,
        ]);
        if (!active) return;
        setDistricts(districtJson.districts ?? []);
        setUpazilas(upazilaJson.upazilas ?? []);
        setPostcodes(postcodeJson.postcodes ?? []);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Bangladesh address data could not be loaded.");
      } finally {
        if (active) setAddressLoading(false);
      }
    }
    void loadAddressData();
    return () => { active = false; };
  }, []);

  function resetForm(t = type) {
    setForm({ ...blank, type: t, ...defaults(t) });
    setProfileFile(null); setCertificateFile(null); setNidFrontFile(null); setNidBackFile(null); setProfilePreview("");
  }

  function changeType(t: MemberType) { setType(t); resetForm(t); setMessage(""); }

  async function loadDocuments(memberId: string) {
    const { data } = await supabase.from("member_documents").select("document_type, file_url").eq("member_id", memberId);
    const docs = (data ?? []) as { document_type: DocumentType; file_url: string }[];
    return {
      cert: docs.find((d) => d.document_type === "qualification_certificate"),
      front: docs.find((d) => d.document_type === "nid_front"),
      back: docs.find((d) => d.document_type === "nid_back"),
    };
  }

  async function edit(m: Member) {
    setForm({
      ...blank, type: m.member_type, id: m.id, full_name: m.full_name, password: "", role: m.role,
      designation: m.designation || "", department: m.department || "", subject: m.subject || "",
      account_role: m.account_role || "Accounts Manager", role_title: m.role_title || "", salary: m.salary == null ? "" : String(m.salary),
      qualification: m.qualification || "", qualification_point: m.qualification_point == null ? "" : String(m.qualification_point),
      grade: m.grade || "", institute_name: m.institute_name || "", email: m.email || "", phone: m.phone || "",
      whatsapp: m.whatsapp || "", nid: m.nid || "", division: "", district: "", thana: "", post_office: "", post_code: "", city: "",
      address_line: m.address || "", address: m.address || "", joining_date: m.joining_date || "", photo_url: m.photo_url || "", details: m.details || "",
    });
    setType(m.member_type); setProfileFile(null); setCertificateFile(null); setNidFrontFile(null); setNidBackFile(null); setProfilePreview("");
    await loadDocuments(m.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseFile(kind: "profile" | "certificate" | "nidFront" | "nidBack", file?: File) {
    if (!file) return;
    const max = kind === "profile" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (kind === "profile" && !file.type.startsWith("image/")) { setMessage("Profile Picture must be an image."); return; }
    if (kind !== "profile" && !allowedDocs.includes(file.type)) { setMessage("Certificate/NID must be JPG, PNG, WEBP or PDF."); return; }
    if (file.size > max) { setMessage(`${kind === "profile" ? "Profile Picture" : "Document"} must be ${max / 1024 / 1024} MB or smaller.`); return; }
    setMessage("");
    if (kind === "profile") { setProfileFile(file); setProfilePreview(URL.createObjectURL(file)); }
    if (kind === "certificate") setCertificateFile(file);
    if (kind === "nidFront") setNidFrontFile(file);
    if (kind === "nidBack") setNidBackFile(file);
  }

  async function uploadDocument(file: File, memberId: string, documentType: DocumentType) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${type}/${memberId}/${documentType}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from(photoBucket).upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: true });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from(photoBucket).getPublicUrl(data.path);
    const { error: documentError } = await supabase.from("member_documents").upsert({ member_id: memberId, member_type: type, document_type: documentType, file_url: publicData.publicUrl, storage_path: data.path }, { onConflict: "member_id,document_type" });
    if (documentError) throw documentError;
  }

  function buildAddress() {
    const parts = [form.address_line, form.city, form.post_office, form.post_code, form.thana, form.district, form.division].filter(Boolean);
    return parts.join(", ");
  }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("");
    try {
      const finalAddress = buildAddress();
      let profileUrl = form.photo_url || null;
      const { data, error } = await supabase.rpc("store_admin_save_member", {
        p_member_type: form.type, p_id: form.id, p_full_name: form.full_name, p_password: form.password || null,
        p_designation: form.designation, p_department: form.department, p_subject: form.subject || null,
        p_qualification: form.qualification || null, p_qualification_point: form.qualification_point === "" ? null : Number(form.qualification_point),
        p_grade: form.grade || null, p_institute_name: form.institute_name || null, p_salary: form.salary === "" ? null : Number(form.salary),
        p_account_role: form.account_role || null, p_role_title: form.role_title || null, p_phone: form.phone, p_email: form.email,
        p_whatsapp: form.whatsapp, p_nid: form.nid, p_address: finalAddress, p_joining_date: form.joining_date || null,
        p_photo_url: profileUrl, p_details: form.details, p_access_role: form.role,
      });
      if (error) throw error;
      const memberId = form.id || (data as { id?: string })?.id;
      if (!memberId) throw new Error("Member was saved but its ID could not be determined.");

      setUploading(true);
      if (profileFile) {
        const ext = profileFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${type}/${memberId}/profile-${Date.now()}.${ext}`;
        const { data: uploaded, error: uploadError } = await supabase.storage.from(photoBucket).upload(path, profileFile, { cacheControl: "3600", contentType: profileFile.type, upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from(photoBucket).getPublicUrl(uploaded.path);
        const { error: photoError } = await supabase.rpc("store_admin_save_member", {
          p_member_type: form.type, p_id: memberId, p_full_name: form.full_name, p_password: null, p_designation: form.designation,
          p_department: form.department, p_subject: form.subject || null, p_qualification: form.qualification || null,
          p_qualification_point: form.qualification_point === "" ? null : Number(form.qualification_point), p_grade: form.grade || null,
          p_institute_name: form.institute_name || null, p_salary: form.salary === "" ? null : Number(form.salary), p_account_role: form.account_role || null,
          p_role_title: form.role_title || null, p_phone: form.phone, p_email: form.email, p_whatsapp: form.whatsapp, p_nid: form.nid,
          p_address: finalAddress, p_joining_date: form.joining_date || null, p_photo_url: publicData.publicUrl, p_details: form.details, p_access_role: form.role,
        });
        if (photoError) throw photoError;
      }
      if (certificateFile) await uploadDocument(certificateFile, memberId, "qualification_certificate");
      if (nidFrontFile) await uploadDocument(nidFrontFile, memberId, "nid_front");
      if (nidBackFile) await uploadDocument(nidBackFile, memberId, "nid_back");
      setMessage(form.id ? "Member updated successfully." : `Member created: ${(data as { member_id?: string }).member_id || memberId}`);
      resetForm(form.type); await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save member.");
    } finally { setUploading(false); setSaving(false); }
  }

  async function remove(m: Member) {
    if (!window.confirm(`Remove ${m.full_name} (${m.member_id})?`)) return;
    const { error } = await supabase.rpc("store_admin_remove_member", { p_member_type: m.member_type, p_id: m.id });
    if (error) setMessage(error.message); else { setMessage(`${m.member_id} removed.`); await load(); }
  }

  const visible = members.filter((m) => {
    const q = search.trim().toLowerCase();
    return !q || [m.member_id, m.full_name, m.role, m.designation, m.department, m.qualification, m.institute_name, m.email, m.phone].some((v) => v?.toLowerCase().includes(q));
  });
  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const selectedDivision = divisionOptions.find((d) => d.name === form.division);
  const filteredDistricts = districts.filter((d) => d.division_id === selectedDivision?.id);
  const selectedDistrict = filteredDistricts.find((d) => d.name === form.district);
  const filteredUpazilas = upazilas.filter((u) => u.district_id === selectedDistrict?.id);
  const filteredPostcodes = postcodes.filter((p) => p.district_id === selectedDistrict?.id && (!form.thana || p.upazila.toLowerCase() === form.thana.toLowerCase()));

  function setDivision(value: string) { setForm((current) => ({ ...current, division: value, district: "", thana: "", post_office: "", post_code: "" })); }
  function setDistrict(value: string) { setForm((current) => ({ ...current, district: value, thana: "", post_office: "", post_code: "" })); }
  function setThana(value: string) { setForm((current) => ({ ...current, thana: value, post_office: "", post_code: "" })); }
  function setPostOffice(value: string) { const match = filteredPostcodes.find((p) => p.postOffice === value); setForm((current) => ({ ...current, post_office: value, post_code: match?.postCode || current.post_code })); }

  const uploadButton = (label: string, kind: "profile" | "certificate" | "nidFront" | "nidBack", accept: string, file: File | null) => (
    <label className="inline-flex cursor-pointer items-center rounded-lg border border-[var(--school-border)] px-3 py-2 text-xs font-bold hover:bg-[var(--school-primary-soft)]">
      {file ? `✓ ${file.name}` : label}
      <input type="file" accept={accept} className="hidden" onChange={(e) => { chooseFile(kind, e.target.files?.[0]); e.currentTarget.value = ""; }} />
    </label>
  );

  return (
    <AdminPageShell eyebrow="Community Access" title="Staff, Teachers, Accounts & Others" description="Admin-created internal members only. Parents, Students and Management Committee are excluded because they use their own registration/profile flows.">
      <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{(["staff", "teacher", "accounts", "other"] as MemberType[]).map((t) => <button key={t} onClick={() => changeType(t)} className={`rounded-xl px-4 py-3 text-sm font-bold capitalize ${type === t ? "theme-primary-bg" : "border border-[var(--school-border)] bg-[var(--school-surface)]"}`}>{t}</button>)}</div>
      {message ? <p className="mb-5 rounded-xl bg-[var(--school-primary-soft)] px-4 py-3 text-sm font-semibold theme-primary">{message}</p> : null}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,.95fr)]">
        <form onSubmit={save} className="order-1 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 lg:p-7">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black sm:text-2xl">{form.id ? "Edit" : "Add"} {type}</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)] sm:text-sm">ID is generated automatically: {idPrefix(type)} and increases for every new member.</p></div>{form.id ? <button type="button" onClick={() => resetForm()} className="shrink-0 rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Cancel</button> : null}</div>
          <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
            <div className="sm:col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3"><label><span className="label">Full Name *</span><input className="field w-full" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></label><div className="pb-0.5"><span className="label">Profile Picture</span><div className="flex items-center gap-2">{profilePreview || form.photo_url ? <img src={profilePreview || form.photo_url} alt="Profile" className="h-10 w-10 rounded-lg object-cover" /> : null}{uploadButton("Upload Picture", "profile", "image/*", profileFile)}</div></div></div>
            <label><span className="label">Password {form.id ? "(leave blank to keep current)" : "*"}</span><input className="field w-full" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required={!form.id} minLength={8} /></label>
            {type === "other" ? <label><span className="label">Role *</span><select className="field w-full" value={form.role} onChange={(e) => set("role", e.target.value)} required>{!otherRoles.includes(form.role) && form.role ? <option value={form.role}>{form.role}</option> : null}{otherRoles.map((x) => <option key={x} value={x}>{x}</option>)}</select></label> : <label><span className="label">Role *</span><input className="field w-full" value={form.role} onChange={(e) => set("role", e.target.value)} required /></label>}
            {type === "teacher" ? <label className="sm:col-span-2"><span className="label">Subject</span><input className="field w-full" value={form.subject} onChange={(e) => set("subject", e.target.value)} /></label> : null}
            {type === "accounts" ? <label className="sm:col-span-2"><span className="label">Accounts Role</span><select className="field w-full" value={form.account_role} onChange={(e) => set("account_role", e.target.value)}>{accountRoles.map((x) => <option key={x}>{x}</option>)}</select></label> : null}
            {type === "other" ? <label className="sm:col-span-2"><span className="label">Role / Position</span><input className="field w-full" value={form.role_title} onChange={(e) => set("role_title", e.target.value)} placeholder="ICT / Maintenance / Librarian" /></label> : null}
            <label><span className="label">Designation</span><input className="field w-full" value={form.designation} onChange={(e) => set("designation", e.target.value)} /></label>
            <label><span className="label">Department</span><select className="field w-full" value={form.department} onChange={(e) => set("department", e.target.value)}><option value="">Select</option>{departments.map((x) => <option key={x}>{x}</option>)}</select></label>
            {(type === "staff" || type === "teacher" || type === "accounts") ? <label><span className="label">Salary</span><input className="field w-full" type="number" min="0" step="0.01" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="Monthly salary" /></label> : null}
            {(type === "teacher" || type === "accounts") ? <>
              <div className="flex items-end gap-2"><label className="min-w-0 flex-1"><span className="label">Qualification</span><input className="field w-full" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="B.Sc / M.A / MBA" /></label>{uploadButton("Upload Certificate", "certificate", ".jpg,.jpeg,.png,.webp,.pdf", certificateFile)}</div>
              <label><span className="label">Qualification Point</span><input className="field w-full" type="number" min="0" step="0.01" value={form.qualification_point} onChange={(e) => set("qualification_point", e.target.value)} /></label>
              <label><span className="label">Grade</span><input className="field w-full" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="A+ / First Class" /></label>
              <label><span className="label">Institute Name</span><input className="field w-full" value={form.institute_name} onChange={(e) => set("institute_name", e.target.value)} /></label>
            </> : null}
            <label><span className="label">Email</span><input className="field w-full" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
            <label><span className="label">Phone</span><input className="field w-full" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
            <label><span className="label">WhatsApp</span><input className="field w-full" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></label>
            <div className="flex items-end gap-2"><label className="min-w-0 flex-1"><span className="label">NID</span><input className="field w-full" value={form.nid} onChange={(e) => set("nid", e.target.value)} /></label><div className="flex gap-1.5">{uploadButton("Front", "nidFront", ".jpg,.jpeg,.png,.webp,.pdf", nidFrontFile)}{uploadButton("Back", "nidBack", ".jpg,.jpeg,.png,.webp,.pdf", nidBackFile)}</div></div>
            <label><span className="label">Joining Date</span><input className="field w-full" type="date" value={form.joining_date} onChange={(e) => set("joining_date", e.target.value)} /></label>

            <div className="sm:col-span-2 rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-4">
              <div className="mb-3"><p className="text-sm font-black">Bangladesh Address</p><p className="mt-1 text-xs text-[var(--school-muted)]">Division → District → Thana / Upazila → Post Office → Post Code</p></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label><span className="label">Division</span><select className="field w-full" value={form.division} onChange={(e) => setDivision(e.target.value)} disabled={addressLoading}><option value="">Select Division</option>{divisionOptions.map((d) => <option key={d.id} value={d.name}>{d.name} • {d.bn_name}</option>)}</select></label>
                <label><span className="label">District</span><select className="field w-full" value={form.district} onChange={(e) => setDistrict(e.target.value)} disabled={addressLoading || !form.division}><option value="">Select District</option>{filteredDistricts.map((d) => <option key={d.id} value={d.name}>{d.name} • {d.bn_name}</option>)}</select></label>
                <label><span className="label">Thana / Upazila</span><select className="field w-full" value={form.thana} onChange={(e) => setThana(e.target.value)} disabled={addressLoading || !form.district}><option value="">Select Thana / Upazila</option>{filteredUpazilas.map((u) => <option key={u.id} value={u.name}>{u.name} • {u.bn_name}</option>)}</select></label>
                <label><span className="label">Post Office</span><select className="field w-full" value={form.post_office} onChange={(e) => setPostOffice(e.target.value)} disabled={addressLoading || !form.district}><option value="">Select Post Office</option>{filteredPostcodes.map((p) => <option key={`${p.postOffice}-${p.postCode}`} value={p.postOffice}>{p.postOffice} • {p.postCode}</option>)}</select></label>
                <label><span className="label">Post Code</span><select className="field w-full" value={form.post_code} onChange={(e) => { const match = filteredPostcodes.find((p) => p.postCode === e.target.value); setForm((current) => ({ ...current, post_code: e.target.value, post_office: match?.postOffice || current.post_office })); }} disabled={addressLoading || !form.district}><option value="">Select Post Code</option>{Array.from(new Map(filteredPostcodes.map((p) => [p.postCode, p])).values()).map((p) => <option key={p.postCode} value={p.postCode}>{p.postCode} • {p.postOffice}</option>)}</select></label>
                <label><span className="label">City / Area</span><input className="field w-full" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City / Area" /></label>
                <label className="sm:col-span-2"><span className="label">House / Road / Village / Holding</span><input className="field w-full" value={form.address_line} onChange={(e) => set("address_line", e.target.value)} placeholder="House, road, village, holding, landmark" /></label>
              </div>
              {addressLoading ? <p className="mt-2 text-[10px] text-[var(--school-muted)]">Loading Bangladesh location data...</p> : null}
            </div>

            <label className="sm:col-span-2"><span className="label">Other Details</span><textarea className="field min-h-24 w-full py-3" value={form.details} onChange={(e) => set("details", e.target.value)} placeholder="Write any additional information here..." /></label>
          </div>
          <button disabled={saving || uploading} className="mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-bold theme-primary-bg disabled:opacity-60">{saving ? "Saving..." : uploading ? "Uploading documents..." : form.id ? "Update Member" : "Create Member & Generate ID"}</button>
        </form>

        <section className="order-2 min-w-0 rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-4 shadow-sm sm:p-6 lg:p-5">
          <div className="flex flex-col gap-3"><div><h2 className="text-xl font-black sm:text-2xl capitalize">{type} Members</h2><p className="mt-1 text-xs leading-5 text-[var(--school-muted)]">Admin-only member records.</p></div><div className="flex w-full gap-2"><input className="field min-w-0 flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID / name" /><button onClick={() => void load()} className="rounded-xl px-4 py-3 text-sm font-bold theme-primary-bg">Search</button></div></div>
          <div className="mt-5 space-y-3">{loading ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">Loading...</p> : null}{!loading && visible.map((m) => <article key={m.id} className="rounded-2xl border border-[var(--school-border)] p-4"><div className="flex gap-4">{m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary-soft)] text-[10px] font-bold theme-primary">No Photo</div>}<div className="min-w-0 flex-1"><p className="text-xs font-black theme-primary">{m.member_id}</p><h3 className="mt-1 break-words font-black">{m.full_name}</h3><p className="break-words text-xs text-[var(--school-muted)]">{m.role}{m.designation ? ` • ${m.designation}` : ""}{m.department ? ` • ${m.department}` : ""}{m.subject ? ` • ${m.subject}` : ""}</p>{(m.salary != null || m.qualification || m.grade || m.institute_name) ? <p className="mt-2 break-words text-xs text-[var(--school-muted)]">{m.salary != null ? `Salary: ${m.salary}` : ""}{m.qualification ? ` • ${m.qualification}` : ""}{m.grade ? ` • ${m.grade}` : ""}{m.institute_name ? ` • ${m.institute_name}` : ""}</p> : null}{m.details ? <p className="mt-2 break-words rounded-lg bg-[var(--school-primary-soft)] px-2.5 py-2 text-xs">{m.details}</p> : null}</div><div className="flex shrink-0 flex-col gap-2"><button onClick={() => void edit(m)} className="rounded-xl border border-[var(--school-border)] px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => void remove(m)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Remove</button></div></div></article>)}{!loading && !visible.length ? <p className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No members found.</p> : null}</div>
        </section>
      </div>
    </AdminPageShell>
  );
}
