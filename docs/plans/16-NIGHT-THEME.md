# 16 — Night theme

Status: implemented and locally verified; expanded CI and native accessibility verification are pending. Depends on: 02, 05. Presentation only; include in release gate 13.
Seed: [night theme](../../selection-swipe-library.md#night-theme). Contract: [theme behavior](../IMPLEMENTATION.md#night-theme).

## Outcome

Read and annotate comfortably in a night theme, with a visible keyboard-accessible switch back to light.

## API contract

Follow the system color preference until the user chooses a theme. A named light/night toggle exposes its state and saves only the theme preference locally. Follow system changes while no manual preference exists. If preference storage is unavailable, switching still works for the current page.

Use shared CSS color variables for the host, document, toolbar, forms, code blocks, saved annotations, dialogs, download links, swipe preview, focus indicators, native selection, and all four custom highlights (left, right, pending, active). Replace hard-coded highlight colors at their existing owner; do not rebuild the document or remount the annotator to change theme. Embedded libraries inherit host theme variables without a new mount option.

Theme changes preserve pending/native selection, saved annotations, IDs, offsets, edit history, focus, open dialogs, and exports. Meet WCAG AA contrast in both themes; label text and active-state indicators remain meaningful without color alone. Theme preference stays outside annotation JSON.

## Tests and evidence

- Emulate light/dark system preferences, manual overrides, live system changes, and reload; verify effective colors and toggle state.
- Block local preference storage: toggling remains usable without breaking file loading, annotation, or export.
- Switch with pending text, overlapping highlights, an open dialog, and undo history; state and exported data remain identical.
- Check document/code text, controls, each highlight, focus, and preview contrast; capture both themes in Chromium/Firefox/WebKit, including offline-file use.

## Done

- [x] Focused preference/state and browser checks pass; all surfaces use theme-aware colors.
- [ ] Keyboard/screen-reader state and contrast are verified; offline app rebuilt.
- [x] Usage docs and verification record distinguish completed checks from platform gaps.

Implementation detail: store `light`/`dark` under `review-theme`; an invalid or unavailable preference follows the system until the user clicks the native “Night theme” pressed-state button. Theme pointer interaction retains document focus/selection. Shared `--review-*` variables cover all colors; custom highlights retain light fallbacks for embedding without the stylesheet. Numeric WCAG contrast checks cover normal text (4.5:1), boundaries and focus (3:1), supplemented by real-browser state/presentation checks.

Local evidence: 21 Node tests pass, including system/manual preference handling, restricted storage and numeric text/highlight/control/focus contrast. The 9-check host page passes in Chromium and Safari with theme changes preserving selections, open dialogs, focus, history and exports. Playwright system-emulation, native keyboard-toggle and storage-denial cases are written but have not run in CI.
