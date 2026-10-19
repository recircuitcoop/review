# Repository and native platform verification

Repository: **public** `recircuitcoop/review` (user-created).
Configured origin: `https://github.com/recircuitcoop/review.git`.

Local Git is initialized on `main`, with no commits yet. The user authenticated successfully as `mtllr` and created the remote from an unrestricted terminal. This agent session still cannot create `.git/index.lock` (`Operation not permitted`) or reach `api.github.com`. No agent commit, push, or passing CI run is claimed.

## First push from an unrestricted terminal

Review the pending files with `git status --short`. The ignore file excludes dependencies and generated test results; bundled offline deliverables are intentionally included. The initial snapshot contains the locally verified core plus in-progress export/reopen changes. Plans 14–16 are not signed off, and feature work is paused until the Git/CI gate is resolved.

```sh
cd ~/git/review
npm test
npm run build
git add .
git commit -m "feat: add local Markdown review application"
git push -u origin main
gh run list --repo recircuitcoop/review --workflow review.yml
```

If the remote already contains commits, fetch and inspect its history before resolving the divergence. Do not force-push over it.

The [GitHub Actions workflow](../.github/workflows/review.yml) runs on pushes to main and pull requests, and supports manual runs. Its nine jobs cover Windows/Linux/macOS × Chromium/Firefox/WebKit, with Node 22, dependency installation, unit tests, builds, browser tests and failure traces. No deployment is configured.

Inspect the actual run and failing jobs:

```sh
gh run watch --repo recircuitcoop/review <run-id>
gh run view --repo recircuitcoop/review <run-id> --log-failed
```

A successful browser matrix supplies platform-engine results, not complete native OS-shortcut or screen-reader proof. Plan 13 remains open until all required evidence is recorded. See [verification](VERIFICATION.md).
