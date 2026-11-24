# IT Competition Management Platform — Project Documentation

This folder contains the product and engineering specification pack for the IT Competition Management Platform.

## Documents

| File | Purpose |
|---|---|
| `PRD.md` | Product scope, roles, features, UI/UX, business rules, acceptance criteria |
| `AGENTS.md` | Mandatory AI coding-agent behavior and constraints |
| `ARCHITECTURE.md` | System architecture and technical boundaries |
| `DATABASE.md` | Logical schema, relationships, constraints, migration guidance |
| `API.md` | REST API contract and endpoint inventory |
| `DEVELOPMENT.md` | Setup, implementation phases, testing, handoff |
| `OPEN_QUESTIONS.md` | Decisions that must be confirmed; prevents agent assumptions |
| `CHANGELOG.md` | Change history |

## How to use with Antigravity

1. Place these files in the project root.
2. Ensure `AGENTS.md` and `PRD.md` are at the repository root.
3. Ask the agent to inspect the repository and read all documents before coding.
4. Start with Phase 0 in `DEVELOPMENT.md`.
5. Review the audit and plan before approving implementation.
6. Implement one phase at a time.
7. Update documentation whenever an approved decision or contract changes.

## Important

These documents define a baseline, not permission to invent missing event policies. Confirm unresolved items in `OPEN_QUESTIONS.md` before implementing dependent workflows.
