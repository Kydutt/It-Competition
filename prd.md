# Product Requirements Document (PRD)
# IT Competition Management Platform

| Metadata | Value |
|---|---|
| Product | IT Competition Management Platform |
| Version | 1.0.0 |
| Status | Approved baseline for implementation planning |
| Product language | Bahasa Indonesia |
| Backend | Laravel (PHP) |
| Frontend | React + TypeScript + Tailwind CSS |
| Database | MySQL |
| API | REST JSON |
| Authentication | Laravel Sanctum (SPA cookie/session) |
| Primary roles | Participant, Admin |

> **Purpose:** This document is the product source of truth. Agents must not invent product behavior that is not specified here. If a requirement is ambiguous, record the ambiguity in `OPEN_QUESTIONS.md` and do not silently make irreversible decisions.

---

## 1. Product summary

IT Competition Management Platform is a responsive web application for publishing IT competitions and managing the participant lifecycle: account registration, team creation, competition registration, document submission, verification, work submission, announcements, and administrative reporting.

The application has three interface areas:

1. **Public website**: accessible without authentication.
2. **Participant portal**: authenticated participant workflows.
3. **Admin portal**: authenticated administration workflows.

### 1.1 Product goals

- Centralize competition information and registration.
- Reduce manual administration and fragmented communication.
- Give participants clear visibility into registration and submission status.
- Give admins reliable tools to manage competitions, participants, teams, and submissions.
- Preserve an auditable history of important administrative actions.
- Provide a maintainable codebase with clear separation between frontend, backend, and database.

### 1.2 Non-goals for MVP

Do not implement these unless explicitly approved:
- Separate judge role or judge scoring portal.
- Payment gateway integration.
- AI judging or AI scoring.
- Live chat or video conferencing.
- Native Android/iOS applications.
- Multi-tenant SaaS subscriptions.
- Automated certificate generation.
- Public participant ranking/leaderboard.
- Complex accounting or financial reconciliation.

---

## 2. Product assumptions and decisions

These assumptions define the initial implementation baseline. They are not permission to add unrelated features.

| Topic | Baseline decision |
|---|---|
| Event model | The system may manage one or more events. |
| Competition model | Each event may contain multiple competitions. |
| Registration mode | Each competition is configured as `individual` or `team`. |
| Team size | Minimum and maximum members are configured per competition. |
| Payments | Optional module; disabled by default until payment policy is confirmed. |
| Verification | Admin manually reviews submitted registrations and documents. |
| Judging | Out of MVP; submissions can be reviewed for administrative status only. |
| Language | UI copy is Bahasa Indonesia. |
| Timezone | Store timestamps consistently; display event dates in `Asia/Jakarta`. |
| Public statistics | Must be database-derived and must not expose personal data. |

If any assumption conflicts with a later explicit product-owner decision, update this PRD and related documents before implementation.

---

## 3. Users and permissions

### 3.1 Participant

A participant can:
- Register an account and authenticate.
- View public events and competitions.
- Manage their own profile.
- Create and manage teams where allowed.
- Register for eligible competitions.
- Upload required registration documents.
- View their own registration status and admin notes.
- Submit work when the competition requires it.
- View relevant announcements and notifications.

A participant must never access another participant's private profile, documents, registration, payment proof, or submission unless they are explicitly authorized as a member of the same registration and the data is intended to be shared with team members.

### 3.2 Admin

An admin can:
- Access the admin dashboard.
- Manage events, competitions, and categories.
- View and manage participant and team records.
- Review registrations and documents.
- Approve, reject, or request revisions with a reason.
- Review submissions and update administrative status.
- Manage schedules, announcements, FAQs, and website settings.
- View reports and activity logs.
- Manage payment verification only when the payment module is enabled.

Admin access must be enforced by Laravel middleware/policies, not merely by hiding frontend navigation.

### 3.3 Role assignment

- Public registration always creates a `participant`.
- A client request must never be able to assign itself the `admin` role.
- Admin provisioning must be performed through a controlled seeder, command, or authorized admin-management process.
- Role values must be validated against a server-side allowlist.

