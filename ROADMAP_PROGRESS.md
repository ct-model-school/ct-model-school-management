# Roadmap Progress

## People & Achievements

### Implemented in code
- [x] Unified `people_profiles` database model
- [x] Category support for Teacher, Committee, Staff, GPA-5, Scholarship and Other Achievement
- [x] `people_master_options` master-data table
- [x] Public `school_people` storage bucket setup
- [x] Public read policy for active profiles
- [x] Authenticated write policies for profiles and profile images
- [x] Admin `/admin/people` Quick Add module
- [x] Category-aware/dynamic form sections
- [x] Student class/section/year/exam/result dropdowns
- [x] Achievement and scholarship dropdowns
- [x] Photo upload handling
- [x] Add, edit, hide/show and delete profile actions
- [x] Category filtering in Admin
- [x] Reusable public `/people` profile page
- [x] Responsive public profile-card grid
- [x] Admin navigation entry for People & Achievements
- [x] Shared AdminPageShell navigation entry

### Requires manual Supabase action
Apply:

`supabase/manual/006_people_achievements.sql`

This creates the profile tables, RLS policies, master-data table and `school_people` storage bucket.

## Important

The production build has not been run in this environment because the repository cannot be cloned from GitHub from the current execution environment. Vercel should perform the authoritative build after the commit reaches `main`.

## Next implementation targets

1. Complete reusable detail/read-more profile pages.
2. Connect master dropdowns to `people_master_options` instead of hardcoded option arrays.
3. Add remaining public category routes/navigation.
4. Complete Notice, About, Philosophy and Contact Us pages.
5. Run Vercel build and fix only actual build/runtime errors.
6. Verify Admin -> Supabase -> Public data flow after SQL is applied.
