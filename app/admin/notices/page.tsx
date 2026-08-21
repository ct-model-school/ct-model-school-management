import { AdminEmptyState, AdminInfoCard, AdminPageShell } from "@/components/admin/AdminPageShell";

export default function NoticesPage() {
  return (
    <AdminPageShell eyebrow="Communication" title="Notices" description="School notices and announcements will be implemented once the supporting data model and publishing permissions are verified.">
      <div className="grid gap-5 md:grid-cols-3">
        <AdminInfoCard label="Module" value="Announcements" description="School communication and notice publishing." />
        <AdminInfoCard label="Stage" value="Foundation" description="A theme-aware route shell is in place." />
        <AdminInfoCard label="Dependency" value="Publishing rules" description="Audience, status and permission behavior must be established first." />
      </div>
      <div className="mt-5"><AdminEmptyState title="No notices connected yet" description="This page deliberately waits for the verified notice schema instead of creating an unapproved workflow." /></div>
    </AdminPageShell>
  );
}
