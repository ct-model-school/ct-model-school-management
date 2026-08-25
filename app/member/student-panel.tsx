"use client";

type StudentFee={academic_year:string|null;total_charged:number;total_paid:number;total_discount:number;balance_due:number};
type Student={
  id:string;student_id:string|null;application_no:string|null;academic_year:string|null;admission_class:string|null;section:string|null;roll_no:string|null;
  full_name:string|null;full_name_bn:string|null;date_of_birth:string|null;gender:string|null;birth_certificate_no:string|null;religion:string|null;blood_group:string|null;
  previous_school:string|null;father_name:string|null;father_phone:string|null;mother_name:string|null;mother_phone:string|null;guardian_name:string|null;guardian_phone:string|null;
  guardian_relation:string|null;present_address:string|null;permanent_address:string|null;emergency_contact:string|null;email:string|null;status:string|null;admission_date:string|null;fee:StudentFee|null;
};
type Child={id:string;registration_no:string;source:string;student_id:string|null;student_name:string;class:string;section:string|null;status:string;created_at:string;student:Student|null};
type Props={children:Child[]};

function value(v:string|null|undefined){return v&&v.trim()?v:"Not provided";}
function date(v:string|null|undefined){return v?new Date(`${v}T00:00:00`).toLocaleDateString("en-GB"):"Not provided";}
function Field({label,value:fieldValue}:{label:string;value:string|null|undefined}){return <div className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-background)] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--school-muted)]">{label}</p><p className="mt-1 break-words text-sm font-bold text-[var(--school-text)]">{value(fieldValue)}</p></div>;}

export default function StudentPanel({children}:Props){
  if(!children.length)return <div className="rounded-2xl border border-dashed border-[var(--school-border)] p-8 text-center text-sm text-[var(--school-muted)]">No student is linked to this Parent account yet.</div>;
  return <section className="space-y-5">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] theme-primary">Student Information</p>
      <h2 className="mt-1 text-2xl font-black">My Students</h2>
      <p className="mt-1 text-sm text-[var(--school-muted)]">All student information currently stored in the school system is shown here for the linked child.</p>
    </div>
    {children.map(child=>{
      const s=child.student;
      return <article key={child.id} className="overflow-hidden rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] shadow-sm">
        <div className="border-b border-[var(--school-border)] bg-[var(--school-primary-soft)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider theme-primary">{s?.student_id||child.student_id||"Temporary Student ID"}</p>
              <h3 className="mt-1 text-xl font-black">{s?.full_name||child.student_name}</h3>
              <p className="mt-1 text-sm text-[var(--school-muted)]">Class {s?.admission_class||child.class}{s?.section||child.section?` • Section ${s?.section||child.section}`:""}{s?.roll_no?` • Roll ${s.roll_no}`:""}</p>
            </div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black ${child.status==="approved"||s?.status==="active"?"bg-emerald-100 text-emerald-700":child.status==="rejected"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{child.status.toUpperCase()}</span>
          </div>
        </div>

        {!s ? <div className="p-5 sm:p-6"><p className="rounded-2xl bg-[var(--school-primary-soft)] p-4 text-sm font-semibold text-[var(--school-muted)]">Registration is approved, but the student record has not been linked yet. Once the student record is linked, the complete profile will appear here.</p></div> : <div className="space-y-6 p-5 sm:p-6">
          <section>
            <h4 className="text-base font-black">Academic Information</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Student ID" value={s.student_id}/><Field label="Application No" value={s.application_no}/><Field label="Academic Year" value={s.academic_year}/><Field label="Class" value={s.admission_class}/><Field label="Section" value={s.section}/><Field label="Roll No" value={s.roll_no}/><Field label="Admission Date" value={date(s.admission_date)}/><Field label="Student Status" value={s.status}/>
            </div>
          </section>

          <section>
            <h4 className="text-base font-black">Personal Information</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full Name" value={s.full_name}/><Field label="বাংলা নাম" value={s.full_name_bn}/><Field label="Date of Birth" value={date(s.date_of_birth)}/><Field label="Gender" value={s.gender}/><Field label="Birth Certificate No" value={s.birth_certificate_no}/><Field label="Religion" value={s.religion}/><Field label="Blood Group" value={s.blood_group}/><Field label="Previous School" value={s.previous_school}/><Field label="Email" value={s.email}/>
            </div>
          </section>

          <section>
            <h4 className="text-base font-black">Parent & Guardian Information</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Father Name" value={s.father_name}/><Field label="Father Phone" value={s.father_phone}/><Field label="Mother Name" value={s.mother_name}/><Field label="Mother Phone" value={s.mother_phone}/><Field label="Guardian Name" value={s.guardian_name}/><Field label="Guardian Phone" value={s.guardian_phone}/><Field label="Guardian Relation" value={s.guardian_relation}/><Field label="Emergency Contact" value={s.emergency_contact}/>
            </div>
          </section>

          <section>
            <h4 className="text-base font-black">Address</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Present Address" value={s.present_address}/><Field label="Permanent Address" value={s.permanent_address}/>
            </div>
          </section>

          <section>
            <h4 className="text-base font-black">Fees & Payment</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Fee Academic Year" value={s.fee?.academic_year}/><Field label="Total Charged" value={s.fee?`৳ ${Number(s.fee.total_charged||0).toLocaleString()}`:null}/><Field label="Total Paid" value={s.fee?`৳ ${Number(s.fee.total_paid||0).toLocaleString()}`:null}/><Field label="Balance Due" value={s.fee?`৳ ${Number(s.fee.balance_due||0).toLocaleString()}`:null}/>
            </div>
          </section>
        </div>}
      </article>;
    })}
  </section>;
}
