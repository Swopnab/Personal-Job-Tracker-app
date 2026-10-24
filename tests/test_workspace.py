import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'scripts'))
import workspace
spec=importlib.util.spec_from_file_location('tracker_test_server',Path(__file__).resolve().parent.parent/'scripts/serve.py')
server_module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)

class PrivateWorkspace(unittest.TestCase):
    def test_atomic_save_revision_conflict_notes_and_validation(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            row={'id':'synthetic-1','company':'Example','jobTitle':'Intern','status':'Applied','notes':'Private prep','dateApplied':'2026-10-01','location':'Plano, TX','workArrangement':'Hybrid','requisition':'one','starred':True}
            first=workspace.save(root,{'revision':0,'items':[row],'deleted':[]})
            self.assertEqual(first['revision'],1)
            self.assertEqual(workspace.read(root)['items'][0]['notes'],'Private prep')
            with self.assertRaises(FileExistsError):workspace.save(root,{'revision':0,'items':[row]})
            before=(root/'.local-data/workspace.json').read_bytes()
            for bad in [{**row,'link':'javascript:alert(1)'},{**row,'status':'bad'},{**row,'dateApplied':'2026-02-30'},{**row,'notes':12}]:
                with self.assertRaises((ValueError,TypeError)):workspace.save(root,{'revision':1,'items':[bad]})
                self.assertEqual(before,(root/'.local-data/workspace.json').read_bytes())
            workspace.save(root,{'revision':1,'items':[{**row,'notes':''}],'deleted':['other']})
            self.assertEqual(workspace.read(root)['items'][0]['notes'],'')
            self.assertEqual(len(list((root/'.local-backups').glob('*.json'))),1)

    def test_http_allows_same_origin_and_rejects_foreign_writes_and_private_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            original=server_module.ROOT
            server_module.ROOT=Path(directory)
            server=server_module.ThreadingHTTPServer(('127.0.0.1',0),server_module.Handler)
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            url='http://127.0.0.1:'+str(server.server_port)
            def put(origin,content_type='application/json',revision=0):
                return urllib.request.urlopen(urllib.request.Request(url+'/api/workspace',data=json.dumps({'revision':revision,'items':[],'deleted':[]}).encode(),method='PUT',headers={'Content-Type':content_type,'Origin':origin}))
            try:
                with put(url) as response:self.assertEqual(json.load(response)['revision'],1)
                with urllib.request.urlopen(url+'/api/workspace') as response:self.assertEqual(json.load(response)['revision'],1)
                for origin,kind,code in [('https://foreign.invalid','application/json',403),(url,'text/plain',415),(url,'application/json',409)]:
                    with self.assertRaises(urllib.error.HTTPError) as error:put(origin,kind)
                    self.assertEqual(error.exception.code,code)
                with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(url+'/.local-data/workspace.json')
                self.assertEqual(error.exception.code,404)
            finally:
                server.shutdown();server.server_close();server_module.ROOT=original

if __name__=='__main__':unittest.main()
