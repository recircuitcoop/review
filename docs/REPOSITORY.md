# Repository and native platform verification

Repository: **public** `recircuitcoop/review` (user-created).
Configured origin: `https://github.com/recircuitcoop/review.git`.

The user initialized Git and pushed `df33471`. This agent published `634796e` (file-opening fix) and `e828842` (rebuilt offline app) through the authenticated GitHub browser. [CI run 3](https://github.com/recircuitcoop/review/actions/runs/39318606377) passed all nine jobs.

Shell GitHub connectivity and Git metadata writes remain blocked in this agent session. The local branch/tracking ref still shows `df33471` until an unrestricted fetch; new source, tests, theme and documentation changes remain local and uncommitted. The subsequent expanded acceptance suite has not yet been published or run in CI.

Use ordinary fetch/pull from an unrestricted terminal to synchronize, preserving local changes first. Do not force-push over the browser commits or discard unpublished work.

The [GitHub Actions workflow](../.github/workflows/review.yml) runs on pushes to main and pull requests, and supports manual runs. Its nine jobs cover Windows/Linux/macOS × Chromium/Firefox/WebKit, with Node 22, dependency installation, unit tests, builds, browser tests and failure traces. No deployment is configured.

Inspect the actual run and failing jobs:

```sh
gh run watch --repo recircuitcoop/review <run-id>
gh run view --repo recircuitcoop/review <run-id> --log-failed
```

A successful browser matrix supplies platform-engine results, not complete native OS-shortcut or screen-reader proof. Plan 13 remains open until all required evidence is recorded. See [verification](VERIFICATION.md).
