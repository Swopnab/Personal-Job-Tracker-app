#!/usr/bin/env python3
"""Serve a local tracker without exposing the working tree or credentials."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import json
import sys
import threading
import webbrowser
import importlib.util
_spec=importlib.util.spec_from_file_location("tracker_workspace",Path(__file__).with_name("workspace.py"))
workspace=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(workspace)
ROOT=Path(__file__).resolve().parent.parent
ASSETS={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','data.js':'text/javascript; charset=utf-8','sync.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','catalog.json':'application/json','applications.json':'application/json'}
class Handler(BaseHTTPRequestHandler):
 def allowed(self):
  host=urlsplit('http://'+self.headers.get('Host','')).hostname
  return host in ('127.0.0.1','localhost')
 def respond_json(self,data,status=200):
  body=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(body)
 def do_PUT(self):
  origin=self.headers.get('Origin')
  expected='http://'+self.headers.get('Host','')
  if not self.allowed() or (origin and origin!=expected):
   self.send_error(403);return
  if urlsplit(self.path).path!='/api/workspace':
   self.send_error(404);return
  if self.headers.get('Content-Type','').split(';')[0]!='application/json':
   self.send_error(415);return
  try:
   length=int(self.headers.get('Content-Length','0'))
   if not 0<length<=10*1024*1024:raise ValueError('Invalid request size')
   payload=json.loads(self.rfile.read(length))
   self.respond_json(workspace.save(ROOT,payload))
  except FileExistsError as error:self.respond_json({'detail':str(error)},409)
  except (ValueError,TypeError,KeyError):self.respond_json({'detail':'Invalid application data; existing records were kept.'},400)
  except OSError:self.respond_json({'detail':'Could not save local data. Please export a backup.'},500)
 def do_GET(self):
  if urlsplit('http://'+self.headers.get('Host','')).hostname not in ('127.0.0.1','localhost'):
   self.send_error(403);return
  name=urlsplit(self.path).path.lstrip('/') or 'index.html'
  if name=='api/workspace':
   try:self.respond_json(workspace.read(ROOT))
   except (OSError,ValueError,KeyError):self.respond_json({'detail':'Saved workspace could not be read; export your browser backup.'},500)
   return
  if name=='health.json':
   data=json.dumps({'tracker':str(ROOT)}).encode()
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
  if name not in ASSETS:
   self.send_error(404);return
  path=ROOT/name
  if name in ('catalog.json','applications.json') and (ROOT/'.local-data'/name).is_file():path=ROOT/'.local-data'/name
  try:data=path.read_bytes()
  except OSError:self.send_error(404);return
  self.send_response(200);self.send_header('Content-Type',ASSETS[name]);self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'");self.end_headers();self.wfile.write(data)
 def log_message(self,*args):pass
def main():
 parser=argparse.ArgumentParser(description='Run the tracker privately on this computer.')
 parser.add_argument('--port',type=int,default=8000,help='Preferred local port (default: 8000).')
 parser.add_argument('--open',action='store_true',help='Open the tracker in the default browser after startup.')
 parser.add_argument('--strict-port',action='store_true',help='Fail if the selected port is occupied, preserving the browser storage origin.')
 args=parser.parse_args()
 if not 0<=args.port<=65535:parser.error('port must be between 0 and 65535')
 server=None
 ports=[args.port] if args.strict_port else [0] if args.port==0 else range(args.port,min(args.port+10,65536))
 for port in ports:
  try:
   server=ThreadingHTTPServer(('127.0.0.1',port),Handler);break
  except OSError as exc:
   if exc.errno not in (48,98):
    print('Could not start the tracker: '+str(exc),file=sys.stderr);return 1
 if server is None:
  print('No free local port found. Try: python3 scripts/serve.py --port 8100 --open',file=sys.stderr);return 1
 url='http://127.0.0.1:'+str(server.server_port)+'/'
 print('Local tracker: '+url,flush=True)
 print('Keep this Terminal window open. Press Ctrl+C to stop.',flush=True)
 private=ROOT/'.local-data'
 if not (private/'applications.json').is_file():
  print('No private snapshot found. Use the local ZIP with its .local-data folder, or import a backup in the app.',flush=True)
 if args.open:
  threading.Timer(0.3,lambda:webbrowser.open(url)).start()
 try:server.serve_forever()
 except KeyboardInterrupt:print('\nTracker stopped.',flush=True)
 finally:server.server_close()
 return 0
if __name__=='__main__':sys.exit(main())
