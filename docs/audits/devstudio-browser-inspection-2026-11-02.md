# Studio browser inspection recovery — November 2, 2026

## Observed managed-browser behavior

The existing full Studio and standalone health tabs repeatedly timed out in DOMSnapshot.captureSnapshot, Runtime.evaluate and Page.getLayoutMetrics. Rebinding an existing tab did not recover it. A lightweight health response and the embedded Studio health route remained responsive. No JavaScript dialog was blocking the old tab. Captured logs included an extension metadata error; this does not by itself establish the cause.

Retiring the agent-created stalled tabs and opening a fresh full health tab restored inspection. Repeated native snapshots and a live Refresh interaction completed in under one second. This is an observed context recovery, not proof that the managed browser's underlying defect has been permanently removed. No unsaved user form or active course process was discarded.

## Independent source defects corrected in the owned Studio browser

| Before | Corrected behavior |
|---|---|
| Every frame evaluation could consume 60 seconds; up to 15 frames were inspected sequentially. | Frames share a 15-second inspection deadline; each evaluation receives at most 5 seconds. The preceding DOM readiness wait remains bounded at 10 seconds. |
| Waiting for a frame execution context added to the protocol command timeout. | Context admission and protocol execution share the caller's deadline. |
| Controls and headings were collected by scanning the full document and checking visibility before limiting the returned arrays. | Traversal stops after 6,000 DOM nodes or 250 ms, preserves open shadow-root support, and explicitly marks truncation. |
| A timed-out child frame could leave an otherwise successful-looking snapshot. | Incomplete frame inspection explicitly returns partial evidence and frame errors. |
| Simultaneous read requests could clear and interleave the same control-reference map. | Overlapping callers share one in-flight inspection; failure releases admission without replaying actions. |

Password values are not returned. Actions are not automatically retried. A stalled inspection never authorizes recreating a user's browser session or discarding their workspace.

## Validation

- Native browser service tests: 134 passed, 4 Chromium-dependent tests skipped locally.
- UI and DOM inspection tests: 75 passed.
- Source syntax, lint, Studio architecture and container memory-policy checks passed.
- Regression fixtures cover a 10,000-control document, shadow DOM, password-value exclusion, time and frame budgets, and concurrent inspection failure/recovery.
- The existing Google Studio release workflow runs Chromium inside the immutable browser image before it can publish or activate the runtime. Runtime activation and production acceptance remain separate evidence.
