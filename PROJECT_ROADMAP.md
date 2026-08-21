# CT Model School Management
## Final Roadmap & Implementation Plan

> **Status:** Roadmap Locked
> **Source of truth:** `README.md` + current repository implementation
> **Purpose:** This file is the master implementation roadmap for the next development phase.

---

# 1. Core Development Rules

Before starting any task:

1. Do the work first, then explain it.
2. Do not leave unnecessary gaps between related implementation steps.
3. Do not modify existing working sections unless the change is required.
4. Do not create new bugs while fixing or adding features.
5. Preserve the current working Home page, Header, Hero, Mobile Hero behavior, Logo, Official Links, Admin layout, and theme system unless an actual bug is found.
6. Every new feature must be responsive on PC and mobile.
7. Every new feature must follow the existing theme/token system.
8. Test the affected feature after implementation before moving to the next feature.
9. Keep Admin, Database and Public Website data flow consistent.
10. Avoid unnecessary redesign. Improve only where the roadmap requires it.
11. Work in small, verified sections. Do not mass-rewrite unrelated files.
12. Never expose secrets, service-role keys, passwords or private credentials.
13. Database changes must be deliberate and documented. Provide manual Supabase SQL when direct database execution is unavailable.

---

# 2. Existing Working Areas

These areas are considered working/approved and must not be redesigned unnecessarily:

- Home page layout
- Header
- Hero section
- Hero image behavior
- Hero mobile behavior
- Logo
- School name in header
- Official Links visual treatment
- Existing Admin layout
- Existing theme system

Only modify them when:

- A real bug is discovered
- A new feature genuinely requires a compatible change
- The change is specifically required by this roadmap

---

# 3. Current Known Blocker: Public Map

The current public Contact/location map is **not considered complete**.

Observed problem:

- Google map iframe currently shows `www.google.com refused to connect`.
- The previous iframe approach does not provide the required reliable interactive experience.
- The required result is similar to the working Shafa Abid Automation BD map reference: real map rendering, zoom and map interaction, including satellite/normal map capability where supported.

## Map requirements

- Use the location configured from Admin Settings.
- Do not hardcode Shafa Abid Automation BD or any other unrelated location.
- Do not depend on a fragile Google page iframe that can refuse connection.
- Interactive map must support zoom and pan.
- Normal map and satellite view should be available where the selected map provider supports it.
- Correct school marker/location must be shown.
- `Open in Maps` should remain available as a fallback/navigation action.
- Desktop and mobile layouts must work correctly.
- If the interactive map provider cannot load, show a clean fallback location panel instead of a broken iframe.
- Map styling/container must remain theme-aware.
- Admin Settings must remain the source of the location data.

## Map completion criteria

The map is not done until the deployed public site shows the actual C.T. Model School location and the map can be interacted with on desktop and mobile without the `refused to connect` error.

---

# 4. Phase 1: People & Achievements Management

## Goal

Create one common management system for all people and achievement profiles instead of separate duplicated systems.

### Admin Module

**Admin → People & Achievements**

Categories:

- Our Teachers
- Management Committee
- Our Staff / Employees
- GPA-5 Achievers
- Scholarship Achievers
- Other Achievements

---

# 5. Quick Add Profile Form

The Admin form must be optimized for fast data entry.

Principle:

**Less typing + more dropdown/select + maximum reusable data = faster entry.**

## Common fields

- Category
- Name
- Photo
- Designation / Role
- Department
- Short Description
- Contact Information
- Status
- Display Order

## Dynamic category fields

### Teacher

- Name
- Photo
- Designation
- Department
- Subject
- Short Description
- Contact
- Status
- Display Order

### Management Committee

- Name
- Photo
- Committee
- Position
- Responsibility
- Short Description
- Contact
- Status
- Display Order

### Staff / Employee

- Name
- Photo
- Job Title
- Department
- Short Description
- Contact
- Status
- Display Order

### GPA-5 / Student Achievement

- Student Name
- Photo
- Class
- Section
- Academic Year
- Exam
- Result / GPA
- Achievement Type
- Short Description
- Status
- Display Order

