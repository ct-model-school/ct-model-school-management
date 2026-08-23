# C.T. Model School Management System
## FINAL ROADMAP, ARCHITECTURE & IMPLEMENTATION GUIDE

> **STATUS: LOCKED REFERENCE**
>
> This document explains what the system is supposed to become, why each part exists, how the parts connect, and the order in which they should be implemented. It is the project reference for future development. Existing working functionality must not be replaced with a parallel architecture without deliberately updating this document first.

---

# 1. Project Goal

C.T. Model School is being developed as **one integrated school website + management system**.

The public website, Admin system, Member system, Roles, Permissions, Inventory, Accounts, Academic modules, SR, Reports and future modules must ultimately work from one consistent architecture.

The central rule is:

```text
Authentication
      ↓
User / Member Identity
      ↓
Member Type
      ↓
Role
      ↓
Permissions
      ↓
Individual Dashboard
      ↓
Allowed Modules / Actions
```

A member does not receive access simply because they are a Teacher, Staff or Accounts user. **The assigned Role and its checked Permissions determine what that person can see and do.**

---

# 2. What Must NOT Change Accidentally

The management-system work must not break the existing public website.

## Locked website rules

- Existing working desktop sections remain unchanged unless explicitly requested.
- Mobile-only fixes must remain mobile-scoped.
- The existing theme system remains the source for primary/theme colors.
- New features must be theme-aware.
- Existing working database data must be preserved.
- Existing Community/People functionality must remain intact.
- Hero, Principal, About, Map/Official Links and other explicitly locked sections must not be touched unless the user asks for it.
- Screenshots are reference material only. They must never be treated as requests to generate/edit an image.
- Website work means code, database and deployment work.

---

# 3. The Core Identity Model

There are two different concepts that must not be confused.

## 3.1 Internal authentication identity

The authentication system needs a secure internal user identity, normally a UUID.

This is the identity used by authentication, sessions, ownership checks and database security.

## 3.2 Human-readable Member ID

Every member also has a readable Member ID, for example:

```text
TCID000001   Teacher
STID000001   Staff
ACID000001   Accounts
OTID000001   Other
```

The Member ID is what the member can type into the login form.

It is **not** the same thing as the internal authentication UUID.

## 3.3 Required relationship

The final relationship should be conceptually:

```text
Auth User
   │
   └── internal user ID
          │
          ▼
      Profile / Identity
          │
          ▼
      Member Record
          │
          ├── Member ID
          ├── Member Type
          └── Role
                 │
                 ▼
             Permissions
```

Creating a member must create/maintain this relationship consistently. Editing a member must update the existing identity rather than accidentally creating another login identity.

---

# 4. Member Types

The same authentication/profile/dashboard architecture applies to all four member categories:

1. **Teacher**
2. **Staff**
3. **Accounts**
4. **Other**

Member Type tells the system which broad category the person belongs to.

Member Type is **not** the permission system.

For example:

```text
Staff
 ├── Store Assistant Role
 ├── Store Officer Role
 └── Store Manager Role
```

All three are Staff, but their dashboards and actions can be completely different because their Roles have different permissions.

---

# 5. One Login Portal

There should be one central login page for the school management system.

The page will show five choices:

```text
┌────────────┐  ┌────────────┐
│   ADMIN    │  │  TEACHER   │
└────────────┘  └────────────┘

┌────────────┐  ┌────────────┐
│   STAFF    │  │  ACCOUNTS  │
└────────────┘  └────────────┘

┌─────────────────────────────┐
│       OTHER MEMBER          │
└─────────────────────────────┘
```

The user selects the appropriate login type first.

Then the relevant form appears:

```text
Member ID
Password

[ Login ]
[ Forgot Password ]
```

## Login type validation

A Teacher login must accept only a valid Teacher member.

A Staff login must accept only a valid Staff member.

An Accounts login must accept only an Accounts member.

An Other login must accept only an Other member.

Therefore:

```text
Teacher panel + ACID000001 = REJECT
Accounts panel + TCID000001 = REJECT
Staff panel + OTID000001 = REJECT
```

