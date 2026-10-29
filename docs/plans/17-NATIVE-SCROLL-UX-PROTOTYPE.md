# 17 — Native scrolling and first-use UX

Status: probe fixture being added under [25](25-ASSESSMENT-REMEDIATION.md); first-use study and native-device evidence **open**. Date: 2026-10-20. On 2026-10-29 the user directed 18 to proceed ahead of this gate; the gate still governs any discoverability or native-acceptance claim.

## Outcome

Establish whether the user's proposed desktop interaction works naturally: **select text → hover its highlight → scroll horizontally → assign the corresponding label**. Make it understandable without teaching a desktop drag gesture.

## Joint review and user decisions

This plan combines separate UX-expert and senior frontend-developer agent reviews, followed by cross-review. They inspected the specification, implementation and existing evidence; they did not conduct new hardware tests or user research.

Confirmed user feedback: the user does not know how to swipe with a mouse/trackpad, rejects “drag selected text to label,” proposes hovering over selected text and scrolling left/right, and wants the OS/browser to own scrolling rather than a custom diagonal recognizer.

| Observed implementation | Implication |
| --- | --- |
| `src/review.js:328–337` prevents default/captures a pointer immediately on pending text, without distinguishing input types. | Current classification is a second pointer drag, not native horizontal scrolling. Native touch-selection interference needs device reproduction. |
| `src/review.js:339–355` previews from horizontal displacement but commits using a separate release test. | Preview can suggest a label that release will not assign. |
| `src/gesture.js:2` applies 60px/1.5× release displacement rules. | These prototype tuning values do not define a native wheel/trackpad gesture. Do not transfer them to desktop scrolling. |
| `src/review.css` applies `touch-action: pan-y` to the whole document; mount requires `Selection.modify`. | Mobile selection/zoom/capability behavior is not established by the desktop tests. |
| Existing pointer checks include injected cancellation; initial CI tests short/right mouse drags. | Earlier passes do not prove this proposed UX, horizontal-wheel behavior, or mobile support. |

## Small prototype

Use a developer fixture, not new setup/configuration controls inside the mounted library. Start without annotation commits or `preventDefault()`. Observe native `wheel.deltaX`, `deltaY`, `deltaMode`, modifier/cancelability values and actual scrolling/navigation outcomes only while the pointer is over a pending range. Do not collect document content or send telemetry.

- Native horizontal input is the source of direction. No angle/axis-ratio classifier, conversion of vertical motion, custom trackpad gestures, required modifier, or dragged-text handle.
- Preserve native scrolling, zoom and browser navigation. A wheel event can contain both axes; canceling it cancels the whole event. Do not promise selective cancellation of its horizontal component.
- An ordinary vertical mouse wheel may provide no horizontal input. Buttons remain available; test tilt wheels/Shift-scroll only where the browser actually emits horizontal input. Do not synthesize it.
- Record natural-scrolling preferences and whether the shown direction matches the user's expectation. Do not add an app-level inversion setting without evidence.
- Observe momentum, repeated events, pointer exit, changed selection and navigation. Browsers do not provide a portable semantic wheel-gesture-end event; do not invent a pause/release contract or timing value in advance.

Proposed instruction: **“Hover over selected text and scroll left or right to label it.”** Show **← [configured left label] / [configured right label] →** and **“You can also choose a label button.”** This is proposed copy for testing, not claimed validated UX.

## Acceptance and gate

- An unfamiliar reviewer, given the interface and a labeling task, finds and completes both directions with a trackpad without verbal coaching or shortcut-help lookup. Record first attempt, assistance, errors, correct quote/label, single assignment and discoverable Undo. Button success does not count as proof that scrolling was discoverable.
- Record actual native behavior for pure vertical input, horizontal input, both axes, momentum, pinch/zoom, nested scrollable code and browser navigation. No application-generated scroll or navigation suppression.
- A horizontal-capable mouse is tested separately; a vertical-only mouse remains fully usable through buttons/keyboard.
- Before 18, write the observed direction/trigger and minimum duplicate-safety decision. Prefer the existing single pending range clearing after one commit. Add any tail/rearm guard only for an observed failing sequence.
- If native events cannot provide safe behavior on a device without violating the user's scrolling requirement, record the limitation and return to UX review; do not quietly add a custom diagonal recognizer or declare support.

## Done

- [ ] Native-input fixture results and first-use findings recorded with devices/browser versions.
- [ ] Exact trigger/copy and observed failure regressions agreed in this plan before implementation.
- [ ] Plan 18 begins only after this gate passes; current prototype is not relabeled as production-ready.
