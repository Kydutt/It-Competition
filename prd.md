# PRD.md --- Product Requirements Document

**Product:** Technology Festival & IT Competition Platform\
**Status:** Frontend prototype specification\
**Reference:** https://www.find-it.id/\
**Design source:** `design.md`\
**Preferred stack:** React, TypeScript, Vite

## 1. Overview

A responsive event platform for a technology festival and IT
competition. Visitors explore event information and competitions.
Authenticated users interact through role-specific experiences: Admin,
Participant, or Judge. The visual identity follows `design.md`: premium
futuristic dark surfaces with orange and amber accents. The reference is
inspiration, not a source to copy branding, assets, or text from.

## 2. Goals

-   Communicate event details and competition opportunities clearly.
-   Provide login and participant registration flows.
-   Provide dedicated dashboards for Admin, Participant, and Judge.
-   Make schedules, registration status, announcements, and scoring
    workflows easy to understand.
-   Keep frontend components modular for future API integration.
-   Support desktop, tablet, and mobile access.

## 3. Non-goals

The initial frontend does not include production authentication, backend
authorization, database persistence, email delivery, password recovery,
payment processing, or real file storage. Mock actions must not be
presented as server-persisted actions. Do not invent official event
dates, prizes, sponsors, fees, rules, or contact information.

## 4. Roles and permissions

### Public visitor

Can browse the homepage, event information, competition listing/details,
FAQ, and public announcements, and navigate to login/register. Cannot
access protected dashboards.

### Participant

Can view/edit allowed profile fields, browse competitions, register in
the prototype, view registration statuses, schedules, announcements, and
configured guidebook links. Cannot access admin or judge-only pages.

### Judge

Can view assigned competitions and submissions, enter scores against
configurable criteria, save draft evaluations, submit evaluations, and
view progress. Must not see unassigned competitions or submissions.

### Admin

Can view overview metrics and manage participant records, competitions,
judge profiles/assignments, schedules, announcements, and summary
reports.

Public registration must always create a Participant role. Users must
not be able to self-select Admin or Judge. Frontend role checks are
navigation aids only; production authorization must be enforced by the
backend.

## 5. Routes

**Public** - `/` - `/login` - `/register` - `/competitions` -
`/competitions/:competitionId` - Not-found route

**Admin** - `/admin/dashboard` - `/admin/participants` -
`/admin/competitions` - `/admin/judges` - `/admin/schedule` -
`/admin/announcements` - `/admin/reports`

**Participant** - `/participant/dashboard` -
`/participant/competitions` - `/participant/registrations` -
`/participant/schedule` - `/participant/announcements` -
`/participant/profile`

**Judge** - `/judge/dashboard` - `/judge/competitions` -
`/judge/evaluations` - `/judge/results` - `/judge/profile`

Routes may be adapted to an existing equivalent architecture if
navigation remains clear and consistent.

## 6. Functional requirements

### Public website

-   Include navigation, hero, about, benefits, competitions, timeline,
    FAQ, sponsors/partners only when confirmed, final CTA, and footer.
-   All navigation and competition links must work.
-   Hide unavailable official data or clearly label it as
    placeholder/configurable.
-   Maintain readability and avoid mobile horizontal overflow.

### Login

-   Email and password fields, show/hide password, remember-me UI if
    needed, registration link, and password-recovery UI.
-   Validate required fields and email format.
-   Show field errors and submission feedback.
-   Mock login must be clearly documented; never store plaintext
    passwords in browser storage.
-   Do not claim real authentication without a backend.

### Participant registration

-   Full name, email, student ID/NIM, institution, password, confirm
    password, and terms acceptance.
-   Validate required fields, email, matching passwords, and terms
    acceptance.
-   Public registration creates a participant only.
-   Clearly indicate when account creation is simulated.

### Role navigation

-   Successful demo login directs each role to its dashboard.
-   Unauthenticated protected-route visits redirect to login.
-   Wrong-role visits redirect to that user's dashboard or an
    unauthorized page.
-   Logout clears the active demo session.
-   Frontend route guards are not production security.

### Admin dashboard

-   Overview: participant, competition, judge, and pending-registration
    counts; recent activity; upcoming milestones.
-   Participants: search by name/email/NIM, filter status, view details,
    approve/reject where applicable, confirmation for consequential
    actions, pagination or a suitable small-data alternative.
-   Competitions: list/create/view/edit records, eligibility, format,
    registration window, status, guidebook URL.
-   Judges: manage profiles and competition assignments.
-   Schedule: create/edit/list milestones and sort chronologically.
-   Announcements: draft/edit, configure audience and status; publishing
    is simulated unless API-backed.
