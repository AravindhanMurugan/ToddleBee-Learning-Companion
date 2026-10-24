---
name: ToddleBee subscription gating
description: User's current decision to keep ToddleBee subscription checkout unavailable.
---

Keep ToddleBee subscription checkout unavailable until the user selects a supported billing provider.

**Why:** On 2026-10-24, after Cashfree was ruled out of the supported billing flow, the user chose to keep checkout unavailable for now.

**How to apply:** Do not re-enable payment attempts or grant paid access unless the user explicitly chooses a supported provider.
