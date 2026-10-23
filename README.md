# Nextstep · Local Job Tracker

A clean, responsive job tracker. The public repository contains code and empty data templates. Your job records, research, recruiter contacts, email updates and credentials stay on your device.

## Run locally

On macOS, double-click `Start-Tracker.command`. It starts the managed local server and opens your browser. The server continues running after the launcher closes.

Or run it from the extracted project folder with Python 3:

```sh
python3 scripts/serve.py --open
```

Use the address printed in Terminal. It normally uses http://127.0.0.1:8000/ and automatically picks the next port if that one is occupied. Opening a localhost URL alone does not start the app. Optional Node tools: `npm ci`, `npm test`, `npm run build`. The build contains only empty public templates, never `.local-data`.

## Private data

Place private `applications.json` and `catalog.json` snapshots inside `.local-data/`. The folder is ignored by Git. The local server reads them at runtime; tracked root JSON files remain empty. The server binds only to localhost and serves a fixed asset allowlist. Do not expose it through a tunnel or public server.

Use this personal tracker locally. JSON import/export supports application backups. The local private snapshot is never included in a build; no hosted deployment is configured.

## Features

Applications, research lists, recruiter contacts, email update history, job details, CPT evidence filters, search, board/list views, follow-ups, bulk updates and browser-local notes.

Green = not applied, yellow = applied, red = rejected, pink = interview, teal = offer/accepted, purple = other/waiting. Status text accompanies every color.

## Email updates

Cloud-to-GitHub email syncing is disabled. Personal email records must never be committed here. A local daily sync requires authentication on the device where it runs. See SYNC.md for the privacy policy.

## Tests

```sh
npm ci
npx playwright install chromium --only-shell --with-deps
npm test
```

The test suite uses synthetic fixtures, validates empty public templates and checks safe imports, merge precedence, local persistence and responsive layouts.

## Tested local updates (no hosted deployment)

Run `npm run start:local` to start the managed localhost server at the stable address http://127.0.0.1:8000/. Use `npm run restart:local`, `npm run stop:local`, or `python3 scripts/manage.py status` to manage it. An occupied port produces an actionable error instead of moving your browser notes to a different origin. Keep using the same hostname and port. Existing manually started servers must first be stopped in their Terminal window.

Double-click `Update-Tracker.command` or run `npm run update:local` from a clean `main` checkout. The updater fetches this repository's main branch, requires successful **Tracker CI** on that exact commit, and runs the tests and build in a separate code-only staging directory. It refuses local edits, divergent history and unexpected remotes. It backs up `.local-data` into ignored `.local-backups`, fast-forwards the code, restarts the managed server at the same address, and checks its health. A startup failure restores the previous code with `git reset --keep` and restarts it. No private folder is deleted or overwritten by an update. Refresh the sidebar after completion. Close unsaved edit dialogs before updating; browser storage and notes stay in the same browser profile.

Requirements: Git, Node/npm, Python 3, Internet access to GitHub/npm and Playwright Chromium. GitHub API failures, rate limits or pending/failed CI stop the update without changing the installed code. This is CI plus an explicitly invoked local delivery command; no cloud deployment or self-hosted GitHub runner is installed. The workflow uploads no data, screenshots or build artifacts. The privacy guard catches private tracked paths and recognizable credential formats; always review staged source changes as well.

## Import reviewed Gmail updates locally

“Scan Gmail” means read application-related mail through the connected Gmail tools, normalize confirmed updates, import on this device, then refresh and verify the site. It is not a background scan. The CLI itself does not authenticate to Gmail and needs no saved token. A reviewed input file is a JSON array of `{messageId, at, summary, application}`; `application` follows the existing application schema. `at` is the email timestamp, and `summary` is a short decision/update description, never raw mail. Store the file only in `.local-data/` and run:

```sh
npm run import:mail -- .local-data/reviewed-updates.json
```

The importer validates the entire batch, deduplicates by SHA-256 Gmail message ID, merges exact company/role matches with existing application IDs, preserves notes and newer manual statuses, records one event per new message, backs up the previous snapshot and writes atomically. Use the existing exact ID for known roles; confirm ambiguous or distinct requisitions manually. Raw Gmail IDs are not saved in the snapshot. Refresh the sidebar to load new updates. See AGENTS.md for the standing local-update and scan workflows.
