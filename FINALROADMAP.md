# C.T. Model School Management System
## Final Architecture & Implementation Roadmap

> **LOCKED ROADMAP:** This document is the project-level reference for authentication, members, roles, permissions, dashboards and future management modules. New work must extend this architecture rather than create parallel systems.

## 1. Core Principles

- Preserve all existing working website, Admin, database and management functionality unless a specific change is requested.
- Desktop remains untouched during mobile-specific work unless explicitly requested.
- Every new UI feature must be responsive and theme-aware.
- Existing theme variables/tokens must be used. Do not introduce hardcoded primary/gold/theme colors.
- Use the existing Role Management and Permission system as the single source of truth.
- Do not create a second/duplicate role or permission system.
- Backend/RLS/API authorization must enforce permissions. Hiding a menu is not sufficient.
- Each member has an isolated dashboard. Member dashboards must never mix with Admin Dashboard or another member's dashboard.
- Future modules must register their permissions in the same central permission system.

## 2. Unified Login Portal

Create one public login entry point for all authenticated users.

Login options:

1. Admin
2. Teacher
3. Staff
4. Accounts
5. Other Member

Category login selection is part of the login flow. A Teacher login panel must accept only a valid Teacher member account; a Staff/Accounts/Other panel must reject IDs belonging to another member type.

Member login uses **Member ID + Password**. Member ID is the human-readable login ID such as `TCID...`, `STID...`, `ACID...`, or `OTID...`. The internal authentication identity must remain separate from the readable Member ID.

Admin login remains an administrative identity and must not be mixed with ordinary member dashboards.

## 3. Authentication Identity & Member Profile

A member's authentication identity, profile and member record must be linked consistently.

Conceptually:

`Authentication User → Profile/Identity → Member Record → Member Type → Role → Permissions`

Requirements:

- New member creation must create/maintain the authentication/login identity and member record as one coherent workflow.
- Editing a member must update the correct member identity without creating duplicate users.
- Member ID is the login/display identifier, not the security identity.
- Password is stored securely as a password hash/auth credential and must never be exposed in profile views.
- Password changes must update the authenticated credential only.
- Existing member records must be migrated/linked safely where required.
- Do not break existing Admin authentication.

## 4. Member Types

The same member architecture applies to all four member types:

- Teacher
- Staff
- Accounts
- Other

The member type identifies the broad category. The **Role** determines the actual access.

A member type must not be used as a substitute for permissions.

## 5. Existing Role Management Is the Authority

The Admin Panel already has Role Management. Keep and extend that system.

When creating a Role:

- Admin enters Role Name/description.
- Available permissions appear as checkboxes.
- Checked permissions belong to that Role.
- Unchecked permissions do not belong to that Role.
- Saving the Role applies the selected permission set.

When editing a Role:

- Existing permissions are loaded.
- Admin can check/uncheck permissions.
- Saving changes the Role's permission set.
- Members assigned to that Role receive the updated access automatically.

Do not create a separate role editor for members.

## 6. Central Permission Model

Permissions must be granular enough to support real school workflows. `View`, `Create`, `Edit`, `Delete`, `Approve`, `Reject`, `Publish`, `Process`, etc. should be separate where appropriate.

### Profile & Account

- Dashboard
- Profile View
- Profile Edit
- Change Password
- Notifications
- Documents

### Students & Academic

- Students View
- Students Add
- Students Edit
- Students Delete
- Student Admission
- Classes
- Subjects
- Sections
- Academic Sessions
- Attendance View
- Attendance Entry
- Attendance Edit
- Results View
- Result Entry
- Result Edit
- Result Publish
- Academic Reports

### Teachers / Staff / Members

- Teacher View
- Teacher Add
- Teacher Edit
- Staff View
- Staff Add
- Staff Edit
- Member View
- Member Add
- Member Edit
- Member Delete
- Member Profile Management

### Inventory / Store

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

### Store Requisition (SR)

SR is a permission-controlled module, not a separate authentication system.

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

### Accounts & Finance

- Accounts View
- Payment Entry
- Payment Edit
- Payment Approval
- Invoice
- Fees Collection
- Expense Entry
- Expense Approval
- Accounts Report
- Financial Report

### Website / Communication

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

### Administration