---

## 4. Technology requirements

### 4.1 Required stack

| Layer | Technology | Responsibility |
|---|---|---|
| Backend | Laravel / PHP | Business logic, API, auth, validation, authorization |
| Frontend | React + TypeScript | UI and client interactions |
| Styling | Tailwind CSS | Design system and responsive styling |
| Database | MySQL | Persistent relational data |
| API | REST / JSON | Frontend-backend communication |
| Authentication | Laravel Sanctum | SPA session authentication |
| Routing | React Router | Frontend navigation |
| HTTP | Axios | API requests and CSRF/session setup |
| Forms | React Hook Form + Zod | Client-side form state and validation |
| Icons | Lucide React | Consistent iconography |
| Backend tests | Pest or PHPUnit | Feature and unit tests |
| Frontend tests | Vitest + React Testing Library | Component and interaction tests |

Use compatible stable versions based on the installed PHP, Node.js, Laravel, and package-manager environment. Do not upgrade major versions or replace dependencies without documenting the reason and obtaining approval.

### 4.2 Architecture

Use a separate React SPA and Laravel API.

```text
Browser
  |
  v
React + TypeScript + Tailwind
  |
  | HTTPS / JSON / Sanctum session
  v
Laravel REST API
  |
  +-- Controllers
  +-- Form Requests
  +-- Policies / Middleware
  +-- Services
  +-- API Resources
  +-- Eloquent Models
  |
  v
MySQL

Laravel private storage:
  +-- Participant documents
  +-- Payment proofs (optional)
  +-- Private submissions
```

Rules:
- React must not connect directly to MySQL.
- Do not use Blade to implement the primary application UI.
- Keep business rules in Laravel.
- Frontend validation improves usability but never replaces backend validation.
- Use API Resources to control response shape.
- Use Policies for resource ownership and access checks.
- Use database transactions for multi-record workflows.

---

## 5. Design system and UI/UX

### 5.1 Visual direction

Design direction: **Modern Technology Competition Platform**.

Qualities:
- Clean, professional, energetic, readable.
- Technology-oriented without excessive sci-fi decoration.
- Clear hierarchy and strong calls to action.
- Consistent public, participant, and admin experience.
- Mobile-first responsive layouts.

Use the reference website `https://itfest.idn.sch.id/` as inspiration for information architecture and event presentation only. Do not copy its source code, logos, illustrations, text, or distinctive assets.

### 5.2 Color tokens

| Token | Hex | Usage |
|---|---|---|
| `brand-orange` | `#F47B20` | Primary CTA, highlight, active accent |
| `brand-orange-dark` | `#D96512` | Hover/active orange |
| `brand-orange-light` | `#FFF1E6` | Soft accent background |
| `brand-blue` | `#1769AA` | Secondary action, links, navigation accent |
| `brand-blue-dark` | `#104C80` | Dark blue surfaces |
| `brand-blue-light` | `#EAF4FC` | Soft blue background |
| `background` | `#F8FAFC` | Main application background |
| `surface` | `#FFFFFF` | Cards and panels |
| `text-primary` | `#0F172A` | Main text |
| `text-secondary` | `#64748B` | Supporting text |
| `border` | `#E2E8F0` | Dividers and outlines |
| `success` | `#16A34A` | Successful states |
| `warning` | `#F59E0B` | Warning states |
| `danger` | `#DC2626` | Errors/destructive states |
| `info` | `#2563EB` | Informational states |

Orange is the main action accent; blue is the supporting brand color. Do not paint every component with both colors. Maintain accessible contrast.

### 5.3 Typography and layout

- Preferred font: Inter or Plus Jakarta Sans.
- Use a consistent type scale and spacing scale.
- Headings use semibold/bold; body copy uses regular weight.
- Avoid excessive font families, gradients, shadows, and animations.
- Use clear labels and helper text on forms.
- All interactive controls need hover, focus, disabled, loading, and error states where relevant.

### 5.4 Reusable UI components

