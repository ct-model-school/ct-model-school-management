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

const isOwnerRole = (roleName: string) =>
  ["super_admin", "super admin", "admin", "administrator"].includes(
    roleName.toLowerCase().replace(/_/g, " "),
  );

export async function getCurrentAdminPermissions() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("store_get_member_role_permissions", {
    p_role_name: profile.role.name,
  });

  if (error) {
    return {
      profile,
      isOwner: isOwnerRole(profile.role.name),
      permissions: {} as Record<string, unknown>,
    };
  }

  return {
    profile,
    isOwner: isOwnerRole(profile.role.name),
    permissions: (data ?? {}) as Record<string, unknown>,
  };
}

export async function requireAdminPermission(permission: AdminPermissionKey | AdminPermissionKey[]) {
  const access = await getCurrentAdminPermissions();
  if (!access) redirect("/admin/login");

  // Owner/Admin is the highest trust level. Do not let stale or incomplete
  // role-permission rows block an owner from an administrative workspace.
  if (access.isOwner) return access;

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = required.some((key) => Boolean(access.permissions[key]));

  if (!allowed) redirect("/admin");
  return access;
}