A correct password alone is not enough. The selected login category and the member's actual Member Type must agree.

Admin remains a separate administrative identity even though the login entry point is shared.

---

# 6. Existing Role Management Is the Main System

**Important: Role Management already exists in the Admin Panel. Do not build a second Role system.**

The existing Role Management becomes the single source of truth.

## Create Role

Admin opens:

```text
Admin → Role Management → Create Role
```

Then:

```text
Role Name
Description

Permissions
☐ Profile View
☐ Profile Edit
☐ Inventory View
☐ Item Search
☐ SR Create
☐ SR Approve
☐ Result Entry
☐ Attendance Entry
☐ Accounts View
☐ Reports
...

[ Save Role ]
```

Whatever Admin checks becomes part of that Role.

Whatever Admin leaves unchecked is not available to members assigned to that Role.

## Edit Role

Admin can later:

```text
Role Management
   ↓
Edit Role
   ↓
Check / Uncheck permissions
   ↓
Save
```

The assigned members automatically inherit the updated Role permissions.

No manual permission editing should be necessary on every member unless a future individual-override feature is deliberately introduced.

---

# 7. Permission System: The Central Brain

Permissions are the actual controls used to build dashboards and authorize actions.

Permissions should be granular.

For example, these are intentionally different:

```text
View
Create
Edit
Delete
Approve
Reject
Publish
Process
Issue
Report
```

This allows one person to see something without allowing them to modify or approve it.

## Current/core permission categories

### A. Profile & Account

- Dashboard
- Profile View
- Profile Edit
- Change Password
- Notifications
- Documents

### B. Students & Admission

- Students View
- Students Add
- Students Edit
- Students Delete
- Student Admission
- Student Profile Management
- Classes
- Sections
- Subjects
- Academic Sessions

### C. Attendance

- Attendance View
- Attendance Entry
- Attendance Edit
- Attendance Approval, if required
- Attendance Reports

### D. Results / Examination

- Results View
- Result Entry
- Result Edit
- Result Approval
- Result Publish
- Examination Management
- Result Reports

### E. Teachers / Staff / Members

- Teacher View
- Teacher Add
- Teacher Edit
- Teacher Delete
- Staff View
- Staff Add
- Staff Edit
- Staff Delete
- Member View
- Member Add
- Member Edit
- Member Delete
- Member Profile Management

### F. Inventory / Store

- Inventory View
- Item Search
- Item Add
- Item Edit
- Item Delete
- Stock Receive
- Stock Issue
- Stock Adjustment
- Stock Transfer
- Stock Report
- Supplier View
- Supplier Add/Edit

### G. Store Requisition / SR

SR is **not a separate login system**. It is a normal permission-controlled module.

Permissions can include:

- SR Create
- SR View Own
- SR View All
- SR Edit
- SR Approve
- SR Reject
- SR Cancel
- SR Process
- SR Issue
- SR Report

### H. Accounts / Finance

- Accounts View
- Payment Entry
- Payment Edit
- Payment Approval
- Invoice
- Fees Collection
- Expense Entry
- Expense Approval
- Financial Reports
- Accounts Reports

### I. Website / Communication

- Notice View
- Notice Create
- Notice Edit
- Notice Delete
- Notice Publish
- Events
- Gallery
- Website Content
- Community Profiles
- Contact Messages

### J. Administration

- User Management
- Role Management
- Permission Management
- System Settings
- Audit Logs
- Reports
- Backup/Restore when implemented

---

# 8. Future Permission Rule

The permission list is **not permanently closed**.

When a future feature is added, it must add its own permissions to the same central permission catalog.

Example:

If Library is added later:

```text
Library View
Book Add
Book Edit
Book Delete
Book Issue
Book Return
Library Report
```

Those permissions must then automatically become available in Role Create/Edit.

If Transport is added:

```text
Transport View
Vehicle Management
Route Management
Driver Management
Transport Report
```

Again, Role Management receives those permissions without creating a second role system.

The rule is:

