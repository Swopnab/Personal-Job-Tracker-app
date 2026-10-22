const {test}=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('local server substitutes private data and denies source, credentials and foreign hosts',()=>{
const result=execFileSync('python3',['-c',`
import importlib.util,tempfile,pathlib,json,threading,urllib.request,urllib.error
spec=importlib.util.spec_from_file_location('local_server','scripts/serve.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as d:
 m.ROOT=pathlib.Path(d);(m.ROOT/'.local-data').mkdir();(m.ROOT/'applications.json').write_text('{"items":[]}');(m.ROOT/'.local-data/applications.json').write_text('{"items":[{"company":"PRIVATE_FIXTURE"}]}');(m.ROOT/'.env').write_text('SECRET_FIXTURE');(m.ROOT/'index.html').write_text('<h1>Fixture</h1>')
 server=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url='http://127.0.0.1:'+str(server.server_port)
 assert json.load(urllib.request.urlopen(url+'/applications.json'))['items'][0]['company']=='PRIVATE_FIXTURE'
 for route in ['/.local-data/applications.json','/.env','/.git/config','/../.local-data/applications.json','/scripts/serve.py']:
  try:urllib.request.urlopen(url+route);raise AssertionError('private route leaked')
  except urllib.error.HTTPError as e:assert e.code==404
 try:urllib.request.urlopen(urllib.request.Request(url+'/applications.json',headers={'Host':'external.invalid'}));raise AssertionError('foreign host accepted')
 except urllib.error.HTTPError as e:assert e.code==403
 server.shutdown();server.server_close()
print('PASS')
`],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});assert.match(result,/PASS/);
});
