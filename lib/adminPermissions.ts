import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminPermissionKey =
  | "dashboard"
  | "students"
  | "parents"
  | "people"
  | "teachers"
  | "accounts"
  | "store_members"
  | "inventory"
  | "notices"
  | "results";

export async function getCurrentAdminPermissions() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("store_get_member_role_permissions", {
    p_role_name: profile.role.name,
  });

  if (error) {
    return { profile, permissions: {} as Record<string, boolean> };
  }

  return {
    profile,
    permissions: (data ?? {}) as Record<string, boolean>,
  };
}

export async function requireAdminPermission(permission: AdminPermissionKey | AdminPermissionKey[]) {
  const access = await getCurrentAdminPermissions();
  if (!access) redirect("/admin/login");

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = required.some((key) => Boolean(access.permissions[key]));

  if (!allowed) redirect("/admin");
  return access;
}
