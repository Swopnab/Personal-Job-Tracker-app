#!/usr/bin/env python3
"""Serve a local tracker without exposing the working tree or credentials."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import json
ROOT=Path(__file__).resolve().parent.parent
ASSETS={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','data.js':'text/javascript; charset=utf-8','sync.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','catalog.json':'application/json','applications.json':'application/json'}
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  name=urlsplit(self.path).path.lstrip('/') or 'index.html'
  if name not in ASSETS:
   self.send_error(404);return
  path=ROOT/name
  if name in ('catalog.json','applications.json') and (ROOT/'.local-data'/name).is_file():path=ROOT/'.local-data'/name
  try:data=path.read_bytes()
  except OSError:self.send_error(404);return
  self.send_response(200);self.send_header('Content-Type',ASSETS[name]);self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'");self.end_headers();self.wfile.write(data)
 def log_message(self,*args):pass
if __name__=='__main__':
 print('Local tracker: http://127.0.0.1:8000 (Ctrl+C to stop)',flush=True)
 ThreadingHTTPServer(('127.0.0.1',8000),Handler).serve_forever()
