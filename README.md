# Nextstep · Local Job Tracker

Plain HTML, CSS and JavaScript. Node.js runs the local server, persistence, launch commands and tests. There is no frontend framework, build framework, external database or hosted personal tracker.

## Run locally

Install Node.js 22 or newer. On macOS, double-click `Start-Tracker.command`, or run:

```sh
npm run start:local
```

Open http://127.0.0.1:8000/. The managed server keeps running when the launcher closes. Keep this address unchanged to preserve browser storage. If its port is occupied by another process, startup stops with an error instead of moving your notes to a different origin.

```sh
npm run restart:local
npm run stop:local
node scripts/manage.cjs status
```

`npm start` runs the server in the foreground. `node scripts/serve.cjs --port 8100 --strict-port` explicitly chooses another address. Node is the only application runtime requirement; Playwright and npm dependencies are development tools.

## Private data and editing

The public repository contains generic code, synthetic tests and empty root JSON templates. Private `applications.json`, `catalog.json` and `workspace.json` belong in ignored `.local-data/`. Backups stay in ignored `.local-backups/`. Never commit either directory, mail records, credentials, tokens or personal exports.

The server binds only to 127.0.0.1 and serves a fixed asset allowlist. Its `/api/workspace` endpoint stores manual statuses, notes, saved stars, deletion tombstones, and location/term edits atomically on this computer. Previous revisions are backed up; stale browser writes receive HTTP 409. Browser writes require same-origin JSON. Private file paths and source files cannot be fetched through the server. A standalone static copy falls back to browser storage.

Explore shows reviewed, not-yet-applied internships. My applications contains confirmed applications. Less-used research/archive views are under More. Search and filters cover status, city/region, work arrangement, role focus, term, saved roles and authorization evidence. Unknown authorization is not represented as CPT approval. Private catalog metadata can hold a sourced university-policy notice and resume-matching notes.

Status colors: lighter green not applied, yellow applied, pink interviews, red rejected, and green offers/accepted. Status text accompanies the colors. Opening an employer posting never marks it Applied automatically.

## Checks

```sh
npm ci
npx playwright install chromium --only-shell --with-deps
npm test
npm run build
```

Tests are JavaScript: data validation, safe imports, message deduplication, merge precedence, location classification, local server privacy, revision conflicts, restart preservation, responsive layouts, and persistence across isolated browser sessions. They use synthetic records. Builds include only empty public templates and never private data. Review staged files as well as running the privacy guard; pattern checks cannot recognize every possible personal record.

## Safe local updates

Double-click `Update-Tracker.command` or run `npm run update:local` from a clean main checkout. Git, curl and npm are needed for updates. The command fetches this repository's main branch, requires successful Tracker CI on that exact commit, tests and builds a code-only candidate, backs up `.local-data`, fast-forwards code, restarts at the same address and checks health. It reuses the installed test browser when available. Failed startup restores the prior code with `git reset --keep` and restarts it. Local edits, divergent history, an unexpected remote, pending/failed CI, or network errors stop delivery without discarding private files.

The updater never deploys a hosted site or copies private records into CI. GitHub Actions runs source checks and uploads no build/data/screenshot artifacts. Refresh your open tracker after delivery; close unsaved edit forms first. If an update lock remains after a crash, confirm that no update is running before removing `.local-data/update-node.lock`.

## Gmail updates on request

Use connected Gmail read/search tools to review application-related messages. The site embeds no Gmail credentials and performs no unattended mail polling. “Scan Gmail” means review actual mail, import confirmed updates locally, refresh and verify. Ambiguous company/role matches must be resolved rather than guessed.

Store a reviewed JSON array of `{messageId, at, summary, application}` in `.local-data/` and run:

```sh
npm run import:mail -- .local-data/reviewed-updates.json
```

The importer validates the whole batch, deduplicates Gmail message IDs by SHA-256, preserves notes and newer manual statuses, and writes atomically with backups. Repeated scans update the check time without duplicating events. Raw emails are not stored by the importer. Known distinct requisitions remain separate.

After a user-confirmed application or decision:

```sh
npm run mark -- --id exact-application-id --status Applied --date 2027-01-15
```

Alternatively supply both `--company` and `--role` for an exact unique match. This JavaScript command talks only to the running localhost API. It does not submit applications or contact an employer. Refresh the tracker after it succeeds. See AGENTS.md for standing research and update workflows.
