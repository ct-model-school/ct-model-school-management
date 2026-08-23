revoke all on function public.sync_member_public_community_profile() from public;
revoke all on function public.sync_member_public_community_profile() from anon;
revoke all on function public.sync_member_public_community_profile() from authenticated;
revoke all on function public.sync_member_public_community_profile() from service_role;

drop function if exists public.public_community_profiles();
