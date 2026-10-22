# Nextstep · Local Job Tracker

A clean, responsive job tracker. The public repository contains code and empty data templates. Your job records, research, recruiter contacts, email updates and credentials stay on your device.

## Run locally

On macOS, double-click `Start-Tracker.command`. It starts the local server and opens your browser. Keep its Terminal window open while using the tracker.

Or run it from the extracted project folder with Python 3:

```sh
python3 scripts/serve.py --open
```

Use the address printed in Terminal. It normally uses http://127.0.0.1:8000/ and automatically picks the next port if that one is occupied. Opening a localhost URL alone does not start the app. Optional Node tools: `npm ci`, `npm test`, `npm run build`. The build contains only empty public templates, never `.local-data`.

## Private data

Place private `applications.json` and `catalog.json` snapshots inside `.local-data/`. The folder is ignored by Git. The local server reads them at runtime; tracked root JSON files remain empty. The server binds only to localhost and serves a fixed asset allowlist. Do not expose it through a tunnel or public server.

An empty public deployment is safe to use: browser edits and imports stay in that browser. JSON import/export supports application backups. The local private snapshot is never included in a production build.

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
