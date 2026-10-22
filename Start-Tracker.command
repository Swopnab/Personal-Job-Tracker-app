#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'Python 3 was not found. Install Python 3, then open this launcher again.'
  read -r -p 'Press Return to close. ' _tracker_close
  exit 1
fi
python3 scripts/serve.py --open
_tracker_exit=$?
if [ "$_tracker_exit" -ne 0 ]; then
  printf '\n%s\n' 'The tracker could not start. The error is shown above.'
  read -r -p 'Press Return to close. ' _tracker_close
fi
exit "$_tracker_exit"
