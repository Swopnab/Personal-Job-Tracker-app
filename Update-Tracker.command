#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
python3 scripts/update.py
_tracker_exit=$?
if [ "$_tracker_exit" -ne 0 ]; then
  read -r -p 'Update stopped. Press Return to close. ' _tracker_close
fi
exit "$_tracker_exit"
