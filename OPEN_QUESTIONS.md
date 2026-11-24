# Open Product Questions

This file tracks decisions that must be confirmed by the product owner. Agents must not silently invent answers.

| ID | Question | Why it matters | Temporary handling | Status |
|---|---|---|---|---|
| Q-001 | Is registration free, manual bank transfer, or payment gateway? | Determines payment workflow, tables, verification, and UX. | Keep payment module disabled. | Open |
| Q-002 | Can one participant join multiple teams or competitions? | Affects uniqueness constraints and eligibility. | Enforce only duplicate membership within the same team; do not invent global restrictions. | Open |
| Q-003 | What fields/documents are required for each competition? | Determines dynamic registration form and document requirements. | Keep requirements configurable; do not fabricate mandatory documents. | Open |
| Q-004 | What team invitation mechanism is desired? | Affects membership confirmation and security. | Do not implement email invitations or invite codes yet. | Open |
| Q-005 | Is email verification mandatory? | Affects account activation and registration eligibility. | Implement configurable capability only if needed; do not block workflows without approval. | Open |
| Q-006 | Is there a separate judging/scoring workflow? | Would require judge role, rubric, score, and result modules. | Out of MVP. | Open |
| Q-007 | What are official event dates, logo, organizer details, contacts, and social links? | Required for real public content. | Use clearly labeled placeholders in development only. | Open |
| Q-008 | Are there registration capacity limits per competition? | Affects availability and concurrency handling. | No capacity limit unless configured and approved. | Open |
| Q-009 | Can participants cancel after submitting registration? | Affects status transitions and records. | Draft cancellation only; submitted cancellation requires admin policy. | Open |
| Q-010 | What file formats and maximum sizes are allowed? | Affects upload validation and storage. | Define conservative development defaults in config, clearly documented; confirm before production. | Open |

## Decision log

When a question is answered, record:
- Question ID.
- Confirmed decision.
- Date.
- Person/role approving.
- Documents and code affected.

Then update `PRD.md`, `DATABASE.md`, `API.md`, and tests as required.
