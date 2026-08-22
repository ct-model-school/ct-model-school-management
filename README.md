# CT Model School Management

## Project Roadmap & Implementation Plan

### Current Status

The project is an integrated school website and management system for **C.T. Model School**. The public website, Community/People foundation, admin management modules, theme system, Supabase integration and Vercel deployment workflow are already in active development.

---

## Phase 1: Public Website

- [x] Home page
- [x] Responsive header/navigation
- [x] Hero banner
- [x] About section
- [x] Philosophy section
- [x] Principal section
- [x] Community section
- [x] Contact section
- [x] Notice/public information foundation
- [x] Theme-aware UI
- [ ] Final desktop responsive regression test
- [ ] Final mobile responsive regression test

### Home Page Rules

- Keep the existing working desktop design unless a genuine bug is found.
- Hero artwork uses the project's wide banner design.
- Mobile hero must remain full-width and responsive without causing horizontal overflow.
- Public sections should remain centered and aligned to a consistent content rail.
- Do not redesign working sections unnecessarily.

---

## Phase 2: Community / People

- [x] Community/People admin foundation
- [x] Teachers
- [x] Management Committee
- [x] Staff/Employees
- [x] GPA-5 Students
- [x] Scholarship Students
- [x] Other Achievements
- [x] Profile photo upload
- [x] Profile edit
- [x] Category filtering
- [x] Display order
- [x] Hide/show
- [x] Delete
- [x] Public `/people` page
- [x] Public category pages
- [x] Read More profile details
- [ ] Final card alignment regression test on all screen sizes

---

## Phase 3: Admin People & Staff Management

- [x] Quick Add forms
- [x] Role field
- [x] Custom role creation
- [x] Role edit/remove foundation
- [x] Permission/access selection
- [x] Teacher salary and qualification fields
- [x] Staff salary option
- [x] Account salary and qualification fields
- [x] Bangladesh-style address fields
- [x] Profile Picture upload
- [x] Qualification certificate upload
- [x] NID front/back upload
- [x] Category-specific storage folders
- [ ] Final upload persistence verification in production

---

## Phase 4: Inventory / Store

- [x] Add Item form
- [x] Item notes
- [x] Notes displayed on item cards
- [x] Inventory management foundation
- [ ] Stock movement improvements
- [ ] Purchase/issue workflow refinement
- [ ] Reports and audit improvements

---

## Phase 5: Accounts & Finance

- [x] Account module foundation
- [x] Salary information
- [x] Qualification information
- [x] Grade and institution information
- [ ] Salary payment workflow
- [ ] Payment history
- [ ] Financial reports
- [ ] Monthly/annual summaries

---

## Phase 6: Notices & School Information

- [x] Notice foundation
- [x] Public notice display
- [ ] Notice categories
- [ ] Notice attachment support
- [ ] Archive/expiry handling
- [ ] Search and filtering

---

## Phase 7: Database & Security

- [x] Supabase integration
- [x] People database foundation
- [x] Admin RPC foundation
- [x] Storage bucket/policy foundation
- [ ] Verify all production migrations
- [ ] Review RLS policies
- [ ] Review storage policies
- [ ] Verify role-based access enforcement
- [ ] Production data backup/checklist

---

## Phase 8: Responsive UI

### Desktop
- [x] Centered public content rail
- [x] Responsive cards
- [x] Admin form layouts
- [ ] Final 1366px / 1440px / 1920px verification

### Mobile
- [x] Responsive navigation
- [x] Responsive forms
- [x] Responsive Community cards
- [x] Responsive hero foundation
- [ ] Final 320px verification
- [ ] Final 375px verification
- [ ] Final 390px verification
- [ ] Final 414px verification
- [ ] Final horizontal-overflow audit

---

## Phase 9: Production Deployment

- [x] GitHub `main` branch connected to Vercel
- [x] Production project exists on Vercel
- [x] Successful production deployments verified previously
- [ ] Confirm GitHub push → Vercel automatic deployment
- [ ] Verify latest responsive hero commit reaches production
- [ ] Run production build verification
- [ ] Verify production environment variables
- [ ] Verify Supabase production connection
- [ ] Final smoke test of public website
- [ ] Final smoke test of Admin panel

### Deployment Test

A harmless deployment-trigger commit has been pushed to `main` to verify whether the GitHub → Vercel automatic deployment integration is currently responding to new pushes.

**Test commit:** `31c89dfa11a30c79bb353aaf1e4c4e4a43b7cee5`

Do not change application functionality just to trigger deployment. Use a harmless documentation/test commit when deployment connectivity needs to be checked.

---

## Phase 10: Final QA

1. Run `npm run build`.
2. Check TypeScript errors.
3. Check console errors.
4. Check mobile horizontal overflow.
5. Check hero image at common mobile widths.
6. Check all Community cards and Read More behavior.
7. Check Principal profile/photo persistence.
8. Check Admin profile edit/save.
9. Check file uploads and storage paths.
10. Check role/permission behavior.
11. Check Supabase data persistence.
12. Check production deployment.
13. Verify public and Admin routes after deployment.

---

## Development Rules

1. Work directly on the GitHub `main` branch unless a feature requires a separate branch.
2. Do not modify a working section without a specific requirement or bug.
3. Do not replace existing functionality with temporary mock data.
4. Every new feature must be responsive and theme-aware.
5. Keep public website, Admin, Supabase and storage data flow consistent.
6. Test the affected area before considering a feature complete.
7. Preserve existing working desktop layouts when fixing mobile issues.
8. Prefer the smallest safe change that solves the actual problem.
9. After code changes, verify GitHub commit status and Vercel deployment status.
10. Do the work first, then explain the result.

---

## Next Recommended Order

**1.** Verify GitHub → Vercel automatic deployment  
**2.** Finish mobile/desktop responsive regression testing  
**3.** Verify Supabase production migrations and storage  
**4.** Complete Notice enhancements  
**5.** Complete Accounts/Finance workflow  
**6.** Complete Inventory workflow/reporting  
**7.** Final security/RLS review  
**8.** Production smoke test and release checklist
