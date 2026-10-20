# 20 — Desktop and mobile interaction acceptance

Status: planned, not run. Depends on: 18 and 19. Complements 13's release gate; does not replace it.

## Outcome

Prove that the requested interactions work on real input hardware and that a first-time user understands them. No feature implementation in this slice.

## Evidence matrix

| Input | Minimum native evidence |
| --- | --- |
| macOS trackpad | Safari and Chromium; native horizontal scroll with recorded natural-scrolling preference. |
| macOS mouse | Horizontal-capable mouse if available; ordinary vertical-only mouse remains usable with buttons/keyboard. |
| Windows/Linux desktop | Chromium/Firefox and actual available precision trackpad or horizontal-capable mouse; record untested hardware instead of implying coverage from CI. |
| iPhone touch | Physical iPhone Safari: native long press, selection handles, scroll, pinch, edge navigation and horizontal classification. |
| Android touch | Physical Android Chrome: the same native-selection/gesture workflow. |

Record actual device, OS/browser version, input settings, source/CI commit and observed result. Missing hardware is an open gate. Browser-engine CI, resized desktop windows, emulated touch, injected cancellation and synthetic wheel events must be identified as such.

## Task script and pass criteria

1. Without coaching, select a passage and assign each configured label using the proposed interaction. On desktop, hover and native horizontal scrolling; no drag lesson. Record first attempt/help needed. Label-button use is valid application use but not scrolling/swipe discoverability proof.
2. Select and adjust an exact multiline range across formatting, repeated text, emoji, list/code blocks and overlaps. Verify the resulting quote and anchors after each action.
3. Read/scroll normally, including while hovering/starting on a selection. Exercise mixed native axes, zoom, nested scrollable content and browser navigation. Native behavior remains intact; no unintended labeling is accepted. Do not “fix” failures by introducing the rejected diagonal recognizer.
4. Test repeated events/momentum and selecting another range during an old scroll tail. Each deliberate successful action commits exactly once to the expected label; incidental input must not label another range. Record limitations rather than claiming a portable physical gesture-end signal.
5. Cancel/interrupt the mobile action, change orientation/background the page, restore or finish with pending text, and destroy/remount. Pending data survives cancellation; no stale-target or late commit.
6. Undo/redo, use visible buttons and desktop Cmd/Ctrl shortcuts, and perform a targeted screen-reader pass for label names, selection/assignment announcements and usable focus. Repeat applicable tasks in both themes, with zoom and reduced motion.

Record every observed unintended commit, wrong label/quote, lost selection, scrolling interference, blocked navigation, inaccessible action and required coaching as a failure for that input. Do not invent time/satisfaction benchmarks or claim representative user research from a small prototype review.

## Done

- [ ] Required matrix rows pass with linked logs/notes and first-use observations; failures fixed/retested.
- [ ] Automated regressions and current CI pass; real-device evidence remains distinct.
- [ ] Seed, plan 07 historical status, 13 release gate, usage/help and verification/support claims match actual results. Unsupported combinations remain explicit.
