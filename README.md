# CT Model School Management
## Final Roadmap & Implementation Plan

> **Status:** People & Achievements foundation and public category pages implemented; Notice, About, Philosophy and Contact pages already implemented in the current main branch. Supabase migrations must still be applied manually before People data can be stored in a fresh environment.

## Current implementation status

### Completed in code
- People & Achievements database foundation and secure admin RPCs
- Common `people_profiles` data model for Teachers, Management Committee, Staff/Employees, GPA-5, Scholarship and Other Achievements
- Master-data table for reusable dropdown values
- Admin People & Achievements Quick Add with category-aware fields
- Profile photo upload bucket and storage policies
- People CRUD, hide/show, delete, category filter and display order
- Public `/people` data-driven page
- Public category routes under `/people/[category]`
- GPA-5 and Scholarship public role display as `Student`
- Existing Notice admin/public flow verified in code
- Existing About page verified as database-driven from school settings
- Existing Philosophy page verified and theme-aware
- Existing Contact page verified with configured contact data and map fallback
- Existing Store/SR module remains present and separate from this roadmap phase

### Manual Supabase migrations to apply
1. `supabase/migrations/20260823_people_master_data.sql`
2. `supabase/migrations/20260823_people_admin_rpc.sql`
3. `supabase/migrations/20260823_people_storage.sql`

Apply them in the Supabase SQL Editor in the listed order. The storage migration creates the `school_people` public bucket and policies used by the People photo upload form.

### Still requiring a dedicated verification pass
- Full production `npm run build` could not be executed in this environment because external network/DNS access is unavailable for dependency installation.
- Fresh Supabase execution of the new migrations and end-to-end Admin → Database → Public verification must be performed after applying the SQL.
- Master-data options are implemented and manageable, but the Quick Add form still contains some category-specific fallback inputs; replacing every repeated input with live master-data selects is a follow-up refinement.
- A fully shared profile-card component can be extracted from the existing public card implementations in a later cleanup pass; no existing public layout should be redesigned for that extraction.

## Locked roadmap

The remaining roadmap continues in this order: People verification/refinement → Notice enhancements → About → Philosophy → Contact → responsive regression testing → production build/deployment verification.

The existing working Home page, Header, Hero, mobile Hero behavior, Logo, Official Links, Admin layout and theme system must remain unchanged unless a genuine bug or required integration is found.

---

## Core Development Rule

1. Do the work first, then explain it.
2. Do not modify existing working sections unless required.
3. Do not create new bugs while fixing or adding features.
4. Every new feature must be responsive and theme-aware.
5. Keep Admin, database and public website data flow consistent.
6. A feature is complete only after its actual code, data flow and testing requirements are satisfied.