```text
New Module
   ↓
New Permission(s)
   ↓
Permission Catalog
   ↓
Role Create/Edit checkbox
   ↓
Role
   ↓
Member Dashboard
```

---

# 9. Member Creation

When Admin creates a Teacher, Staff, Accounts or Other member, the system should maintain one coherent identity flow.

Conceptually:

```text
Create Member
    ↓
Member Type
    ↓
Member ID
    ↓
Password / Authentication credential
    ↓
Profile
    ↓
Role
    ↓
Permissions inherited from Role
```

Example:

```text
Name: Tanzina Tarin
Member Type: Teacher
Member ID: TCID000003
Role: Teacher
Password: ********
```

The password must never be displayed later as plain text.

Editing a member must update the existing login/profile record instead of accidentally generating another login account.

---

# 10. Individual Member Dashboard

After successful login:

```text
Login
  ↓
Identify authenticated user
  ↓
Find Member
  ↓
Find Member Type
  ↓
Find Role
  ↓
Load Role Permissions
  ↓
Build Individual Dashboard
```

Every member gets their **own dashboard context**.

It must not be mixed with:

- another member's dashboard
- Admin Dashboard
- another role's dashboard

## Dynamic menu example

If a Role has:

```text
☑ Profile View
☑ Item Search
☑ Inventory View
☑ SR Create
☑ SR View Own
☐ SR Approve
☐ Accounts View
```

the dashboard can show:

```text
My Profile
Inventory
Item Search
Create SR
My SR
```

It must not show:

```text
Approve SR
Accounts
```

---

# 11. Dashboard Security

Menu hiding alone is NOT security.

A member who does not have permission must also be blocked from:

- direct URLs
- server actions
- RPC calls
- API requests
- database operations

The security chain must be:

```text
Authenticated Identity
       ↓
Member
       ↓
Role
       ↓
Permission
       ↓
Resource ownership/scope
       ↓
Allow / Deny
```

Supabase RLS and secure RPC/server-side checks must enforce the same rules.

Example:

A member with only `SR View Own` must not be able to change a URL and read somebody else's SR.

A member without `SR Approve` must not be able to call an approval RPC directly.

---

# 12. Personal Profile

Every logged-in member gets a **My Profile** page.

It can show:

- Profile picture
- Member ID
- Name
- Designation
- Department
- Phone
- Email
- WhatsApp
- Joining date
- Address
- Role

Members can update allowed personal information according to their Role.

Members can change their own password from Profile.

Sensitive authentication data must never be displayed.

---

# 13. Forgot Password

Forgot Password will be available from the unified login page.

Preferred flow:

```text
Forgot Password
      ↓
Member ID
      ↓
Registered Email / Phone verification
      ↓
OTP or secure reset link
      ↓
New Password
      ↓
Login
```

The system must never reveal the existing password.

If SMS OTP is added later, it becomes an authentication service under the same architecture, not a new login system.

---

# 14. SR: How It Fits Into the Full System

SR is one example of how permissions control a module.

**Do not build SR as an isolated system.**

If a Role has `SR Create`, the dashboard shows Create SR.

If it does not, the option is absent and the backend also rejects SR creation.

## SR Create flow

```text
Member Dashboard
      ↓
Create SR
      ↓
Member details auto-loaded from Profile
      ↓
Search Item Code
      ↓
Select Item
      ↓
Enter Quantity
      ↓
Add more items if required
      ↓
Add purpose/remarks/other information
      ↓
Submit SR
```

## Auto-filled requester information

The member should not manually type their own identity.

The system fills:

- Member ID
- Name
- Designation
- Department
- Contact information where required

This information comes from the authenticated profile/member record.

## Item selection

Search by Item Code.

Example:

```text
Item Code: EL-000125
       ↓
Item Name
Brand
Model
Unit
Availability
       ↓
Quantity: 5
       ↓
Add Item
```

One SR can contain multiple items.

## SR information

Typical fields:

- Auto-generated SR number
- Date
- Requester
- Department
- Purpose
- Required date
- Remarks
- Attachments where implemented

