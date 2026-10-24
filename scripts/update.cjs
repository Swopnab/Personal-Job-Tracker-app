#!/usr/bin/env node
// Install only a successful CI-tested main commit; private data stays on this computer.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync,execFileSync}=require('node:child_process');
const {createManager}=require('./manage.cjs'),{ROOT}=require('./serve.cjs');
const REPOSITORY='Swopnab/Personal-Job-Tracker-app',REMOTE=`https://github.com/${REPOSITORY}.git`;
function run(command,args,cwd=ROOT){const result=spawnSync(command,args,{cwd,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error(command+' failed; local delivery stopped.');}
function git(...args){return execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();}
function requireClean(read=git){if(read('status','--porcelain','--untracked-files=normal'))throw Error('Review local changes first. The updater never commits, stashes or discards your files.');if(read('symbolic-ref','--short','HEAD')!=='main')throw Error('Switch to a clean main branch before updating.');}
function requireCIData(runs,sha){
 const matching=runs.filter(r=>r.head_sha===sha&&r.head_branch==='main').sort((a,b)=>b.run_number-a.run_number||(b.run_attempt||1)-(a.run_attempt||1));
 if(!matching.length||matching[0].status!=='completed'||matching[0].conclusion!=='success')throw Error('The newest main commit has no successful completed CI run. Installed code and the running tracker were left unchanged.');
}
function requireCI(sha){
 const url=`https://api.github.com/repos/${REPOSITORY}/actions/workflows/ci.yml/runs?head_sha=${encodeURIComponent(sha)}&event=push&per_page=100`;
 const output=execFileSync('curl',['--fail','--silent','--show-error','--max-time','30','-H','Accept: application/vnd.github+json','-H','User-Agent: local-job-tracker',url],{encoding:'utf8'});
 requireCIData(JSON.parse(output).workflow_runs,sha);
}
async function update(){
 requireClean();if(git('remote','get-url','origin')!==REMOTE)throw Error('Unexpected origin. Expected '+REMOTE);
 run('git',['fetch','origin','main']);const sha=git('rev-parse','FETCH_HEAD'),previous=git('rev-parse','HEAD');requireCI(sha);run('git',['merge-base','--is-ancestor',previous,sha]);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tracker-candidate-')),candidate=path.join(temp,'code');
 try{
  run('git',['clone','--quiet','--no-hardlinks',ROOT,candidate]);run('git',['checkout','--quiet','--detach',sha],candidate);run('npm',['ci'],candidate);
  // Reuse installed browser tooling; download only if the required browser is absent.
  const probe=spawnSync(process.execPath,['-e',"require('playwright').chromium.launch({headless:true}).then(b=>b.close()).catch(e=>{console.error(e.message);process.exit(1)})"],{cwd:candidate,encoding:'utf8'});
  if(probe.status!==0){if((probe.stderr||'').includes("Executable doesn't exist"))run('npx',['playwright','install','chromium','--only-shell'],candidate);else throw Error('Browser checks cannot run: '+(probe.stderr||'browser launch failed'));}
  run('npm',['test'],candidate);run('npm',['run','build'],candidate);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 requireClean();if(git('rev-parse','HEAD')!==previous)throw Error('Checkout changed during validation. Please retry.');
 const manager=createManager(),port=manager.readState().port??8000;
 const backup=path.join(ROOT,'.local-backups',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(backup,{recursive:true,mode:0o700});
 if(fs.existsSync(manager.privateDir))fs.cpSync(manager.privateDir,path.join(backup,'.local-data'),{recursive:true});fs.writeFileSync(path.join(backup,'code-revision.txt'),previous+'\n');
 run('git',['merge','--ff-only',sha]);
 try{await manager.stop();await manager.start(port);if(!await manager.healthy(port))throw Error('Tracker health check failed.');}
 catch(error){await manager.stop();run('git',['reset','--keep',previous]);await manager.start(port);throw Error('New code failed to start. Previous code was restored and restarted; private files were preserved.');}
 console.log(`Updated to ${sha.slice(0,12)}. Verified http://127.0.0.1:${port}/`);console.log('Refresh the tracker tab. Private backup: '+backup);
}
async function main(){
 const manager=createManager();fs.mkdirSync(manager.privateDir,{recursive:true,mode:0o700});const lock=path.join(manager.privateDir,'update-node.lock');let fd;
 try{fd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid,started:new Date().toISOString()}));await update();}
 catch(error){if(error.code==='EEXIST')throw Error('An update lock exists. Check whether another update is running before removing .local-data/update-node.lock.');throw error;}
 finally{if(fd!==undefined){fs.closeSync(fd);fs.unlinkSync(lock);}}
}
module.exports={requireCIData,requireCI,requireClean,update,main};
if(require.main===module)main().catch(error=>{console.error('Update stopped: '+error.message);process.exitCode=1;});
