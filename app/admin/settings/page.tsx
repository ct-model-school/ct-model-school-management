import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import SettingsForm from "./SettingsForm";
import AssetUploadPanel from "./AssetUploadPanel";
import HeroSlidesPanel from "./HeroSlidesPanel";

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/admin/login?next=/admin/settings");
  }

  const roleName = profile.role.name.toLowerCase();

  if (!["admin", "administrator", "super_admin"].includes(roleName)) {
    redirect("/admin");
  }

  return (
    <>
      <SettingsForm />
      <AssetUploadPanel />
      <HeroSlidesPanel />
    </>
  );
}