Create reusable components where repetition exists:
- Button, Input, Textarea, Select, Checkbox, Radio.
- Modal and confirmation dialog.
- Badge and status badge.
- Card, DataTable, Pagination, Tabs.
- Dropdown, Breadcrumb, Toast.
- Loading skeleton, EmptyState, ErrorState.
- FileUpload, SearchInput, FilterBar.
- Public Navbar and Footer.
- Participant Sidebar and Admin Sidebar.

Do not create abstractions for one-off elements without a clear reuse or complexity benefit.

### 5.5 Responsive behavior

- Mobile-first implementation.
- Desktop navigation collapses to mobile navigation.
- Dashboard sidebar becomes a drawer on small screens.
- Tables use responsive columns, horizontal scroll, or a suitable card alternative.
- Forms remain usable on narrow screens.
- Modals must fit within the viewport.
- Test common mobile, tablet, and desktop widths.

---

## 6. Public website requirements

All public pages are accessible without login.

### 6.1 Homepage — `/`

Sections:
1. Navigation: logo, Beranda, Kompetisi, Jadwal, Pengumuman, FAQ, Login, Daftar.
2. Hero: headline, supporting text, event identity, CTA `Daftar Sekarang`, CTA `Jelajahi Kompetisi`.
3. About: event description, theme, objectives.
4. Competition categories: cards populated from published competitions.
5. Timeline: published event schedules.
6. Statistics: database-derived aggregate counts only.
7. Latest announcements.
8. FAQ accordion.
9. Registration CTA.
10. Footer: organizer details, contact, social links, legal links.

### 6.2 Competition listing — `/competitions`

Requirements:
- List published competitions.
- Search by name.
- Filter by category and registration status.
- Pagination.
- Cards show name, category, short description, registration type, team-size rule where relevant, fee, deadline, and status.
- Do not expose unpublished competitions.

### 6.3 Competition detail — `/competitions/:slug`

Show:
- Name, cover, category, description.
- Eligibility and requirements.
- Registration type and team-size rules.
- Fee, if applicable.
- Registration start and deadline.
- Submission deadline, if applicable.
- Schedule, guidebook, and contact.
- Registration CTA.

Rules:
- Closed or unpublished competitions cannot accept new registrations.
- If not authenticated, CTA directs to login and preserves intended destination safely.
- If authenticated, backend validates eligibility before creating a registration.
- UI status is derived from persisted competition configuration and dates, not arbitrary frontend calculations alone.

### 6.4 Schedule — `/schedule`

Show published schedule entries with title, description, start/end time, location, and optional meeting URL.

### 6.5 Announcements — `/announcements`, `/announcements/:slug`

Show published announcements only. Support public or participant-targeted audiences as defined by API authorization.

### 6.6 FAQ — `/faq`

Show published FAQs grouped by category with search or accordion behavior.

### 6.7 Legal pages

Provide `/terms` and `/privacy` pages. Initial content may be clearly marked as draft until approved by the organizer. Do not invent legal claims or privacy promises.

---

## 7. Authentication requirements

Routes:
- `/register`
- `/login`
- `/forgot-password`
- Password reset route as required by Laravel flow.

Registration fields:
- Full name.
- Email.
- Password.
- Password confirmation.
- Terms acceptance.

Rules:
- Email must be unique and normalized.
- Password must meet server-side password policy.
- Password must be hashed using Laravel's supported hashing.
- Public registration always creates participant role.
- Rate-limit login and password reset endpoints.
- Return generic login errors that do not reveal whether an email exists.
- Use Sanctum SPA cookie/session authentication with CSRF protection.
- Do not store session credentials or sensitive tokens in localStorage.
- Logout invalidates the authenticated session.
- Email verification may be enabled by configuration; if enabled, protected workflows must enforce it.

---

## 8. Participant portal

Base path: `/participant`.

### 8.1 Dashboard — `/participant/dashboard`

Show:
- Welcome message.
- Profile completion indicator if implemented.
- Registration count and status summary.
- Submission status summary.
- Upcoming relevant deadlines.
- Latest relevant announcements.
- Recent activity.
- Quick actions.