### Scholarship Achiever

- Student Name
- Photo
- Class
- Section
- Academic Year
- Scholarship Type
- Achievement
- Short Description
- Status
- Display Order

### Other Achievement

- Name
- Photo
- Achievement Type
- Year
- Achievement Details
- Short Description
- Status
- Display Order

---

# 6. Dropdown / Master Data System

Frequently repeated information should not require repeated typing.

Master-data candidates:

- Class
- Section
- Department
- Subject
- Designation
- Committee
- Committee Position
- Achievement Type
- Exam
- Academic Year
- Scholarship Type
- Status

Where appropriate, Admin must be able to add/edit master options without changing source code.

---

# 7. Admin CRUD

People & Achievements must support:

- Add
- View
- Edit
- Delete / Deactivate
- Search
- Category filtering
- Reorder / Display Order
- Active / Inactive status
- Photo management

Avoid unnecessary duplicate database structures.

---

# 8. Common Public Profile Card

Use one reusable profile-card component across people and achievement categories.

```text
Photo
↓
Name
↓
Designation / Role / Achievement
↓
Short Description
↓
Read More
↓
Relevant Contact / Action Icons
```

## Desktop

- Follow the approved profile-card visual direction.
- Target 5 cards per row where screen width allows.

## Mobile

- Responsive cards
- No horizontal overflow
- No clipped text
- No broken images
- Correct spacing
- Correct icon/button alignment

---

# 9. Public People & Achievement Pages

Complete:

## Our Teachers

- Photo
- Name
- Designation
- Subject / Department
- Description
- Read More
- Contact options where available

## Management Committee

- Photo
- Name
- Position
- Responsibility
- Description
- Read More
- Contact options where applicable

## Our Staff / Employees

- Photo
- Name
- Job Title
- Department
- Description
- Read More
- Contact options where applicable

## GPA-5 Achievers

- Student photo
- Student name
- Exam
- Year
- GPA/result
- Class where applicable
- Achievement description

## Scholarship Achievers

- Student photo
- Name
- Scholarship
- Year
- Class where applicable
- Achievement details

## Other Achievements

Support:

- Academic achievements
- Sports achievements
- Cultural achievements
- Competition winners
- Other special achievements

---

# 10. Phase 2: Notice

## Public

- Notice list
- Notice title
- Published date
- Notice details
- Search/filter where useful
- Mobile responsive

## Admin

- Add notice
- Edit notice
- Publish/unpublish
- Delete/deactivate
- Date
- Title
- Content
- Attachment support where required by the existing architecture

---

# 11. Phase 3: About

Complete the About page using existing Admin-managed information where applicable.

Possible sections:

- School overview
- School description
- Establishment information
- School information
- School history/details

Do not duplicate data already maintained in Admin Settings.

---

# 12. Phase 4: Philosophy

Create/complete:

- Vision
- Mission
- Core Values
- Educational Philosophy

Use the existing website design language and theme system.

---

# 13. Phase 5: Contact Us

Complete Contact Us with:

- Address
- Phone
- WhatsApp
- Email
- Office hours
- Official links
- Recognizable platform/contact icons
- Working interactive map based on Admin Settings location
- `Open in Maps` action

Map implementation must satisfy the dedicated map requirements in Section 3.

---

# 14. Responsive Requirements

Every new page/component must be tested at:

### Desktop

- Normal PC width
- Browser zoom levels where practical

### Mobile

- Small mobile
- Standard mobile
- Larger mobile

Check:

- Header
- Navigation
- Hero
- Cards
- Images
- Text
- Buttons
- Forms
- Tables/lists
- Footer
- Map
- Horizontal overflow
- Touch targets

Do not introduce global mobile zoom-in/zoom-out behavior or change the approved mobile layout while fixing an isolated feature.

---

# 15. Theme Requirements

All new features must be theme-aware.

Use existing theme variables/tokens for:

- Primary color
- Primary hover
- Soft/tint variants
- Background
- Surface
- Border
- Theme-dependent text colors

