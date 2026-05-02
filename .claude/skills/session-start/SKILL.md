---
name: session-start
description: Load current Mavericks operating state. Use at the start of any session or after context is lost. Injects live initiative, stage, active slices, and next action.
user-invocable: true
allowed-tools: Bash(./scripts/mavp-operator --agent)
---

## Current Mavericks state

!`./scripts/mavp-operator --agent`

---

Read the JSON above. Key fields:
- `stage` — where the initiative currently stands
- `active_slices` — what is in flight and who owns it
- `next_action` — what to do next
- `blocker` — stop if non-null, resolve blocker first

Begin from `next_action`. Do not re-derive state from chat history.
