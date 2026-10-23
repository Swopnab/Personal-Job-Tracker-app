#!/usr/bin/env python3
"""Install a CI-tested main commit locally without touching private records."""
import datetime
import fcntl
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import urllib.request

import manage
ROOT = manage.ROOT
REPOSITORY = 'Swopnab/Personal-Job-Tracker-app'
REMOTE = 'https://github.com/' + REPOSITORY + '.git'


def run(*args, cwd=ROOT):
    subprocess.run(args, cwd=cwd, check=True)


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def require_clean():
    if git('status', '--porcelain', '--untracked-files=normal'):
        raise RuntimeError('Local code changes found. Commit/review them first; the updater never stashes or discards your work.')
    if git('symbolic-ref', '--short', 'HEAD') != 'main':
        raise RuntimeError('Switch to main after saving your changes before updating.')


def require_ci(sha):
    url = f'https://api.github.com/repos/{REPOSITORY}/actions/workflows/ci.yml/runs?head_sha={sha}&event=push&per_page=100'
    request = urllib.request.Request(url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'local-job-tracker'})
    with urllib.request.urlopen(request, timeout=30) as response:
        runs = json.load(response)['workflow_runs']
    runs = sorted((r for r in runs if r['head_sha'] == sha and r['head_branch'] == 'main'),
                  key=lambda r: (r['run_number'], r.get('run_attempt', 1)), reverse=True)
    if not runs or runs[0]['status'] != 'completed' or runs[0]['conclusion'] != 'success':
        raise RuntimeError('The newest main commit has no successful completed CI run. Local code and running tracker were left unchanged.')


def update():
    require_clean()
    if git('remote', 'get-url', 'origin') != REMOTE:
        raise RuntimeError('Unexpected origin. Expected ' + REMOTE)
    run('git', 'fetch', 'origin', 'main')
    sha, previous = git('rev-parse', 'FETCH_HEAD'), git('rev-parse', 'HEAD')
    require_ci(sha)
    run('git', 'merge-base', '--is-ancestor', previous, sha)
    # Candidate checks never receive private data or the live browser profile.
    with tempfile.TemporaryDirectory(prefix='tracker-candidate-') as directory:
        candidate = Path(directory) / 'code'
        run('git', 'clone', '--quiet', '--no-hardlinks', str(ROOT), str(candidate))
        run('git', 'checkout', '--quiet', '--detach', sha, cwd=candidate)
        run('npm', 'ci', cwd=candidate)
        run('npx', 'playwright', 'install', 'chromium', '--only-shell', cwd=candidate)
        run('npm', 'test', cwd=candidate)
        run('npm', 'run', 'build', cwd=candidate)
    require_clean()
    if git('rev-parse', 'HEAD') != previous:
        raise RuntimeError('Checkout changed during validation. Please retry.')
    # Disk snapshots are backed up before installation. Browser storage is kept by
    # leaving its profile and exact localhost origin intact.
    port = manage.read_state().get('port', 8000)
    backup = ROOT / '.local-backups' / datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup.mkdir(mode=0o700, parents=True)
    if manage.PRIVATE.exists():
        shutil.copytree(manage.PRIVATE, backup / '.local-data')
    (backup / 'code-revision.txt').write_text(previous + '\n')
    run('git', 'merge', '--ff-only', sha)
    try:
        manage.stop()
        manage.start(port)
        if not manage.healthy(port):
            raise RuntimeError('Tracker health check failed.')
    except Exception:
        manage.stop()
        run('git', 'reset', '--keep', previous)
        manage.start(port)
        raise RuntimeError('New code failed to start; previous code was restored and restarted. Private data was preserved.')
    print(f'Updated to {sha[:12]}. Verified http://127.0.0.1:{port}/')
    print('Refresh the sidebar tab to load the new code. Private backup: ' + str(backup))


if __name__ == '__main__':
    try:
        manage.PRIVATE.mkdir(mode=0o700, exist_ok=True)
        with (manage.PRIVATE / 'update.lock').open('w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            update()
    except Exception as error:
        print('Update stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