Do not introduce unnecessary hardcoded primary/gold/base colors.

Neutral colors such as standard text and grays may remain neutral where appropriate.

Every changed UI feature must receive a theme/color audit before completion.

---

# 16. Data Flow Requirement

Expected architecture:

```text
ADMIN
  ↓
Quick Add / Edit / Settings
  ↓
Supabase Database / Storage
  ↓
Public Website
  ↓
Profile / Notice / Content / Location
```

Any Admin-managed content must be verified on the public website.

Changes made from Admin must correctly appear on the corresponding public page.

Location/map data must follow the same Admin → Database → Public flow.

---

# 17. Testing Order

After each major feature:

1. Check TypeScript
2. Check runtime behavior
3. Check Admin behavior
4. Check database save/update
5. Check public display
6. Check desktop
7. Check mobile
8. Check theme consistency
9. Check for regressions

For map work additionally verify:

10. Actual configured school location
11. Interactive zoom/pan
12. Satellite/normal view where supported
13. `Open in Maps`
14. No iframe `refused to connect` error
15. Production deployment behavior

At the end:

```bash
npm run build
```

Then verify the Vercel deployment.

---

# 18. Locked Development Order

### Priority 0
**Fix and verify the public interactive map**

### Priority 1
**People & Achievements Management**

### Priority 2
**Quick Add + Dropdown / Master Data**

### Priority 3
**Admin CRUD + Database**

### Priority 4
**Common Public Profile Cards**

### Priority 5
**Teachers + Committee + Staff + Student Achievements**

### Priority 6
**Notice**

### Priority 7
**About**

### Priority 8
**Philosophy**

### Priority 9
**Contact Us completion + map integration**

### Priority 10
**Full PC + Mobile Responsive Testing**

### Priority 11
**Admin → Database → Public Data Flow Testing**

### Priority 12
**Production Build + Vercel Deployment Verification**

---

# 19. Final Public Website Scope

The target public structure is:

```text
Home
├── About
├── Notice
├── Philosophy
├── Our Teachers
├── Management Committee
├── Our Staff / Employees
├── GPA-5 Achievers
├── Scholarship Achievers
├── Other Achievements
├── Principal
└── Contact Us
```

The Admin side must provide the necessary tools to manage these sections efficiently.

---

# 20. Definition of Done

A feature is complete only when:

- Admin can manage the required data
- Data saves correctly
- Public page displays the correct data
- Edit/update works
- Deactivate/delete behavior works
- Images work correctly
- Responsive behavior is correct
- Theme is consistent
- No existing working feature is broken
- TypeScript passes
- Production build passes
- Vercel deployment is verified

For the map specifically:

- C.T. Model School location is shown
- Location comes from Admin Settings
- Map is interactive
- Zoom/pan works
- Satellite/normal view works where supported
- Open in Maps works
- No `refused to connect` iframe error
- Desktop and mobile both work

---

# 21. Current Repository State

The repository already contains the People & Achievements foundation, including the unified profile model, category support, master-data foundation, public storage setup, Admin Quick Add, photo handling, CRUD actions, filtering, public profile cards and responsive public profile layout. fileciteturn843file0L2-L2

The earlier roadmap also records that the Admin shell, central theme foundation, reusable admin primitives, module shells, loading/error boundaries and expanded school settings foundation are already implemented. fileciteturn842file0L2-L2

The repository's README establishes that the immediate development objective is functional completion of the missing pages and a reusable data-driven People & Achievements system, not unnecessary cosmetic redesign. The README also defines the final development order and Definition of Done used by this roadmap. fileciteturn861file0L2-L2

---

# FINAL RULE

> **আগে কাজ, তারপর explanation.**
>
> **Existing working layout অকারণে touch করা যাবে না।**
>
> **একটা কাজ পুরোপুরি stable করে তারপর next কাজ।**
>
> **Bug fix করতে গিয়ে নতুন bug তৈরি করা যাবে না।**

This is the locked roadmap for the next development sessions.