### 8.2 Profile — `/participant/profile`

Fields:
- Full name.
- Email (read-only or controlled change flow).
- Phone.
- Institution/school.
- Education level.
- Identity number only if required by event policy.
- Address only if required.
- Profile photo.

Rules:
- A participant can update only their own profile.
- Sensitive fields must not be exposed publicly.
- Validate image type and size.
- Log sensitive administrative changes.

### 8.3 Team management — `/participant/teams`

Capabilities:
- Create team.
- View own teams.
- Edit team when allowed.
- Invite/add members using an approved account-based invitation mechanism.
- Remove members when allowed.
- View team leader and members.

Rules:
- One team has exactly one leader.
- Team membership must reference an existing user.
- Duplicate membership is prohibited.
- Team size is validated against the target competition at registration time.
- A team cannot be freely modified after its registration is submitted; use an explicit revision/admin-approved workflow.
- Do not implement email invitations or invitation codes until the chosen invitation mechanism is specified.

### 8.4 Registrations — `/participant/registrations`

List the participant's own registrations with:
- Registration number.
- Competition.
- Team or individual participant.
- Created/submitted date.
- Registration status.
- Document status.
- Payment status only when payment module is enabled.

Registration detail — `/participant/registrations/:id`:
- Competition and registration details.
- Participant/team data.
- Required documents and verification states.
- Admin notes visible to the relevant registrant.
- Status history.
- Allowed actions.

### 8.5 Registration workflow

A registration uses a guided multi-step flow:

1. Select competition.
2. Confirm registration type.
3. Select/create eligible team or individual registration.
4. Complete participant/member details.
5. Upload required documents.
6. Review all information.
7. Submit registration.

Rules:
- Draft may be saved.
- Required fields and required documents must be complete before submission.
- Server rechecks competition availability, eligibility, team membership, capacity if configured, and duplicate rules at submission time.
- Generate a unique registration number on the server.
- Use a database transaction.
- Handle concurrent submissions safely.
- A submitted registration is not freely editable.
- The UI must clearly distinguish draft from submitted state.

### 8.6 Registration statuses

Canonical statuses:
- `draft`
- `submitted`
- `under_review`
- `revision_required`
- `approved`
- `rejected`
- `cancelled`

Allowed transitions must be implemented in a dedicated domain/service layer and documented. Do not allow arbitrary status updates from participant requests.

Suggested transition baseline:
- `draft` → `submitted`
- `submitted` → `under_review`
- `under_review` → `approved` / `rejected` / `revision_required`
- `revision_required` → `submitted` (resubmission)
- `draft` → `cancelled`
- Other cancellation paths require explicit policy.

Every admin decision must include actor, timestamp, and reason where relevant.

### 8.7 Submissions — `/participant/submissions`

Participants submit competition work where required.

Fields may include:
- Title.
- Description.
- File.
- External URL.
- Repository URL.
- Supporting document.

Rules:
- Only eligible registrations may submit.
- Enforce configured deadline on the server.
- Enforce allowed file MIME types and maximum size.
- Store private files outside public web root.
- Preserve revision history.
- Do not silently overwrite prior submission versions.
- A participant can access only submissions associated with their authorized registration.

Submission statuses:
- `not_submitted`
- `submitted`
- `under_review`
- `revision_required`
- `accepted`
- `rejected`

### 8.8 Notifications

Participant notifications include registration status changes, document revision requests, submission review updates, deadline reminders (if scheduled notification infrastructure is approved), and relevant announcements.

### 8.9 Participant announcements

Show announcements targeted to all participants or the participant's competition. Do not expose private/admin-only announcements.

---

## 9. Admin portal

Base path: `/admin`.

### 9.1 Dashboard — `/admin/dashboard`

Show database-derived metrics:
- Total registrations.
- Total participants.
- Total teams.
- Total published competitions.
- Registrations awaiting review.
- Submissions awaiting review.

