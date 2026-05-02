---
paths:
  - "scripts/**/*.js"
  - "scripts/mavp-operator"
---

# Scripts Rules

- All scripts are read-only operator tools — they report state, they do not modify it.
- `mavp-operator-lib.js` is shared logic; changes here affect all operator surfaces. Test snapshot and dashboard after any change.
- `parliamentary-validator-parser-v1.js` parses `## Active Wave` section in BACKLOG.md. If the section heading changes, update the regex in `parseBacklogActiveTasks()`.
- `mavp-operator-agent.js` is the Main Agent's session entry point — keep its JSON output schema stable. Any new fields are additive only.
- Do not add interactive prompts or side effects (file writes) to any operator script.
- Node.js only — no external npm dependencies.