## SR workflow

Example:

```text
Draft
  ↓
Submitted / Pending
  ↓
Approved
  ↓
Processed / Issued
```

or:

```text
Submitted
  ↓
Rejected
```

Each transition must be permission controlled.

---

# 15. SR Permission Examples

### Store Assistant Role

```text
☑ Inventory View
☑ Item Search
☑ SR Create
☑ SR View Own
☐ SR View All
☐ SR Approve
☐ SR Reject
☐ SR Issue
```

### Store Officer Role

```text
☑ Inventory View
☑ Item Search
☑ SR Create
☑ SR View Own
☑ SR View All
☑ SR Process
☑ SR Issue
☐ SR Approve
```

### Store Manager Role

```text
☑ Inventory View
☑ Item Search
☑ SR Create
☑ SR View Own
☑ SR View All
☑ SR Approve
☑ SR Reject
☑ SR Process
☑ SR Issue
☑ SR Report
```

This is why SR must remain part of the Role/Permission architecture.

---

# 16. Other Modules Follow Exactly the Same Logic

The same approach applies to every future or existing module.

## Result

If Role has:

```text
☑ Results View
☑ Result Entry
☐ Result Publish
```

the user can enter results but cannot publish them.

## Attendance

If Role has:

```text
☑ Attendance View
☑ Attendance Entry
☐ Attendance Edit
```

the user can enter attendance but cannot modify existing attendance.

## Accounts

If Role has:

```text
☑ Accounts View
☑ Payment Entry
☐ Payment Approval
```

the user can enter payments but cannot approve them.

## Inventory

If Role has:

```text
☑ Inventory View
☑ Item Search
☐ Item Edit
☐ Stock Issue
```

the user can view/search but cannot modify or issue stock.

This is the main logic for the entire project.

---

# 17. Admin Dashboard

Admin has its own separate dashboard and management environment.

Depending on Admin permissions, it may contain:

- Dashboard
- Members
- Students
- Teachers
- Staff
- Accounts
- Inventory
- Roles
- Permissions
- Results
- Attendance
- Notices
- SR Management
- Reports
- Settings
- Website management

Admin Dashboard must never be rendered as a normal Member Dashboard.

---

# 18. Future Modules

The architecture must be ready for future modules such as:

- Library
- Transport
- Payroll
- Fees
- HR
- Examination management
- Student portal
- Parent portal
- Hostel
- Leave management
- Timetable
- Certificates
- Asset management
- Procurement
- Audit and advanced reporting

For every future module:

```text
Module
 ↓
Permissions
 ↓
Role checkbox
 ↓
Role assignment
 ↓
Member Dashboard
 ↓
Backend/RLS authorization
```

No future module should invent a separate login or permission architecture.

---

# 19. Database / Security Direction

The final system must preserve production data while improving the identity relationships.

Important rules:

- Do not duplicate authentication identities unnecessarily.
- Do not expose password hashes.
- Keep Member IDs stable.
- Keep internal authentication IDs private/internal.
- Use secure RPC/server functions for sensitive operations.
- Use RLS for data isolation.
- Use storage policies for profile/document uploads.
- Record audit information for sensitive operations where appropriate.

Sensitive operations that should eventually have audit records include:

- Role changes
- Permission changes
- Member account changes
- Password/reset events where appropriate
- SR approval/rejection
- Stock issue
- Result publishing
- Financial approvals

---

# 20. Implementation Phases

## Phase 1 — Audit Existing System

Before changing authentication:

- Inspect existing Auth users.
- Inspect profiles.
- Inspect member tables.
- Inspect existing Role Management.
- Inspect current permissions.
- Inspect role-permission relationships.
- Inspect existing Inventory/SR structures.
- Identify duplicate or legacy login paths.
- Map current members to the final identity architecture.

**Goal:** understand the existing root before modifying it.

## Phase 2 — Authentication Foundation

- Create unified login entry.
- Add five login choices.
- Validate Member ID against Member Type.
- Connect member login to the existing authentication identity.
- Preserve Admin authentication.
- Ensure login sessions are isolated.
- Implement logout.