Charts:
- Registration trend.
- Registrations by competition.
- Registration status distribution.
- Submission status distribution.

Also show recent administrative activity. Do not hardcode statistics.

### 9.2 Event management — `/admin/events`

CRUD events:
- Name, slug, description, theme.
- Start/end dates.
- Location.
- Status.
- Public-facing event configuration.

### 9.3 Competition management — `/admin/competitions`

CRUD fields:
- Event.
- Category.
- Name and unique slug.
- Short/full description.
- Cover image.
- Eligibility.
- Registration type (`individual` or `team`).
- Min/max members for team competitions.
- Fee.
- Registration start/deadline.
- Submission deadline.
- Status.
- Guidebook.
- Contact information.

Competition statuses:
- `draft`
- `published`
- `registration_open`
- `registration_closed`
- `ongoing`
- `completed`
- `archived`

Rules:
- Draft is not public.
- Publish and registration availability are distinct concepts.
- Server validates dates and status transitions.
- A competition with registrations or financial records must not be hard-deleted.
- Prefer archive/soft delete where records must be retained.

### 9.4 Category management — `/admin/categories`

CRUD categories such as Programming, Networking, UI/UX, Game Development, AI, IoT, and Cyber Security. Category names are examples, not mandatory seeded categories.

### 9.5 Participant management — `/admin/participants`

List, search, filter, paginate, view details, and deactivate accounts when authorized. Changes to participant data must be auditable.

### 9.6 Team management — `/admin/teams`

List and inspect teams, members, leader, related competition registration, and status. Do not allow arbitrary team mutation that bypasses registration rules.

### 9.7 Registration verification — `/admin/registrations`

Capabilities:
- Search registration number.
- Filter by competition, status, and date.
- View registration and documents.
- Approve.
- Reject with reason.
- Request revision with clear notes.

Every decision records:
- Admin ID.
- Previous status.
- New status.
- Reason/note.
- Timestamp.

### 9.8 Payment management — `/admin/payments` (optional)

Disabled by default unless organizer confirms payment policy.

If enabled:
- List payment records.
- Inspect proof securely.
- Verify or reject with reason.
- Track amount and method.
- Never mark paid solely because a proof file was uploaded.
- Payment gateway integration is out of MVP.

### 9.9 Submission review — `/admin/submissions`

View submissions, filter by competition/status, inspect files securely, request revisions, and update review status with notes. This is administrative review, not a full judging/scoring system.

### 9.10 Schedule management — `/admin/schedules`

CRUD schedule entries: title, description, start/end, location, optional meeting URL, publish state.

### 9.11 Announcement management — `/admin/announcements`

CRUD title, slug, content, thumbnail, audience, optional competition, publish time, and status.

Audience values:
- `public`
- `all_participants`
- `specific_competition`

### 9.12 FAQ management — `/admin/faqs`

CRUD question, answer, category, display order, and publication state.

### 9.13 Website settings — `/admin/settings`

Manage event branding and public content such as logo, hero headline, subtitle, description, contacts, social links, and footer details. Validate URLs and uploaded assets.

### 9.14 Reports — `/admin/reports`

Provide filtered reports for participants, registrations, competitions, submissions, and payments if enabled. Export CSV first. Excel/PDF may be added only when required. Exports must respect authorization and filters.

### 9.15 Activity logs — `/admin/activity-logs`

Record security- and business-relevant actions: admin login, competition changes, registration decisions, payment verification, submission review, settings changes, and account deactivation.

Activity logs are append-only from application workflows and must not be editable by participants.

---

## 10. Database requirements

The logical schema and relationships are specified in `DATABASE.md`. Implement migrations and constraints based on that document.

Core entities:
- users
- participant_profiles
- events
- competition_categories
- competitions
- teams
- team_members
- registrations
- registration_documents
- submissions
- submission_revisions
- payments (optional)
- schedules
- announcements
- faqs
- notifications
- activity_logs
- event_settings

