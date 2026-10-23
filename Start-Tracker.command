#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'Python 3 was not found. Install Python 3, then open this launcher again.'
  read -r -p 'Press Return to close. ' _tracker_close
  exit 1
fi
python3 scripts/manage.py start
_tracker_start=$?
if [ "$_tracker_start" -eq 0 ]; then
  python3 -c 'import json,webbrowser; from pathlib import Path; p=json.loads(Path(".local-data/runtime.json").read_text())["port"]; webbrowser.open("http://127.0.0.1:"+str(p)+"/")'
else
  exit "$_tracker_start"
fi
_tracker_exit=$?
if [ "$_tracker_exit" -ne 0 ]; then
  printf '\n%s\n' 'The tracker could not start. The error is shown above.'
  read -r -p 'Press Return to close. ' _tracker_close
fi
exit "$_tracker_exit"
