# Plans 01–12 completion

Status: complete for the core implementation and local acceptance checks, 2026-10-19. Native cross-platform release validation remains in plan 13. Plans 14–16 remain separate pending work: split-download delivery/naming, guided reopening, and night theme.

## Evidence

`npm test`: **12/12 pass**. `npm run build`: pass, producing the standalone offline application and reusable library. `npm run test:page`: builds the reproducible acceptance and pointer pages.

`test-results/browser-check.html` visibly reports **30/30 pass** in Chromium **143.0.7499.4** and Safari **26.3.1** on macOS. These checks use real DOM/Range/Selection APIs with programmatically dispatched commands. Platform strings exercise Windows/Linux/macOS modifier branches; they are not native Windows/Linux results.

| Plan | Completed proof |
| --- | --- |
| 01 | Native engine feasibility, one state/history authority, runnable state/browser harness and builds. Recogito evaluation was unavailable; the documented native alternative is implemented. |
| 02 | Supported Markdown renders; unsafe HTML, executable links, and remote image loading are removed. Invalid mounting leaves host content intact. |
| 03 | Canonical rendered-text v1, UTF-16/exclusive offsets, formatted/cross-block/Unicode ranges, reflow and font changes preserve anchors. |
| 04 | Block/list/code clicks, exact ranges including a one-pixel drag, replacement, outside clearing, link suppression and toolbar retention. Proposed defaults have local behavior evidence; no claim of user usability approval. |
| 05 | Shared label commands, one commit, copied events, correct pending/committed highlights and export exclusion. |
| 06 | Independent overlaps, chooser, relabel/delete, stable identity and reversible history. |
| 07 | Threshold boundaries, both labels, final displacement/reversal, duplicate release, outside starts, cancellation and destruction. Trusted pointer proof below supplements controller checks. |
| 08 | Grouped/split structured exports include empty labels and metadata; document order, anchors and committed-only serialization pass. Host download fixes remain in 14. |
| 09 | Atomic compatible restore, stable IDs, quote/version rejection and grouped/split round trips. |
| 10 | All 15 toolbar commands and dispatcher handlers, applicable/default handling, remapping/hints/help, editable/IME/host scoping, chooser/dialog priority and modifier branches. |
| 11 | F2, exact/word/cross-block read-only selection and common classification path; prior native Safari F2 input supplements DOM checks. |
| 12 | Done/Mod+Enter, either label/discard/cancel, valid empty completion, save rejection/retry, concurrent-save protection, isolated instances and destroy during resolution. Host consumes structured exports. |

Two new regressions were observed failing before product fixes: a nonempty native drag within the four-pixel click tolerance expanded to the whole block; inapplicable label/clear/history shortcuts consumed defaults. The pointer-release and shared command handlers now preserve their documented behavior. Dialog tests await the native `close` event rather than a timer, removing test scheduling races.

## Trusted desktop input

Reproduce with `npm run test:page`, then open `test-results/pointer-check.html`. Select a scenario and drag from the highlighted text itself, avoiding gaps between its line rectangles. The probe observes trusted events and the actual preview, layout, committed count and pending quote.

Observed in Chromium on macOS:

- Left and right drags each committed the entire multiline range once with the correct label, a full-quote destination preview, unchanged document dimensions and no animation/transition.
- A 30px horizontal drag and a mainly vertical drag committed nothing and retained the pending range.
- Injected `pointercancel` and Escape signals **during trusted drags** canceled without commit and retained pending text. Destroy during a trusted drag removed the preview and instance. These checks prove controller response; they do not claim a physical OS pointer interruption was generated.
- A native wheel scroll moved the page **578px** with the annotator mounted and pending text. No annotation was created.
- DevTools Rendering was set to `prefers-reduced-motion: reduce`; another trusted left drag passed the preview/layout/no-animation/one-commit checks. The preview has no transition or animation even without this preference.
- Native Escape closed help and restored the help button's focus. Native Enter reopened help from that button. Shift+Tab reached Done; forward Tab returned through help and entered the document surface normally. Prior Safari checks cover native F2 selection and overlap chooser Down/Enter, deletion and undo.

The browser controller check separately exercises repeated release and a reversal ending below threshold. It stubs pointer capture only for synthetic events; the trusted probe uses real capture.

## Remaining release work

Plan 13 retains native Windows/Linux, Firefox, broader shortcut/assistive-technology and OS interruption checks. The sandbox blocks the Playwright server/headless launch; no passing Playwright run or CI run is claimed. Repository/remote setup is still blocked as recorded in [verification](VERIFICATION.md) and [repository setup](REPOSITORY.md).

All five requested development tools are installed/configured. Serena is active; TOKF works with its temporary database. Codebase Memory indexing and the Caveman compression engine remain environment-limited. Source reads and recorded test results provide evidence without claiming graph coverage.
