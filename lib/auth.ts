import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      is_active,
      role_id,
      roles (
        id,
        name,
        description
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  const role = Array.isArray(data.roles) ? data.roles[0] : data.roles;

  if (!role) return null;

  return {
    ...data,
    role,
  };
}
