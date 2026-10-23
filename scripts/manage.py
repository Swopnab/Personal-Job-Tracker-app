#!/usr/bin/env python3
"""Manage only this checkout's localhost server, keeping a stable browser origin."""
import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
PRIVATE = ROOT / '.local-data'
STATE = PRIVATE / 'runtime.json'
SERVER = str(ROOT / 'scripts/serve.py')
_CHILDREN = {}


def read_state():
    try:
        return json.loads(STATE.read_text())
    except (OSError, ValueError):
        return {}


def owns_process(state):
    pid = state.get('pid')
    if not isinstance(pid, int) or pid <= 1:
        return False
    result = subprocess.run(['ps', '-p', str(pid), '-o', 'command='], capture_output=True, text=True)
    return result.returncode == 0 and SERVER in result.stdout and '--strict-port' in result.stdout


def healthy(port):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/health.json', timeout=2) as response:
            return json.load(response).get('tracker') == str(ROOT)
    except (OSError, ValueError):
        return False


def stop():
    state = read_state()
    if owns_process(state):
        os.kill(state['pid'], signal.SIGTERM)
        for _ in range(50):
            if not owns_process(state):
                break
            time.sleep(.1)
        else:
            raise RuntimeError('Tracker did not stop; no other process was killed.')
    child = _CHILDREN.pop(state.get('pid'), None)
    if child is not None:
        child.wait(timeout=5)
    STATE.unlink(missing_ok=True)


def start(port=None):
    state = read_state()
    port = port or state.get('port', 8000)
    if owns_process(state) and healthy(state['port']):
        return state['port']
    if owns_process(state):
        raise RuntimeError('Existing tracker is unhealthy. Run npm run restart:local.')
    PRIVATE.mkdir(mode=0o700, exist_ok=True)
    with (PRIVATE / 'server.log').open('ab') as log:
        process = subprocess.Popen([sys.executable, SERVER, '--port', str(port), '--strict-port'],
                                   cwd=ROOT, stdout=log, stderr=log, start_new_session=True)
    for _ in range(80):
        if process.poll() is not None:
            raise RuntimeError('Startup failed. Check .local-data/server.log. The port may be occupied; no existing process was stopped.')
        if healthy(port):
            _CHILDREN[process.pid] = process
            STATE.write_text(json.dumps({'pid': process.pid, 'port': port}))
            STATE.chmod(0o600)
            return port
        time.sleep(.1)
    process.terminate()
    process.wait(timeout=5)
    raise RuntimeError('Startup timed out; see .local-data/server.log.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'stop', 'restart', 'status'])
    parser.add_argument('--port', type=int)
    args = parser.parse_args()
    if args.action == 'status':
        state = read_state()
        if not owns_process(state) or not healthy(state.get('port', 8000)):
            raise RuntimeError('Managed tracker is not running.')
        port = state['port']
    elif args.action == 'stop':
        stop()
        print('Local tracker stopped.')
        return
    else:
        port = args.port or read_state().get('port', 8000)
        if args.action == 'restart':
            stop()
        port = start(port)
    print(f'Local tracker: http://127.0.0.1:{port}/')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
