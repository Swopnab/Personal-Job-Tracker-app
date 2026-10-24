"""Private manual edits shared by localhost browsers; no external services."""
import datetime
import json
import os
from pathlib import Path
import re
import tempfile
import threading
from urllib.parse import urlsplit

LOCK = threading.RLock()
STATUSES = {'Interested','Applied','Phone Screen','Technical Interview','Final Round','Offer Received','Accepted','Rejected','No Reply','Ghosted','Withdrawn'}


def validate(state):
    if not isinstance(state, dict) or not isinstance(state.get('items'), list) or len(state['items']) > 10000:
        raise ValueError('Expected up to 10,000 applications')
    rows, ids = [], set()
    for row in state['items']:
        if not isinstance(row, dict):
            raise ValueError('Invalid application')
        identity = row.get('id')
        if not isinstance(identity, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}', identity) or identity in ids:
            raise ValueError('Invalid or duplicate application ID')
        ids.add(identity)
        if row.get('status') not in STATUSES:
            raise ValueError('Invalid status')
        result = {'id': identity, 'status': row['status']}
        for key in ['company', 'jobTitle', 'notes', 'salary', 'location', 'term', 'requisition']:
            if key in row or key in ['company', 'jobTitle', 'notes', 'salary']:
                value = row.get(key, '')
                if not isinstance(value, str) or len(value) > (10000 if key == 'notes' else 500):
                    raise ValueError('Invalid ' + key)
                result[key] = value
        date = row.get('dateApplied', '')
        if date:
            if not isinstance(date, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
                raise ValueError('Invalid date')
            datetime.date.fromisoformat(date)
        result['dateApplied'] = date
        link = row.get('link', '')
        if not isinstance(link, str) or len(link) > 2048 or (link and urlsplit(link).scheme not in ['http', 'https']):
            raise ValueError('Invalid job link')
        result['link'] = link
        for key in ['updatedAt', 'createdAt', 'statusUpdatedAt']:
            if row.get(key):
                datetime.datetime.fromisoformat(row[key].replace('Z', '+00:00'))
                result[key] = row[key]
        if 'starred' in row:
            if type(row['starred']) is not bool:raise ValueError('Invalid saved flag')
            result['starred']=row['starred']
        if 'workArrangement' in row:
            if row['workArrangement'] not in ['', 'Unknown', 'Onsite', 'Hybrid', 'Remote']:
                raise ValueError('Invalid work arrangement')
            result['workArrangement'] = row['workArrangement']
        rows.append(result)
    deleted = state.get('deleted', [])
    if not isinstance(deleted, list) or len(deleted) > 20000 or any(not isinstance(x,str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}',x) for x in deleted):
        raise ValueError('Invalid deleted records')
    return {'items': rows, 'deleted': list(dict.fromkeys(deleted))}


def read(root):
    target = Path(root) / '.local-data/workspace.json'
    if not target.exists():
        return {'revision': 0, 'items': [], 'deleted': []}
    data = json.loads(target.read_text())
    validated = validate(data)
    return {**validated, 'revision': data['revision']}


def save(root, payload):
    data = validate(payload)
    with LOCK:
        current = read(root)
        if type(payload.get('revision')) is not int or payload['revision'] != current['revision']:
            raise FileExistsError('This tracker changed in another tab. Refresh before saving.')
        private = Path(root) / '.local-data'
        private.mkdir(mode=0o700, exist_ok=True)
        target = private / 'workspace.json'
        if target.exists():
            backups = Path(root) / '.local-backups'
            backups.mkdir(mode=0o700, exist_ok=True)
            stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
            backup = backups / ('workspace-' + stamp + '.json')
            backup.write_bytes(target.read_bytes())
            backup.chmod(0o600)
        result = {**data, 'revision': current['revision'] + 1}
        descriptor, temp = tempfile.mkstemp(dir=private, prefix='workspace-', suffix='.tmp')
        try:
            with os.fdopen(descriptor, 'w') as output:
                json.dump(result, output, ensure_ascii=False)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temp, target)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)
        return result
