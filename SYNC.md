# Local-only data policy

This public repository contains generic application code and empty data templates. Never commit personal application records, email events, message hashes, spreadsheet IDs, Gmail labels, tokens, email addresses or local settings.

The local server reads private snapshots from `.local-data/`, an ignored directory. It serves only an explicit public asset allowlist and substitutes private JSON only for the local data endpoints. It binds to 127.0.0.1. The web app makes no requests to a shared GitHub data feed and does not upload data.

Browser edits stay in localStorage. Cloud automations must not write personal data to this repository. A daily sync must run on the user's computer using local authentication; do not enable a cloud-to-public-repo sync.