## Phase 3 — Password Management

- Forgot Password.
- Secure reset flow.
- Logged-in Change Password.
- Ensure no plain password exposure.

## Phase 4 — Role/Permission Integration

- Reuse existing Role Management.
- Audit and expand permission catalog.
- Categorize permissions.
- Make permission checkboxes dynamic.
- Ensure Role Edit changes access immediately.
- Ensure future modules can register permissions.

## Phase 5 — Individual Member Dashboard

- Create separate Member Dashboard shell.
- Load user identity.
- Load Member Type.
- Load Role.
- Load effective Permissions.
- Generate menu dynamically.
- Add My Profile.
- Add password management.
- Add route guards.

## Phase 6 — Existing Module Integration

Connect existing functionality to the permission engine:

- Students
- Teachers
- Staff
- Attendance
- Results
- Accounts
- Inventory
- Notices
- Community/People
- Reports
- Other existing management functions

## Phase 7 — SR Integration

- Connect SR to authenticated member identity.
- Auto-fill requester profile.
- Item Code search.
- Item selection.
- Quantity entry.
- Multiple items.
- SR number generation.
- Submission.
- Approval/rejection.
- Processing/issue.
- Own/all visibility.
- Reports.
- Audit trail.

## Phase 8 — Full Security Audit

Test every permission from both UI and backend.

Test:

- Wrong member type login.
- Wrong password.
- Disabled member.
- Unauthorized URL.
- Unauthorized RPC/API call.
- Cross-member profile access.
- Cross-member SR access.
- Unauthorized approval.
- Unauthorized inventory issue.
- Unauthorized result publish.
- Admin/member dashboard separation.

## Phase 9 — Production QA

- TypeScript check.
- Production build.
- Supabase migration verification.
- RLS verification.
- Storage policy verification.
- Login smoke test.
- Member dashboard smoke test.
- Admin dashboard smoke test.
- Mobile responsive test.
- Desktop regression test.
- Vercel deployment verification.

---

# 21. Definition of Done

The architecture is considered complete when:

- Admin, Teacher, Staff, Accounts and Other can use the unified login portal.
- Member ID + Password authentication works.
- Login category mismatch is rejected.
- Authentication identity and member profile are correctly linked.
- Existing Role Management remains the single source of truth.
- Role Create/Edit checkboxes control permissions.
- Members automatically inherit Role changes.
- New future permissions can be added without redesigning dashboards.
- Every member has an isolated dashboard.
- Dashboard menus reflect Role permissions.
- Direct unauthorized routes are blocked.
- Backend/RLS prevents unauthorized operations.
- Members can view their own profile.
- Members can change their own password.
- Forgot Password works securely.
- SR appears only when the Role has the required SR permission.
- SR automatically identifies the logged-in requester.
- SR item search and quantity workflow works.
- SR approval/rejection/process/issue follow permissions.
- Inventory, Accounts, Results, Attendance and future modules use the same permission architecture.
- Admin Dashboard remains separate from all Member Dashboards.
- Existing public website remains intact.
- Build/type checks pass.
- Production deployment is verified.

---

# 22. Change-Control Rule

This document is the **final architectural reference**.

Before making a major change to authentication, member identity, roles, permissions or dashboards:

1. Read this document.
2. Inspect the existing implementation.
3. Determine whether the requested feature fits the existing architecture.
4. Extend the architecture instead of creating a parallel system.
5. If the root architecture genuinely needs to change, update this roadmap deliberately first.

Do not silently replace the authentication, role or permission root.

---

# 23. Working Rule for Future Development

When the user says a new feature should be available to some members, the first question is:

> **Which Role Permission controls this feature?**

Then implement:

```text
Feature
 ↓
Permission
 ↓
Role checkbox
 ↓
Member Role
 ↓
Dashboard visibility
 ↓
Route authorization
 ↓
Database/RLS authorization
```

That is the permanent logic for the C.T. Model School management system.