- User Management
- Role Management
- Permission Management
- System Settings
- Audit Logs
- Reports
- Backup/Restore where implemented

### Future Growth Rule

When a new module/feature is added, its required permissions must be added to the same central permission catalog. Role Create/Edit must automatically expose the new permission as a selectable checkbox. Do not hardcode a closed permission list into individual dashboards.

## 7. Individual Member Dashboard

After login:

`Login → Identify User → Member Type → Role → Permissions → Individual Dashboard`

The dashboard menu is generated from the logged-in user's effective permissions.

Examples:

- If `SR Create` is checked for the user's Role, the member sees Create SR.
- If `SR Approve` is not checked, Approve SR must not be available.
- If `Result Entry` is checked, Result Entry appears.
- If `Accounts` is not checked, Accounts does not appear.

The same permission checks must be enforced server-side.

A member must only access their own profile and data unless the Role grants broader access such as View All, Approve, Manage, or Report permissions.

## 8. Profile

Every logged-in member gets a personal Profile area.

Profile should show permitted personal information such as:

- Profile photo
- Member ID
- Name
- Designation
- Department
- Phone
- Email
- WhatsApp
- Joining Date
- Address
- Role

Members can change their password while logged in.

Members must not see another member's private profile information unless their Role explicitly grants the required management permission.

## 9. Forgot Password

Provide Forgot Password in the unified login system.

Preferred recovery flow:

`Member ID → Registered email/phone verification → OTP or secure reset link → New Password`

Do not expose password hashes or existing passwords.

If SMS OTP is added later, integrate it without changing the core Role/Permission architecture.

## 10. Store SR Workflow

SR is one module controlled by Role permissions.

If a Role has `SR Create`, that member sees the SR option.

When creating an SR, member details are automatically loaded from the logged-in profile/member record:

- Member ID
- Name
- Designation
- Department
- Contact information where required

The member must not manually alter the identity of the requester.

### Item Selection

- Search by Item Code.
- Select the matching item.
- Show item information.
- Enter requested quantity.
- Add multiple items to one SR.
- Add required item notes/remarks.
- Validate available/requestable quantity according to the final inventory rules.

### SR Information

- Auto-generated SR number
- Request date
- Requesting member
- Department/class where applicable
- Purpose/request details
- Required date where applicable
- Remarks
- Attachments where implemented

### SR Status

Example lifecycle:

`Draft → Submitted/Pending → Approved → Issued/Processed`

or

`Submitted → Rejected`

The exact transitions must be permission controlled.

### SR visibility

- `SR View Own` → member sees only their own SRs.
- `SR View All` → authorized role can see all relevant SRs.
- `SR Approve` → authorized role can approve.
- `SR Reject` → authorized role can reject.
- `SR Process` / `SR Issue` → authorized store role can process/issue.
- `SR Report` → authorized role can access SR reporting.

Existing SR database structures should be reused and connected to the authenticated member identity rather than creating a duplicate SR system.

## 11. Dashboard Isolation & Security

Every route and server operation must verify:

`Authenticated Identity → Member/Role → Permission → Resource Ownership/Scope`

Examples:

- A Teacher cannot open the Admin Dashboard by typing its URL.
- A Staff member cannot open Accounts management without the required permission.
- A member with only `SR View Own` cannot access another member's SR by changing an ID in the URL.
- A member without `SR Approve` cannot call an approval operation directly.
- Frontend hiding is not security. Supabase RLS/RPC/server authorization must enforce the same rules.

## 12. Admin Dashboard

Admin remains separate from ordinary member dashboards.

Admin can manage:

- Members
- Roles
- Permissions
- Students
- Teachers
- Staff
- Accounts
- Inventory
- SR workflows
- Results
- Attendance
- Notices
- Reports
- Settings
- Other modules according to Admin permissions

Admin permissions must also be enforced server-side.

## 13. Future Module Expansion

Future modules may include, but are not limited to:

- Library
- Transport
- Payroll
- Fees
- HR
- Examination management
- Parent portal
- Student portal
- Hostel
- Leave management
- Timetable
- Certificates
- Asset management
- Procurement
- Audit/reporting

Every new module follows the same pattern:

`Module → Permission(s) → Role checkbox → Member Role → Dashboard → Server/RLS enforcement`

