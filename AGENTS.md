# AGENTS.md --- Instructions for AI Coding Agents

## 1. Mission

Build and maintain the Technology Festival & IT Competition frontend.
Follow `PRD.md` for product behavior and `design.md` for UI/UX. The
application includes a public event site, login/registration, and Admin,
Participant, and Judge dashboards.

## 2. Read before coding

Read `AGENTS.md`, `PRD.md`, `design.md`, `README.md` if present, and
relevant source files. Inspect the actual repository rather than
assuming its structure.

When requirements conflict: 1. Security and data integrity take
priority. 2. `PRD.md` defines product behavior. 3. `design.md` defines
visual design. 4. Preserve working architecture unless there is a clear
reason to change it.

## 3. Repository safety

-   Inspect `package.json`, lockfile, entry points, routes, and styling
    configuration first.
-   Preserve the existing homepage and working features.
-   Do not scaffold over a working app.
-   Do not delete files or rewrite configuration without a concrete
    need.
-   Avoid unnecessary dependency/version changes.
-   Do not overwrite environment files or remove user changes.
-   Never commit secrets, tokens, credentials, or real participant data.
-   Keep changes scoped to the requested task.

## 4. Coding standards

Preferred stack, subject to the existing project: React, TypeScript,
Vite, compatible existing Tailwind setup, React Router, Lucide React,
and Framer Motion only when useful.

-   Prefer explicit TypeScript types; avoid `any`.
-   Use functional components and hooks.
-   Keep components focused and reusable.
-   Separate data, presentation, and service logic.
-   Use semantic HTML and stable list keys.
-   Avoid unnecessary effects, duplicated state, and oversized
    components.
-   Follow existing naming and formatting conventions.
-   Do not add a dependency for trivial functionality.

## 5. Design rules

`design.md` is the visual source of truth. Maintain the dark brown-black
background, orange primary actions, restrained amber highlights, warm
readable text, strong hierarchy, selective glow, and responsive layouts.

-   Reuse design tokens and components.
-   Do not introduce conflicting palettes.
-   Do not color every component orange.
-   Avoid repetitive generic SaaS card layouts and excessive glass/neon
    effects.
-   Do not use emoji as a replacement for professional icons.
-   Never reference nonexistent assets.
-   Use official branding only when supplied.
-   Respect `prefers-reduced-motion`.

## 6. Roles and routes

Supported roles: `admin`, `participant`, `judge`. Public registration
must create participants only. Admin/Judge roles cannot be self-selected
publicly.

Expected route groups: - Public: `/`, `/login`, `/register`, competition
pages. - Admin: `/admin/*`. - Participant: `/participant/*`. - Judge:
`/judge/*`.

Use reusable route guards, predictable redirects, and a not-found page.
Ensure navigation links point to valid routes. Frontend guards are for
the prototype only; production authorization must be enforced by the
backend.

## 7. Authentication and sensitive data

-   Mock authentication is allowed only when clearly documented.
-   Use development-only demo accounts with non-sensitive sample
    credentials.
-   Never store plaintext passwords in localStorage, sessionStorage, or
    source-controlled data.
-   Never claim server authentication/account creation without a
    backend.
-   Keep authentication behind a replaceable service interface.
-   Logout must clear the active prototype session.
-   Browser-exposed environment variables are not secrets.
-   Password recovery, password change, email verification, and real
    registration require a backend/provider integration.

## 8. Mock data and state

-   Keep mock records in dedicated modules and use typed models.
-   Calculate dashboard metrics from available data instead of
    duplicating hardcoded counts.
-   Make search and filters actually update displayed results.
-   Prevent duplicate registrations for the same participant and
    competition.
-   Restrict judge mock views to assigned competitions/submissions.
-   Validate score bounds and rubric weights; calculate weighted totals
    consistently.
-   Mark simulated actions honestly.
-   Do not claim persistence unless implemented.
-   Keep service interfaces replaceable with API implementations.

## 9. Forms and interactions

Every visible interactive element must work or be explicitly marked
unavailable/pending integration.

Forms should: - Validate required fields and formats. - Show clear
field-level errors. - Provide loading/success/error states when
appropriate. - Disable invalid or duplicate submissions. - Confirm
consequential actions. - Use accessible labels and focus behavior. -
Avoid false success messages for unpersisted operations.

Navigation should be keyboard accessible, include a working mobile menu,
and show accurate active states.

## 10. Accessibility and responsiveness

-   Use semantic elements and logical heading hierarchy.
-   Provide visible focus indicators and labeled inputs/errors.
-   Use buttons for actions and links for navigation.
-   Maintain adequate contrast; do not rely on color alone for status.
-   Respect reduced-motion settings.
-   Make touch targets usable.
-   Test desktop, tablet, and mobile.
-   Avoid unintended horizontal overflow. Contain horizontal scrolling
    for wide tables.

## 11. Component boundaries

Adapt to the repository, but consider reusable components for auth
layouts/forms, dashboard layout/sidebar/topbar, page headers,
statistics, tables, filters, status badges, empty states, confirmation
dialogs, competition cards, timeline entries, FAQ accordions, and judge
scoring criteria.

Keep role-specific pages separate while sharing appropriate layout and
UI primitives.

## 12. Workflow for every task

1.  Understand the request and affected routes.
2.  Read the relevant documentation and inspect the implementation.
3.  Plan non-trivial changes briefly.
4.  Make the smallest coherent change.
5.  Reuse existing components and tokens.
6.  Run relevant checks and the production build.
7.  Inspect errors, warnings, and broken interactions.
8.  Fix regressions introduced by the change.
9.  Summarize files changed, checks run, and limitations.

Do not claim tests passed unless they were actually run. If a command
fails, inspect the error and attempt a relevant fix.

## 13. Verification checklist

Verify as applicable: - Development server starts. - Production build
succeeds. - Login and registration validation works. - Each demo role
reaches the correct dashboard. - Unauthenticated and wrong-role routes
are handled. - Dashboard navigation works. - Search and filters work. -
Mock CRUD updates the UI. - Participant registration prevents
duplicates. - Judge score validation and calculations are correct. - FAQ
and mobile navigation work. - Responsive layouts are usable. - No
obvious broken assets, console errors, or React warnings remain.

Report what was actually tested and what remains unverified.

## 14. Definition of done

A change is complete when it meets `PRD.md`, follows `design.md`,
preserves unrelated working behavior, has functioning interactions, is
reasonably responsive/accessibile, has been checked, and documents mock
behavior/backend dependencies honestly.

## 15. Reporting

Summarize what changed, important files created/modified, commands and
tests actually run, and backend integrations or decisions still
required. Be factual and explicit about limitations. Never claim
completion, persistence, security, or test success without evidence.
