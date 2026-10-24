#!/usr/bin/env python3
"""Update a confirmed application locally; require an exact ID or unique company/role."""
import argparse
import datetime
import json
from pathlib import Path
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id')
    parser.add_argument('--company')
    parser.add_argument('--role')
    parser.add_argument('--status', required=True)
    parser.add_argument('--date', help='Actual application date, YYYY-MM-DD')
    args = parser.parse_args()
    if not args.id and not (args.company and args.role):
        parser.error('Supply --id or both --company and --role; ambiguous roles are never guessed.')
    runtime = json.loads((ROOT/'.local-data/runtime.json').read_text())
    origin = 'http://127.0.0.1:' + str(runtime['port'])
    def get(route):
        with urllib.request.urlopen(origin+route, timeout=10) as response:
            return json.load(response)
    workspace = get('/api/workspace')
    snapshot = get('/applications.json')
    catalog = get('/catalog.json')
    candidates = {row['id']:row for row in [*catalog['jobs'], *catalog['leads'], *catalog['restricted'], *snapshot['items'], *workspace['items']]}
    if args.id:
        matches = [candidates[args.id]] if args.id in candidates else []
    else:
        matches = [row for row in candidates.values() if row['company'].casefold()==args.company.casefold() and row['jobTitle'].casefold()==args.role.casefold()]
    if len(matches)!=1:
        raise ValueError('No unique role found. Supply the exact application ID from local records.')
    source=matches[0]
    if source['id'] in workspace.get('deleted',[]):
        raise ValueError('This role was deleted. Restore it explicitly before changing its status.')
    now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    row={key:source[key] for key in ['id','company','jobTitle','notes','salary','link','location','workArrangement','term','requisition','starred','createdAt'] if key in source}
    row.update(status=args.status,statusUpdatedAt=now,updatedAt=now,dateApplied=args.date or source.get('dateApplied',''))
    if args.status=='Applied' and not row['dateApplied']:
        row['dateApplied']=datetime.date.today().isoformat()
    # Respect existing local notes when a mail snapshot has no notes of its own.
    existing=next((r for r in workspace['items'] if r['id']==row['id']),None)
    if existing is not None:row['notes']=existing.get('notes','')
    workspace['items']=[r for r in workspace['items'] if r['id']!=row['id']]+[row]
    request=urllib.request.Request(origin+'/api/workspace',data=json.dumps(workspace).encode(),headers={'Content-Type':'application/json','Origin':origin},method='PUT')
    with urllib.request.urlopen(request,timeout=10):pass
    print('Updated '+row['company']+' — '+row['jobTitle']+' to '+args.status+'. Refresh the tracker.')

if __name__=='__main__':
    try:main()
    except Exception as error:
        print('Status update stopped: '+str(error),file=sys.stderr)
        sys.exit(1)
