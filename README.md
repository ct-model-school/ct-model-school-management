# CT Model School Management

## Project Roadmap & Implementation Plan

### Current Status

The project is an integrated school website and management system for **C.T. Model School**. The public website, Community/People foundation, Admin management modules, Student Admission/Registration workflow, theme system, Supabase integration and Vercel deployment workflow are in active development.

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
- [x] Member-linked payment and due tracking
- [x] Member ID lookup/autofill in Accounts entry
- [ ] Salary payment workflow refinement
- [ ] Payment history refinement
- [ ] Financial reports
- [ ] Monthly/annual summaries

---

## Phase 6: Students & Admission / Registration

### New Student Admission

- [x] Public Student Admission Registration form
- [x] Academic year and admission class
- [x] Student information
- [x] Parent/guardian information
- [x] Address and contact information
- [x] Application number generation
- [x] Pending application storage
- [x] Admin admission review
- [x] Admin approve/reject workflow
- [x] Student ID generation after approval
- [x] Parent record creation and student-parent linking

### Existing Student Registration

- [x] Dedicated Existing Student Registration route
- [x] Existing Student ID validation
- [x] Academic year and class update request
- [x] Parent/guardian contact update request
- [x] Address/contact update request
- [x] Admin review workflow
- [x] Admin approve/reject workflow
- [x] Approved updates modify the existing student record only
- [x] Duplicate student creation prevented by the workflow

### Admin Student Management

- [x] Students module exposed in Admin navigation
- [x] Students module exposed on Admin Dashboard
- [x] New Student Admission Applications
- [x] Existing Student Registration Requests
- [x] Controlled approval-based student data flow
- [ ] Student master list/search/filter refinement
- [ ] Student profile management refinement
- [ ] Academic session/class/section management

---

## Phase 7: Notices & School Information

- [x] Notice foundation
- [x] Public notice display
- [ ] Notice categories
- [ ] Notice attachment support
- [ ] Archive/expiry handling
- [ ] Search and filtering

---

## Phase 8: Database & Security

- [x] Supabase integration
- [x] People database foundation
- [x] Student admission registration RPC foundation
- [x] Existing student registration RPC foundation
- [x] Admin RPC foundation
- [x] Storage bucket/policy foundation
- [ ] Verify all production migrations
- [ ] Review RLS policies
- [ ] Review storage policies
- [ ] Verify role-based access enforcement
- [ ] Production data backup/checklist

---

## Phase 9: Responsive UI

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

## Phase 10: Production Deployment

- [x] GitHub `main` branch connected to Vercel
- [x] Production project exists on Vercel
- [x] Successful production deployments verified previously
- [ ] Confirm GitHub push → Vercel automatic deployment
- [ ] Run production build verification
- [ ] Verify production environment variables
- [ ] Verify Supabase production connection
- [ ] Final smoke test of public website
- [ ] Final smoke test of Admin panel
- [ ] Final smoke test of Student Admission
- [ ] Final smoke test of Existing Student Registration
- [ ] Final smoke test of Admin Student approvals

---

## Phase 11: Final QA

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
12. Submit a New Student Admission test application.
13. Approve and reject admission test applications from Admin.
14. Submit an Existing Student Registration test request.
15. Approve and reject existing-student requests from Admin.
16. Verify no duplicate student is created by an existing-student update.
17. Check Accounts Member ID lookup and calculation.
18. Check production deployment.
19. Verify public and Admin routes after deployment.

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
9. Every new module or workflow must be exposed in Admin when administrative action is required.
10. New permissions must use the existing central Role/Permission system, not a parallel permission system.
11. After code changes, verify GitHub commit status and Vercel deployment status.
12. Do the work first, then explain the result.

---

## Next Recommended Order

**1.** Verify Student Admission + Existing Student Registration in production  
**2.** Finish mobile/desktop responsive regression testing  
**3.** Verify Supabase production migrations and RLS  
**4.** Complete Notice enhancements  
**5.** Complete Accounts/Finance workflow and reports  
**6.** Complete Inventory workflow/reporting  
**7.** Complete Student master/search/profile refinement  
**8.** Final security/RLS review  
**9.** Production smoke test and release checklist
