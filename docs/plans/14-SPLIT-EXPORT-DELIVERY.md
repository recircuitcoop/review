# 14 — Split export delivery and filenames

Status: complete; two actual named downloads verified in all nine jobs of [CI run 3](https://github.com/recircuitcoop/review/actions/runs/39318606377). Depends on: 08, 12. Priority: fix before the desktop release gate.
Seed: [export contract](../../selection-swipe-library.md#export). Details: [host export delivery](../IMPLEMENTATION.md#host-export-delivery-and-filenames).

## Outcome

Split export provides both label JSON files reliably, including empty labels, with filenames based on the configured label names.

## API contract

For `notes.md` and labels `Accept` / `Reject`, provide `notes_Accept.json` and `notes_Reject.json`. Strip the final Markdown extension; preserve label case and valid Unicode. Sanitize unsafe filename characters consistently and reject empty/colliding resulting names before requesting downloads. Keep stable label IDs and the JSON schema unchanged.

The host prepares both files before offering delivery. Do not rely on two automatic anchor clicks in one handler: each file must have an independent, user-activated download/retry control. Show both filenames; do not report that both were saved merely because two links were created. Export and Done share this path and retain annotations for retry.

## Tests and evidence

- Reproduce the reported right-only download; distinguish two serialized payloads from two actual browser downloads.
- Test no annotations, left-only, right-only, and both labels: always two valid JSON files, including empty groups.
- Assert exact filenames for custom labels, `.md`/`.markdown`, spaces, Unicode, unsafe characters, and name collisions.
- Block/deny one automatic download: both independent controls remain usable; capture and parse each downloaded file and restore them together.
- Exercise Export files, Done, and keyboard equivalents in Chromium/Firefox/WebKit; include the native OS CI matrix.

## Done

- [x] Regression fails before the host fix; shared delivery and filename rules pass focused tests.
- [x] Rebuild offline app/library; verify both actual filenames and payloads, not link count alone.
- [x] Update README, verification record, and plan status with actual results and remaining platform gaps.

Implementation detail: the host's filename/payload preparation is a pure helper, tested independently of downloads. It prepares both blobs/URLs before replacing existing links and never auto-clicks them. A preparation failure preserves previous links and annotations. Download status says files are ready and explicitly asks users to download each file.

Evidence: 17 Node tests and the initial ten-test browser suite passed on Windows/Linux/macOS × Chromium/Firefox/WebKit. The download test captures both files, checks exact label-based names and payloads, and restores the pair. New local coverage includes 9 host checks and 31 core checks; expanded saved-review/theme CI has not run yet.
