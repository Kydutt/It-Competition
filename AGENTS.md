# AGENT INSTRUCTIONS

This file defines mandatory engineering behavior for every AI coding agent working in this repository.

## 1. Read before acting

Before planning or changing code, read:
1. `AGENTS.md`
2. `PRD.md`
3. `ARCHITECTURE.md`
4. `DATABASE.md`
5. `API.md`
6. `DEVELOPMENT.md`
7. `OPEN_QUESTIONS.md`, if present

Inspect the actual repository before assuming it is empty. Existing code and configuration may contain important work.

## 2. Source of truth and conflict handling

- `PRD.md` is the product requirements source of truth.
- `ARCHITECTURE.md` defines technical boundaries.
- `DATABASE.md` defines the approved logical data model.
- `API.md` defines the API contract.
- `DEVELOPMENT.md` defines phase sequencing and verification.
- This file defines agent behavior.

If documents conflict:
1. Stop the affected implementation.
2. Identify the exact conflict and affected files/features.
3. Explain the impact.
4. Propose a minimal resolution.
5. Update the relevant documentation only after approval.

Do not silently choose a new product rule.

## 3. Non-negotiable stack

- Backend: Laravel / PHP.
- Frontend: React + TypeScript.
- Styling: Tailwind CSS.
- Database: MySQL.
- API: REST JSON under `/api/v1`.
- Authentication: Laravel Sanctum SPA cookie/session authentication.

Do not replace the stack, add another database, introduce a second frontend framework, or move business logic into the browser without explicit approval.

Use versions compatible with the repository's current runtime. Do not perform major dependency upgrades casually.

## 4. Scope control

- Implement only requirements in `PRD.md` or explicitly approved changes.
- Do not invent roles, workflows, statuses, tables, endpoints, integrations, or policies.
- Do not implement out-of-scope features.
- Optional payment functionality remains disabled until the product owner confirms its policy.
- Do not add a judge role or scoring system without approval.
- Do not fabricate organizer details, prices, dates, contact information, legal copy, or statistics.

When information is missing, add a precise entry to `OPEN_QUESTIONS.md` and continue only with work that does not depend on the answer.

## 5. Mandatory workflow

For each task:

1. **Inspect** relevant code, tests, configuration, and documentation.
2. **Plan** the smallest safe implementation.
3. **Report** intended files and risks before broad or destructive changes.
4. **Implement** one coherent slice.
5. **Test** the slice.
6. **Review** diff for regressions, secrets, duplication, and scope creep.
7. **Document** changed behavior and decisions.

Do not implement the entire application in one pass. Follow the phases in `DEVELOPMENT.md`.

## 6. Backend rules

- Keep controllers thin.
- Use Form Requests for request validation.
- Use API Resources for response serialization.
- Use Policies and middleware for authorization.
- Use Services/actions for multi-step business workflows.
- Use Eloquent relationships and eager loading.
- Use database transactions for multi-record operations.
- Use enums/constants for finite statuses.
- Validate resource ownership on every private resource endpoint.
- Do not trust IDs, role values, prices, status values, or ownership fields supplied by the client.
- Do not return raw models if that would expose private fields.
- Avoid N+1 queries.
- Do not use mass assignment without carefully defined `$fillable` or guarded behavior.

## 7. Frontend rules

- Use React functional components and TypeScript.
- Avoid `any`; use explicit types for API payloads and responses.
- Keep API calls in service modules, not scattered throughout presentation components.
- Centralize Axios configuration and API base URL.
- Use reusable UI components where repeated.
- Keep route guards for navigation UX, but never treat them as backend security.
- Provide loading, empty, error, and success states.
- Do not use hardcoded mock records as production data.
- Do not leave primary buttons or menu items inert.
- Keep secrets and privileged authorization logic out of frontend code.

## 8. Database rules

- Migrations are the schema source of truth.
- Use foreign keys, unique constraints, indexes, and appropriate nullability.
- Do not destroy or rewrite existing user data without explicit approval.
- Avoid cascading deletes on registrations, payments, and audit history.
- Use transactions for registration and status transitions.
- Store files as storage paths, not BLOBs.
- Monetary values use decimal types.
- Add migrations for schema changes; do not rely on manual database edits.

## 9. Security rules

- Never commit `.env`, credentials, tokens, or private keys.
- Do not log passwords, session cookies, tokens, or unnecessary personal data.
- Enforce authorization on the backend.
- Use Sanctum CSRF/session protections.
- Rate-limit authentication endpoints.
- Validate file MIME type, extension, and size.
- Store private documents outside public web root.
- Serve private files only after authorization.
- Do not expose participant personal data in public APIs.
- Do not disable security checks to make tests pass.
- Do not expose stack traces or SQL errors in production responses.

## 10. UI/UX rules

Follow the orange/blue design system in `PRD.md`.
- Orange `#F47B20` is the primary action accent.
- Blue `#1769AA` is the supporting accent.
- Use neutral backgrounds and readable text.
- Keep typography, spacing, border radius, and component states consistent.
- Avoid excessive gradients, shadows, animation, and decorative clutter.
- Make layouts mobile-first and keyboard-accessible.
- Use status text/icons as well as colors.

Do not copy assets, text, source code, or logos from the reference website.

## 11. Testing rules

At minimum, test the affected behavior:
- Backend validation and authorization.
- Participant resource ownership.
- Registration status transitions.
- Duplicate/concurrent registration handling where relevant.
- File upload constraints and access control.
- API response contract.
- Frontend loading/error/success behavior.
- TypeScript/build checks.

Run the repository's actual test commands. Do not claim tests passed if they were not run. Report blocked tests and why.

## 12. Git and file safety

- Do not delete files merely because they appear unused.
- Do not overwrite configuration blindly.
- Do not reset, force-push, or rewrite Git history.
- Do not modify unrelated files.
- Keep changes focused and reviewable.
- Never stage or commit secrets.
- Preserve existing user changes.

## 13. Completion report

At the end of each phase/task, report:
- What was implemented.
- Files created/modified.
- Migrations or commands run.
- Tests run and results.
- Known limitations.
- Open decisions.
- Recommended next phase.

A feature is not done because its UI renders. It is done only when the backend, data, authorization, validation, frontend integration, and relevant tests work together.
