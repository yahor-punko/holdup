---
paths:
  - "docs/**/*.md"
  - "templates/**/*.md"
---

# Docs and Templates Rules

- Docs are the source of truth for the operating model. Do not inline their content into CLAUDE.md — use `@path` imports instead.
- When updating a doc that is referenced from another doc (e.g. MAVP_ENTRY_RULE.md → COLLAPSED_SLICE_PATTERN.md), check that cross-references remain accurate.
- Templates in `templates/` are canonical starting points for new projects. Keep them minimal — do not add project-specific content.
- `docs/examples/` contains worked packets. Treat as read-only reference unless explicitly adding a new example slice.
- Parliamentary docs (`docs/PARLIAMENTARY_*.md`) define the MavP specification. Changes here may affect the validator, operator, and agent protocol docs — note dependencies before editing.
- Role definitions live in `docs/PARLIAMENTARY_ROLES.md` and `docs/ROLES.md`. The Main Agent is the orchestrator; do not introduce new top-level roles without a lightweight decision record.