Database rules:
- Use foreign keys and appropriate indexes.
- Use unique constraints for email, slugs, registration number, team code, and other business keys.
- Use decimal for monetary values.
- Store files as paths/references, not database BLOBs.
- Use transactions for registration and status workflows.
- Avoid destructive cascades on registrations, payments, and audit records.
- Use soft deletes only where retention rules permit.
- Use ULID/UUID for public-facing identifiers where appropriate; internal numeric IDs are acceptable if consistently hidden from public routes.
- Normalize relational data and avoid storing duplicate derived data without a documented reason.

---

## 11. API requirements

API prefix: `/api/v1`.

The endpoint inventory is maintained in `API.md`.

All endpoints must:
- Validate input.
- Enforce authentication and authorization.
- Enforce resource ownership.
- Return consistent JSON.
- Use correct HTTP status codes.
- Paginate collection endpoints.
- Avoid leaking internal exception details.
- Use API Resources or equivalent response serializers.
- Be documented and tested.

Suggested response envelope:

```json
{
  "success": true,
  "message": "Pendaftaran berhasil dikirim.",
  "data": {
    "registration_number": "ITC-2026-00001",
    "status": "submitted"
  },
  "meta": null
}
```

Error response:

```json
{
  "success": false,
  "message": "Data yang dikirim tidak valid.",
  "errors": {
    "email": ["Alamat email tidak valid."]
  }
}
```

Do not expose stack traces, SQL errors, secrets, or private file paths.

---

## 12. Security and privacy

Mandatory:
- Hash passwords.
- Use Sanctum SPA session authentication and CSRF protection.
- Enforce role and resource authorization server-side.
- Rate-limit authentication endpoints.
- Validate and normalize input.
- Protect against SQL injection through parameterized Eloquent/query builder usage.
- Escape/render user-generated content safely.
- Validate file MIME type, extension, and size.
- Store private documents outside public web root.
- Serve private files through authorized download endpoints.
- Configure CORS and stateful domains explicitly.
- Keep secrets in environment variables.
- Never commit `.env`.
- Disable debug output in production.
- Use HTTPS in production.
- Minimize collection of personal data.
- Do not expose participant identity numbers, phone numbers, addresses, documents, or payment proofs publicly.
- Log important admin actions without logging passwords, tokens, or unnecessary personal data.

---

## 13. Non-functional requirements

### Performance
- Paginate list endpoints.
- Eager-load relationships where needed.
- Add indexes for common filters and joins.
- Optimize image dimensions and formats.
- Avoid unnecessary repeated API requests.
- Use caching only where invalidation is understood.

### Reliability
- Use transactions for multi-step writes.
- Handle duplicate/concurrent registration attempts.
- Provide clear error and retry behavior.
- Preserve previous submission revisions.
- Avoid silent data loss.

### Maintainability
- Modular backend and feature-based frontend.
- Consistent naming and formatting.
- Document non-obvious business rules.
- Automated tests for critical workflows.
- Avoid unnecessary abstractions and duplicated logic.

### Accessibility
- Labels for form controls.
- Keyboard-accessible interactions.
- Visible focus states.
- Sufficient contrast.
- Alt text for meaningful images.
- Status must not be communicated by color alone.

---

## 14. Route map

### Public
```text
/
├── /competitions
├── /competitions/:slug
├── /schedule
├── /announcements
├── /announcements/:slug
├── /faq
├── /login
├── /register
├── /forgot-password
├── /terms
└── /privacy
```

### Participant
```text
/participant
├── /dashboard
├── /profile
├── /teams
├── /teams/:id
├── /registrations
├── /registrations/create
├── /registrations/:id
├── /submissions
├── /notifications
└── /announcements
```

### Admin
```text
/admin
├── /dashboard
├── /events
├── /competitions
├── /categories
├── /participants
├── /teams
├── /registrations
├── /registrations/:id
├── /payments
├── /submissions
├── /schedules
├── /announcements
├── /faqs
├── /reports
├── /activity-logs
└── /settings
```

Frontend route guards are for navigation UX only. Backend authorization remains authoritative.

---

## 15. Delivery phases

