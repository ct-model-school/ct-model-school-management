# C.T. Model School Management System

## Purpose
This is the master implementation roadmap for the C.T. Model School project. The repository itself is the source of truth. SutoCraft is reference material only and must never be modified.

## Non-negotiable project rules
- C.T. Model School is the actual product.
- SutoCraft is reference-only. Never copy its UI wholesale and never modify its repository.
- Every page, component, layout, form, card, table, modal and feature must be theme-aware from the start.
- Never hardcode primary/theme colors inside individual pages or components.
- Theme colors, derived tints/alphas, backgrounds, borders and other theme-dependent colors must come from the central theme/settings system.
- Theme must be changeable from Admin Settings and changes must propagate consistently through the application.
- Preserve existing working behavior unless the current task intentionally changes it.
- Do not make unrelated changes or mass-rewrite unrelated files.
- Database changes must be deliberate, documented, and supplied as manual Supabase SQL when direct database execution is unavailable.
- Never expose secrets, service-role keys, passwords or private credentials in source code.
- Finish each bounded section with lint/build verification before committing.

## Development strategy
Work in small, verified sections. Do not try to implement the entire school-management system in one pass.

### Phase 0: Foundation and baseline
- Keep the Next.js application building cleanly.
- Keep Supabase client/session integration stable.
- Keep the central theme provider/settings foundation stable.
- Keep authentication and authorization boundaries explicit.
- Remove baseline build blockers without inventing feature behavior.

### Phase 1: Administration foundation
- Admin login and authenticated admin access. **Complete.**
- Protected admin layout/shell. **Complete.**
- Admin dashboard foundation. **Complete.**
- Role and permission model using the existing `roles`, `permissions`, and `role_permissions` structure. **Foundation verified; deeper permission audit remains.**
- Profile linkage for authenticated users. **Complete.**
- Central school settings and theme configuration. **Complete.**
- Admin-controlled primary/theme color and related visual tokens. **Complete.**

### Phase 2: Admin experience
**In progress.** Build the real administration UI around the established foundation, including navigation, reusable UI primitives, responsive layouts, loading/error/empty states, and consistent access checks.

Completed in this section so far:
- Responsive admin shell with desktop sidebar and mobile header.
- Central administration navigation.
- Theme-aware dashboard and settings presentation.
- Dashboard module status cards and central settings entry point.
- Shared visual tokens used instead of page-level primary colors.

Next bounded work:
- Reusable admin UI primitives.
- Loading/error/empty states.
- Consistent module route access checks.
- Module shells before database-backed feature implementation.

### Phase 3: Core school configuration
Implement the school-wide configuration needed by later modules. Keep configuration centralized and avoid duplicating settings in individual pages.

### Phase 4: Academic and people management
Implement school-management modules in dependency order, with database relationships and permissions designed before feature UI. Likely areas include students, parents/guardians, teachers/staff, academic records and related registration flows. Do not invent fields or workflows when the existing database/project requirements do not establish them.

### Phase 5: Finance, inventory and operations
Implement the management areas represented by the project structure, including accounts/finance and inventory/stock workflows, using the same permission and theme systems.

### Phase 6: Notices, reports and supporting workflows
Implement notices, results/reports and other supporting school workflows after their dependent data models are stable.

### Phase 7: Public website
Build the public-facing school website separately from the admin application. It must have its own C.T. Model School design and must not become a copy of SutoCraft.

### Phase 8: Final hardening
- Full route audit.
- Permission/RLS audit.
- Theme/color audit.
- Responsive/mobile audit.
- Loading/error/empty-state audit.
- Lint/build verification.
- Remove dead placeholders and accidental debug output.
- Verify production build before release.

## Current state
- Admin authentication is working locally.
- `/admin` dashboard foundation is working locally.
- Protected admin shell/navigation is now implemented.
- Central theme foundation is active and login/dashboard/settings use the theme system.
- Admin Settings can persist the central school primary color through `school_settings`.
- Baseline lint and production build were previously verified for the foundation.
- The first verified foundation changes have been committed and pushed.
- `supabase/manual/001_school_settings.sql` exists for the school settings/RLS foundation and must be applied manually in Supabase when the task reaches that dependency.

## How to work from this roadmap
1. Read this file before starting a new feature.
2. Inspect the existing implementation and database assumptions first.
3. Choose one bounded section that moves the roadmap forward.
4. Implement it without touching unrelated functionality.
5. Perform a theme/color audit for every changed UI file.
6. Run lint/build (and relevant tests/checks).
7. If database changes are required, provide the exact SQL for manual Supabase execution and wait for the result when needed.
8. Commit only verified changes with a clear message.
9. Push the completed section to GitHub so the user can pull and test locally.
10. Continue from the next roadmap section rather than waiting for the user to design every individual step.
