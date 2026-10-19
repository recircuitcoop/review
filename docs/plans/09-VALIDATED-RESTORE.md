# 09 — Validated restore

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 08. Covers seed acceptance: 7, 8, 9, 13.
Seed: [annotation identity and anchoring](../../selection-swipe-library.md#annotation-identity-and-anchoring).

## Outcome

Restore saved annotations onto the exact source document without moving or relabeling them.

The guided application reopening flow and automatic label configuration are tracked separately in [plan 15](15-REOPEN-SAVED-REVIEW.md); reuse this plan's existing validation.

## API contract

Before implementation, specify the restore input schema, its relationship to grouped/split exports, and replace-versus-merge semantics here. Validate the full payload before changing live state: document/version, format/offset convention, canonical text, labels, IDs, finite integer positions, bounds, and exact quotes. Reject incompatible data with a useful error; never guess a repeated occurrence or reattach to changed text.

Preserve IDs, labels, independent overlaps, and positions. Define pending-state and history behavior for successful restore; failure leaves the existing session intact. Session document/label changes require explicit reset or validated reload.

## Tests and evidence

- Export → fresh instance → restore → export preserves semantic payload and highlights, including identical/overlapping ranges.
- Repeated phrases, emoji, and non-Latin passages return to the intended occurrence after reflow.
- Wrong version/text/label/format, duplicate IDs, invalid offsets, and mismatched quotes are rejected without partial mutation.
- The documented successful-restore history/pending behavior is asserted; failed restore preserves both.

## Done

- [x] Restore schema and atomicity checks pass for positive and negative cases.
- [x] Incompatible restore errors explain the failing field or annotation.
