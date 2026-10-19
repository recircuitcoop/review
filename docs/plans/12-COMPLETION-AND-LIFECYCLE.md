# 12 — Completion and lifecycle

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 09, 10, 11. Covers seed acceptance: 6, 10, 11, 14.
Seed: [finish](../../selection-swipe-library.md#finish) and [public surface](../../selection-swipe-library.md#public-library-surface).

## Outcome

Finish safely through Done or Mod+Enter, expose the complete host API, and clean up an instance.

## API contract

With pending text, completion first offers label-left, label-right, or discard; dismissing the resolution leaves the session open. After resolution, return committed structured export, including a valid empty session. Done and Mod+Enter share this flow; export-without-finish keeps pending state and session open.

Document completion/error event payloads and save acknowledgment/retry behavior before implementation. Host save failures must retain all annotations for retry; no automatic destructive reset. Provide the specified mount/select/clear/activate/edit/read/restore/history/export/finish/destroy methods and effective shortcut map. Destroy removes listeners, previews, highlights, and owned UI without changing host-owned content. Document repeated-destroy and post-destroy behavior.

## Tests and evidence

- Browser checks finish with no pending text, zero annotations, and each pending resolution; each payload contains every committed annotation once.
- Pending-resolution Escape closes the dialog first and restores focus without losing text.
- Simulated host save rejection preserves session data; retry returns the same committed IDs/data without duplicate creation.
- Two instances keep commands/events isolated; destroy during preview removes owned resources, emits no later callbacks, and allows a fresh mount.

## Done

- [x] Completion, retry, event, and lifecycle checks pass; public API documentation matches behavior.
- [x] F2 and Done now complete the shortcut map; demo host uses structured exports.
