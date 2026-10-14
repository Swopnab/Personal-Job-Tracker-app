# Personal Job Tracker

A responsive personal job tracker with a light green workspace, application summaries, a focused add/edit dialog, list and board views, search/stage filters, sorting, follow-ups, bulk actions, and JSON backup/import. It has no backend, login, shared accounts, or cross-device synchronization.

## Run and verify

```sh
npm ci
npx playwright install chromium --only-shell
npm start
# In another terminal:
npm test
```

Open http://127.0.0.1:8000. Node 24 LTS runs the tests; Python 3 serves the standalone app. Playwright is free and development-only. CI checks the same unit and browser suite.

## Data boundaries

Applications are saved under `jobTrackerApplications` in this origin’s localStorage. Export a JSON backup before switching devices or clearing browser data. Imports replace the current list only after the entire file validates; invalid files keep existing applications. Limits: 10 MB per file, 10,000 rows, unique alphanumeric/underscore/hyphen IDs, known statuses, real calendar dates, HTTP/HTTPS links, and bounded text fields. Legacy ISO application dates normalize to YYYY-MM-DD. Unknown fields are dropped.

Imported and edited text is escaped in the dashboard, table and board; links cannot use executable schemes. Every supported status has a board column. Follow-up counts use local calendar days; future dates do not become overdue through an absolute-time calculation. Bulk-action notifications retain the actual selected count.

If browser storage is blocked or full, the app keeps the current tab usable and warns that changes may not persist. Export before closing. Corrupt saved data is not automatically overwritten during startup.

Tests cover CRUD and reload persistence, valid/invalid imports, literal HTML payloads, unsafe links/IDs, statuses, date boundaries, bulk deletion counts, responsive modals, and blocked/corrupt storage. Browser tests use synthetic data and do not establish support for every real device.

## Next evaluation

Ask consenting student testers to add, update, find and export a few applications. Record task completion, failures and feedback without collecting their private application data. Keep this as a focused local tracker; the more complex application workflow lives in WorkLikeADog (`Swopnab/worklikejeff`).

## Redesigned workspace

Add an application with the main button or Cmd/Ctrl+K. Use the pencil button to edit all details, including dates, salary and notes. Search also matches notes; sort by recent changes, company or applied date. Follow-ups show only Applied/No Reply records dated at least 14 calendar days ago. No reminders are sent externally.

The list becomes compact application cards on phones. The board scrolls within its panel and includes all 11 stages; a stage dropdown lets touch and keyboard users move cards without dragging. Native dialogs provide keyboard focus containment, Escape-to-close and focus restoration. Import asks before replacing existing data. Existing browser storage and old JSON exports remain compatible.

The same UI is integrated into [WorkLikeADog](https://github.com/Swopnab/worklikejeff) under Job Tracker. There it uses the Python app's local SQLite database and can copy application history without changing preparation/submission states. The standalone app and public Pages demo remain browser-local; export/import a backup to move between these modes. They share the original storage key when served from the same browser origin.

No new runtime dependency or paid service was added. Tests exercise 390px, 768px and 1440px synthetic browser layouts; physical device testing remains separate.
