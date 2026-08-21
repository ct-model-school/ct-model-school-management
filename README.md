# CT Model School Management
## Final Roadmap & Implementation Plan

> **Status:** Roadmap Locked  
> **Purpose:** This document is the working plan for the next development phase of the CT Model School Management project.

---

## 1. Core Development Rule

Before starting any task:

1. **Do the work first, then explain it.**
2. Do not leave unnecessary gaps between related implementation steps.
3. Do not modify existing working sections unless the change is required.
4. Do not create new bugs while fixing or adding features.
5. Preserve the current working Home page, Header, Hero, Mobile Hero behavior, Logo, Official Links, Admin layout, and theme system unless an actual bug is found.
6. Every new feature must be responsive on PC and mobile.
7. Every new feature must follow the existing theme/token system.
8. Test the affected feature after implementation before moving to the next feature.
9. Keep database, Admin, and Public Website data flow consistent.
10. Avoid unnecessary redesign. Improve only where the roadmap requires it.

---

# 2. Phase 1: People & Achievements Management

## Goal

Create one common management system for all people and achievement profiles instead of building separate, duplicated systems.

### Admin Module

Create:

**Admin → People & Achievements**

Categories:

- Our Teachers
- Management Committee
- Our Staff / Employees
- GPA-5 Achievers
- Scholarship Achievers
- Other Achievements

---

# 3. Quick Add Profile Form

The Admin form must be designed for **fast data entry**.

### Main principle

**Less typing + more dropdown/select + maximum reusable data = faster entry**

### Common fields

- Category
- Name
- Photo
- Designation / Role
- Department
- Short Description
- Contact Information
- Status
- Display Order

### Dynamic fields by category

The form should show only the fields relevant to the selected category.

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

# 4. Dropdown / Master Data System

Frequently repeated information should not require repeated typing.

Potential dropdown/master data:

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

Where appropriate, Admin should be able to add/edit master options without changing source code.

---

# 5. Admin CRUD

The People & Achievements module must support:

- Add
- View
- Edit
- Delete / Deactivate
- Search
- Filter by category
- Reorder / Display Order
- Active / Inactive status
- Photo management

The system should avoid unnecessary duplicate data structures.

---

# 6. Common Public Profile Card

All people/achievement categories should use one reusable profile-card component.

### Card structure

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

### Desktop

Use the existing visual direction shown in the approved profile-card reference.

Target:

**5 cards per row where screen width allows.**

### Mobile

Cards must adapt responsively.

Requirements:

- No horizontal overflow
- No clipped text
- No broken image
- Proper spacing
- Proper button/icon alignment

---

# 7. Public People & Achievement Pages

Create/complete:

## Our Teachers

Show teacher profiles with:

- Photo
- Name
- Designation
- Subject / Department
- Description
- Read More
- Contact options where available

## Management Committee

Show:

- Photo
- Name
- Position
- Responsibility
- Description
- Read More
- Contact options where applicable

## Our Staff / Employees

Show:

- Photo
- Name
- Job Title
- Department
- Description
- Read More
- Contact options where applicable

## GPA-5 Achievers

Show:

- Student photo
- Student name
- Exam
- Year
- GPA/result
- Class where applicable
- Achievement description

## Scholarship Achievers

Show:

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

# 8. Phase 2: Notice

Create/complete the Notice system.

### Public

- Notice list
- Notice title
- Published date
- Notice details
- Search/filter where useful
- Mobile responsive

### Admin

- Add notice
- Edit notice
- Publish/unpublish
- Delete/deactivate
- Date
- Title
- Content
- Attachment support if required by the existing architecture

---

# 9. Phase 3: About

Complete the About page.

Possible sections:

- School overview
- School description
- Establishment information
- School information
- Existing Admin-managed information
- Relevant school history/details

Do not duplicate data that already exists in Admin settings.

---

# 10. Phase 4: Philosophy

Create/complete the Philosophy page.

Sections:

- Vision
- Mission
- Core Values
- Educational Philosophy

Use the existing website design language and theme.

---

# 11. Phase 5: Contact Us

Complete the Contact Us page.

Information:

- Address
- Phone
- WhatsApp
- Email
- Office hours
- Official links
- Relevant platform/contact icons

Use recognizable platform icons, not generic text symbols.

---

# 12. Existing Working Areas: DO NOT CHANGE UNNECESSARILY

The following areas are currently considered working/approved:

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

### Rule

**Do not redesign these areas while implementing the roadmap.**

Only change them if:

- A real bug is discovered
- A new feature genuinely requires a compatible change
- The change is specifically approved

---

# 13. Responsive Requirements

Every new page and component must be tested at:

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
- Horizontal overflow
- Touch targets

---

# 14. Theme Requirements

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

Every new feature must receive a theme/color audit before completion.

---

# 15. Data Flow Requirement

The expected architecture is:

```text
ADMIN
  ↓
Quick Add / Edit
  ↓
Database
  ↓
Public Website
  ↓
Profile / Notice / Content
```

Any Admin-managed content must be verified on the public website.

Changes made from Admin should correctly appear on the corresponding public page.

---

# 16. Testing Order

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

At the end, run the production build:

```bash
npm run build
```

Then verify the Vercel deployment.

---

# 17. Final Development Order

The locked implementation order is:

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
**Contact Us**

### Priority 10
**Full PC + Mobile Responsive Testing**

### Priority 11
**Admin → Database → Public Data Flow Testing**

### Priority 12
**Production Build + Vercel Deployment Verification**

---

# 18. Final Scope

The immediate objective is **not cosmetic polishing**.

The immediate objective is to complete the missing functional pages and build a reusable, data-driven People & Achievements system.

The website should end up with a consistent structure:

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

And the Admin side should provide the necessary tools to manage these sections efficiently.

---

# 19. Definition of Done

A feature is considered complete only when:

- Admin can manage the required data
- Data saves correctly
- Public page displays the correct data
- Edit/update works
- Deactivate/delete behavior works
- Images work correctly
- Responsive behavior is correct
- Theme is consistent
- No existing working feature is broken
- TypeScript/build passes
- Production deployment is verified

---

## FINAL RULE

> **আগে কাজ, তারপর explanation.**
>
> **Existing working layout অকারণে touch করা যাবে না।**
>
> **একটা কাজ পুরোপুরি stable করে তারপর next কাজ।**
>
> **Bug fix করতে গিয়ে নতুন bug তৈরি করা যাবে না।**

This README is the reference roadmap for the next development session.