No module may create its own independent login/role/permission mechanism.

## 14. Data & Security Rules

- Preserve existing production data.
- Do not duplicate member identities unnecessarily.
- Do not create a second password system when the authentication layer can handle credentials securely.
- Keep Member ID human-readable and stable.
- Keep internal authentication IDs private/internal.
- Password hashes must never be displayed to Admin or members.
- Use RLS and secure RPC/server operations for authorization.
- Audit sensitive actions such as role changes, approvals, stock issues, result publishing and account approvals where applicable.

## 15. Existing Website Rules Remain Locked

- Do not change working desktop sections unless explicitly requested.
- Mobile-only fixes stay within mobile breakpoints.
- Hero section is locked unless explicitly requested.
- Principal, About, Map/Official Links and other locked sections must not be changed accidentally.
- Existing Community/People functionality must remain intact.
- Existing theme system must be followed.
- Do not generate or edit images when working on website code.

## 16. Implementation Order

### Phase A: Audit & Foundation

1. Audit existing authentication, profiles, member tables and Role Management.
2. Audit current permission catalog and role-permission relationships.
3. Map all existing member types to the current Role system.
4. Map existing Admin authentication separately.
5. Confirm existing SR and Inventory tables/RPCs.
6. Identify any duplicate/legacy authentication flows.

### Phase B: Unified Authentication

1. Build unified login entry point.
2. Add Admin/Teacher/Staff/Accounts/Other login selection.
3. Validate Member ID against the selected member type.
4. Implement secure member session handling.
5. Add Forgot Password.
6. Add logged-in Change Password.
7. Preserve Admin login compatibility.

### Phase C: Role & Permission Integration

1. Reuse existing Role Management.
2. Expand central permission catalog.
3. Categorize permissions in Role Create/Edit UI.
4. Ensure future permissions appear automatically.
5. Ensure role edits immediately affect effective access.
6. Enforce permissions server-side/RLS.

### Phase D: Individual Dashboards

1. Create separate Member Dashboard shell.
2. Build dynamic navigation from permissions.
3. Add Profile.
4. Add member-specific data access.
5. Add permission/ownership guards to every route.
6. Keep Admin Dashboard completely separate.

### Phase E: Existing Modules Integration

Connect existing modules to the permission system:

- Academic
- Attendance
- Results
- Inventory
- Accounts
- Notices
- Community/People
- Reports
- Other existing modules

### Phase F: SR Integration

1. Connect SR to logged-in member identity.
2. Auto-fill requester details from profile/member record.
3. Item Code search.
4. Multi-item SR creation.
5. Quantity and validation.
6. SR status workflow.
7. Own/all/approve/reject/process/issue permissions.
8. SR reporting.
9. Audit trail.

### Phase G: Security & QA

1. Test every Role permission.
2. Test unauthorized direct URLs.
3. Test direct RPC/API calls without permission.
4. Test cross-member data access.
5. Test password reset/change.
6. Test member-type login restrictions.
7. Test Admin/member isolation.
8. Test RLS and storage policies.
9. Run TypeScript/build checks.
10. Test production deployment.

## 17. Definition of Done

The architecture is considered complete only when:

- All five login categories work through the unified portal.
- Member ID + password authentication works correctly.
- Member type mismatch is rejected.
- Role Management remains the single source of truth.
- Role Create/Edit permission checkboxes work.
- New permissions can be added without redesigning dashboards.
- Every member gets an isolated dashboard.
- Dashboard menus reflect effective permissions.
- Backend/RLS prevents unauthorized actions.
- Profile and password management work.
- Forgot Password works securely.
- SR is available only through the relevant Role permission.
- SR automatically identifies the logged-in member.
- Existing Inventory/Accounts/Results/Attendance and future modules use the same permission architecture.
- Admin and Member dashboards remain completely separate.
- Existing public website and locked UI sections remain intact.
- Build/type checks pass.
- Production deployment is verified.

## 18. Change Control

This file is the locked architectural roadmap. Before implementing a major new management feature, check this document first.

If a future requirement conflicts with this architecture, update this roadmap deliberately before changing the underlying authentication/role/permission root.

Do not silently replace the core authentication, role or permission architecture.
