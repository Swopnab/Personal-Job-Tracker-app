# Personal Job Tracker

A browser-local application tracker with inline editing, table and board views, search/filtering, follow-up reminders, bulk actions, and JSON backup/import. It has no backend, login, shared accounts, or cross-device synchronization.

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