### Phase 0 — Repository audit and planning
- Inspect current files and environment.
- Read all project instructions.
- Identify existing implementation and conflicts.
- Produce architecture, database, API, and development plans.
- Do not overwrite or delete existing work.

### Phase 1 — Foundation
- Configure Laravel, React, TypeScript, Tailwind, MySQL.
- Configure Sanctum, CORS, CSRF, Axios, and routing.
- Establish response conventions and project structure.
- Verify frontend-to-backend connectivity.

### Phase 2 — Data and backend foundation
- Implement migrations, models, relationships, enums.
- Implement seeders and controlled admin provisioning.
- Implement Form Requests, Resources, Policies, Services.
- Add backend tests for constraints and authorization.

### Phase 3 — Public website
- Implement public pages and responsive design.
- Connect public pages to real API data.
- Add loading, empty, and error states.

### Phase 4 — Authentication and participant workflows
- Implement auth and profile.
- Implement team workflows.
- Implement registration and document uploads.
- Implement submission and notifications.
- Test participant ownership boundaries.

### Phase 5 — Admin workflows
- Implement dashboard and management CRUD.
- Implement verification and review workflows.
- Implement CMS, schedules, FAQ, reports, and activity logs.
- Keep optional payment module disabled until approved.

### Phase 6 — Integration and QA
- End-to-end tests.
- Authorization and ownership tests.
- File upload tests.
- Responsive and accessibility checks.
- Fix regressions.

### Phase 7 — Deployment readiness
- Production environment configuration.
- Build and storage setup.
- HTTPS and security configuration.
- Backup and deployment documentation.

Do not start the next major phase until the current phase has a reviewable result and its acceptance checks pass.

---

## 16. Acceptance criteria

The MVP is acceptable only when:

### Authentication
- Participant can register, login, and logout.
- Admin can authenticate through controlled provisioning.
- Client cannot self-assign admin.
- Protected API routes enforce authentication and role.
- Session/CSRF behavior works in configured SPA environment.

### Public website
- Published competitions come from MySQL through API.
- Unpublished competitions are not public.
- Competition detail and registration availability are correct.
- Schedules, announcements, and FAQs are database-driven.
- Public pages are responsive.

### Participant
- Participant can manage own profile.
- Participant can create/manage eligible team.
- Participant can create and submit registration.
- Required documents are validated.
- Participant can see status and relevant notes.
- Participant can submit work when configured.
- Participant cannot access another user's private records.

### Admin
- Admin can manage events, categories, and competitions.
- Admin can inspect participants, teams, and registrations.
- Admin can approve, reject, or request revision with audit trail.
- Admin can review submissions.
- Admin can manage schedules, announcements, and FAQs.
- Reports and activity logs are available.

### Technical
- Critical flows have automated tests.
- Migrations run from a clean database.
- No critical feature is only a mockup.
- No primary button is inert.
- No known critical console or Laravel runtime error remains.
- File authorization and private storage work.
- No sensitive data is exposed in public API responses.

---

## 17. Definition of Done

A feature is not complete merely because its screen exists.

A feature is done when:
1. Data model and migration are correct.
2. Backend endpoint and business rules work.
3. Authorization and ownership checks work.
4. Validation and error handling work.
5. Frontend is connected to the real API.
6. Loading, empty, success, and error states exist.
7. Critical automated tests pass.
8. Responsive behavior is checked.
9. Relevant documentation is updated.
10. No unrelated feature or configuration was broken.

---

## 18. Open product decisions

Track unresolved decisions in `OPEN_QUESTIONS.md`. Current questions:
- Is registration free, manual bank transfer, or payment gateway?
- Are participants allowed to join multiple teams/competitions?
- What exact fields and documents are required per competition?
- What team invitation mechanism should be used?
- Is email verification mandatory?
- Is there a separate judging/scoring workflow in a future release?
- What are the official event branding assets, contact details, and legal texts?

Until decided, build configurable foundations only where they are clearly justified. Do not invent a provider, policy, fee, or legal statement.

---

**End of PRD**