-   Reports: registration, participation, assignment, and evaluation
    summaries calculated from available data.

### Participant dashboard

-   Overview: greeting, registered competition count, status summary,
    upcoming schedule, latest announcements.
-   Competitions: browse/search/filter, view details and eligibility,
    register in prototype state, prevent duplicates.
-   Registrations: show Pending, Approved, Rejected, or Completed when
    relevant; show team details if supported.
-   Schedule: chronological milestones with configured
    date/time/location.
-   Announcements: show published announcements intended for
    participants.
-   Profile: view/edit allowed fields with validation and honest save
    feedback.

### Judge dashboard

-   Overview: assigned competitions, assigned submissions,
    pending/completed evaluations, and configured deadlines.
-   Assigned competitions: show only assignments for the current judge.
-   Evaluations: search/filter assigned participants or teams and show
    Pending, Draft, and Submitted states.
-   Scoring form: participant/team and competition context; configurable
    criteria; bounded numeric inputs; optional comments; weighted total;
    save draft; submit confirmation; status feedback.
-   Validate score ranges and rubric weights. A sample rubric may be
    Technical Quality 40%, Innovation 30%, Presentation 20%,
    Documentation 10%, but it is not official and must remain
    configurable.
-   Lock or restrict editing after submission according to configurable
    rules.

### Shared UI

-   Reusable dashboard layout, sidebar, topbar, cards, tables, status
    badges, search/filter controls, dialogs, empty states, and page
    headers.
-   Every visible control must work or be clearly marked
    unavailable/pending integration.
-   Forms need loading, validation, success, and error states.
-   Dashboard counts should derive from the same data source.

## 7. Design requirements

Follow `design.md`. Use dark brown-black backgrounds, orange primary
actions/active states, restrained amber highlights, warm readable text,
clear hierarchy, selective glow, deliberate spacing, and varied layouts.
Avoid generic repetitive card grids and excessive effects.

Accessibility: semantic HTML, logical heading order, keyboard
navigation, visible focus, labeled inputs and errors, sufficient
contrast, reduced-motion support, and touch-friendly controls. Never
rely on color alone for status.

## 8. Technical requirements

Prefer React, TypeScript, Vite, existing compatible Tailwind setup,
React Router, Lucide React, and Framer Motion only when useful. Inspect
the repository before changing configuration. Preserve the working
homepage. Use reusable typed components, separate mock data from UI, and
keep services replaceable for future APIs. Avoid unnecessary
dependencies and hardcoded duplicate statistics.

## 9. Suggested frontend models

-   `User`: id, name, email, role, status.
-   `ParticipantProfile`: userId, studentId, institution.
-   `Competition`: id, name, slug, description, category, eligibility,
    format, registration dates, status, guidebook URL.
-   `Registration`: id, participantId, competitionId, status, createdAt,
    optional team details.
-   `JudgeAssignment`: id, judgeId, competitionId, status.
-   `Evaluation`: id, judgeId, participant/team ID, competitionId,
    criterion scores, weighted total, comments, status, timestamps.
-   `ScheduleEvent`: id, title, description, start/end time, related
    competition, location/link.
-   `Announcement`: id, title, body, audience, status, publication time.
-   `Activity`: id, type, description, createdAt.

These are frontend models, not a finalized database schema.

## 10. Prototype/backend boundary

Mock data and in-memory state are acceptable for a frontend
demonstration. Document the limitations. Do not claim cross-device
persistence, real account creation, message delivery, or score
publication without backend confirmation. Production integration must
provide authentication, server-side authorization, validation,
persistence, and appropriate auditability.

## 11. Acceptance criteria

1.  Existing homepage remains functional.
2.  Login and registration render responsively and validate inputs.
3.  Demo login demonstrates all three roles.
4.  Protected routes handle unauthenticated and wrong-role access.
5.  Each dashboard has working navigation and relevant content.
6.  Admin mock CRUD actions work.
7.  Participant browsing and mock registration work without duplicates.
8.  Judge scoring validates ranges and calculates weighted totals
    correctly.
9.  Search and filters update visible data.
10. Loading/empty/error states exist where appropriate.
11. No obvious broken links/assets, console errors, or React warnings
    remain.
12. Mobile layouts have no unintended horizontal overflow.
13. Production build succeeds.
14. Documentation explains setup and demo limitations.

## 12. Decisions requiring event-owner confirmation

Official event name/year, logo, dates, location, contacts, categories,
eligibility, team rules, registration approval workflow, judge
assignment process, official rubric, score-editing policy, public
results policy, guidebooks, sponsors, registration destination,
backend/API, and privacy/retention requirements. Keep these configurable
until confirmed.
