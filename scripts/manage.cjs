#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn,execFileSync}=require('node:child_process'),{parseArgs}=require('node:util');
const {ROOT,openBrowser}=require('./serve.cjs');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function createManager(root=ROOT){
 root=fs.realpathSync(root);const privateDir=path.join(root,'.local-data'),stateFile=path.join(privateDir,'runtime.json'),serverFile=path.join(root,'scripts/serve.cjs');
 function readState(){try{return JSON.parse(fs.readFileSync(stateFile,'utf8'));}catch{return {};}}
 function ownsProcess(state){
  if(!Number.isSafeInteger(state.pid)||state.pid<=1||typeof state.owner!=='string'||!/^[a-f0-9]{32}$/.test(state.owner))return false;
  try{const command=execFileSync('ps',['-p',String(state.pid),'-o','command='],{encoding:'utf8',stdio:['ignore','pipe','ignore']});return command.includes(serverFile)&&command.includes('--strict-port')&&command.includes('--owner '+state.owner);}catch{return false;}
 }
 async function healthy(port,owner){try{const response=await fetch(`http://127.0.0.1:${port}/health.json`,{signal:AbortSignal.timeout(2000)});const info=await response.json();return response.ok&&info.tracker===root&&info.runtime==='node'&&(!owner||info.owner===owner);}catch{return false;}}
 async function stop(){
  const state=readState();if(ownsProcess(state)){
   process.kill(state.pid,'SIGTERM');
   for(let i=0;i<60;i++){if(!ownsProcess(state))break;if(i===59)throw Error('Tracker did not stop; no other process was killed.');await sleep(100);}
  }
  fs.rmSync(stateFile,{force:true});
 }
 async function start(port){
  const state=readState();port=port??state.port??8000;
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('Choose a stable local port between 1 and 65535.');
  if(ownsProcess(state)){if(await healthy(state.port,state.owner))return state.port;throw Error('Existing tracker is unhealthy. Run npm run restart:local.');}
  fs.mkdirSync(privateDir,{recursive:true,mode:0o700});const owner=crypto.randomBytes(16).toString('hex'),log=fs.openSync(path.join(privateDir,'server.log'),'a',0o600);
  const child=spawn(process.execPath,[serverFile,'--port',String(port),'--strict-port','--owner',owner],{cwd:root,detached:true,stdio:['ignore',log,log]});fs.closeSync(log);child.unref();let spawnError;child.once('error',error=>{spawnError=error;});
  for(let i=0;i<80;i++){
   if(spawnError||child.exitCode!==null)throw Error('Startup failed. Check .local-data/server.log; the port may be occupied.');
   if(await healthy(port,owner)){fs.writeFileSync(stateFile,JSON.stringify({pid:child.pid,port,owner}),{mode:0o600});fs.chmodSync(stateFile,0o600);return port;}
   await sleep(100);
  }
  try{process.kill(child.pid,'SIGTERM');}catch{}throw Error('Startup timed out. Check .local-data/server.log.');
 }
 return {root,privateDir,readState,ownsProcess,healthy,start,stop};
}
async function main(args=process.argv.slice(2)){
 const {values,positionals}=parseArgs({args,allowPositionals:true,options:{port:{type:'string'},open:{type:'boolean',default:false}}});const action=positionals[0]||'start';
 if(!['start','stop','restart','status'].includes(action))throw Error('Use start, stop, restart or status.');
 const manager=createManager();let port=values.port===undefined?manager.readState().port??8000:Number(values.port);
 if(action==='stop'){await manager.stop();console.log('Local tracker stopped.');return;}
 if(action==='status'){const state=manager.readState();if(!manager.ownsProcess(state)||!await manager.healthy(state.port,state.owner))throw Error('Managed tracker is not running.');port=state.port;}
 else{if(action==='restart')await manager.stop();port=await manager.start(port);}
 const url=`http://127.0.0.1:${port}/`;console.log('Local tracker: '+url);if(values.open)openBrowser(url);
}
module.exports={createManager,main};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
