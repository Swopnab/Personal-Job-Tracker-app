#!/usr/bin/env node
// Local-only HTTP server with an explicit asset allowlist and private workspace API.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{parseArgs}=require('node:util'),{spawn}=require('node:child_process');
const workspace=require('./workspace.cjs');
const ROOT=path.resolve(__dirname,'..');
const ASSETS={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','data.js':'text/javascript; charset=utf-8','sync.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','catalog.json':'application/json','applications.json':'application/json'};
function sendJson(response,value,status=200){const data=Buffer.from(JSON.stringify(value));response.writeHead(status,{'Content-Type':'application/json','Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(data);}
function createTrackerServer(root=ROOT,{owner=''}={}){
 root=fs.realpathSync(root);
 return http.createServer((request,response)=>{
  const host=request.headers.host||'';let hostname,route;
  try{hostname=new URL('http://'+host).hostname;route=new URL(request.url,'http://localhost').pathname;}catch{return sendJson(response,{detail:'Invalid request'},400);}
  if(!['127.0.0.1','localhost'].includes(hostname))return sendJson(response,{detail:'Local hosts only'},403);
  if(request.method==='PUT'){
   if(request.headers.origin&&request.headers.origin!=='http://'+host)return sendJson(response,{detail:'Origin rejected'},403);
   if(route!=='/api/workspace')return sendJson(response,{detail:'Not found'},404);
   if((request.headers['content-type']||'').split(';')[0]!=='application/json')return sendJson(response,{detail:'JSON required'},415);
   const size=Number(request.headers['content-length']);
   if(!Number.isSafeInteger(size)||size<=0||size>10*1024*1024)return sendJson(response,{detail:'Invalid request size'},400);
   const chunks=[];let received=0;
   request.on('data',chunk=>{received+=chunk.length;if(received>10*1024*1024){request.destroy();return;}chunks.push(chunk);});
   request.on('end',()=>{
    try{if(received!==size)throw Error('Invalid body');sendJson(response,workspace.save(root,JSON.parse(Buffer.concat(chunks).toString('utf8'))));}
    catch(error){sendJson(response,{detail:error.status===409?error.message:'Invalid or unavailable local data; existing records were kept.'},error.status||400);}
   });return;
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return sendJson(response,{detail:'Method not allowed'},405);
  if(route==='/health.json')return sendJson(response,{tracker:root,runtime:'node',owner});
  if(route==='/api/workspace'){
   try{return sendJson(response,workspace.read(root));}catch{return sendJson(response,{detail:'Saved workspace could not be read. Export a backup before editing.'},500);}
  }
  const name=route==='/'?'index.html':route.slice(1);
  if(!Object.hasOwn(ASSETS,name))return sendJson(response,{detail:'Not found'},404);
  let file=path.join(root,name);
  if(['applications.json','catalog.json'].includes(name)&&fs.existsSync(path.join(root,'.local-data',name)))file=path.join(root,'.local-data',name);
  try{
   const data=fs.readFileSync(file);response.writeHead(200,{'Content-Type':ASSETS[name],'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});response.end(request.method==='HEAD'?undefined:data);
  }catch{sendJson(response,{detail:'Not found'},404);}
 });
}
function listen(server,port){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve(server.address().port);});});}
function openBrowser(url){if(process.platform==='darwin')spawn('open',[url],{stdio:'ignore',detached:true}).unref();else console.log('Open '+url+' in your browser.');}
async function main(args=process.argv.slice(2)){
 const {values}=parseArgs({args,options:{port:{type:'string',default:'8000'},'strict-port':{type:'boolean',default:false},open:{type:'boolean',default:false},owner:{type:'string',default:''}}});
 const preferred=Number(values.port);if(!Number.isInteger(preferred)||preferred<0||preferred>65535)throw Error('Port must be between 0 and 65535.');
 const ports=values['strict-port']||preferred===0?[preferred]:Array.from({length:Math.min(10,65536-preferred)},(_,i)=>preferred+i);
 let server,port;
 for(const candidate of ports){server=createTrackerServer(ROOT,{owner:values.owner});try{port=await listen(server,candidate);break;}catch(error){server.close();if(error.code!=='EADDRINUSE')throw error;server=null;}}
 if(!server)throw Error('The selected local port is occupied. Stop the existing tracker before restarting; no unrelated process was stopped.');
 console.log(`Local tracker: http://127.0.0.1:${port}/`);
 console.log('Private local server · Node.js. Press Ctrl+C to stop.');
 if(values.open)openBrowser(`http://127.0.0.1:${port}/`);
 const shutdown=()=>{server.close(()=>process.exit(0));server.closeIdleConnections();setTimeout(()=>{server.closeAllConnections();process.exit(0);},3000).unref();};
 process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
 return server;
}
module.exports={ROOT,createTrackerServer,listen,main,openBrowser};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
