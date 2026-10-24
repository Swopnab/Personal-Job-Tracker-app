const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const workspace=require('../scripts/workspace.cjs'),{createTrackerServer,listen}=require('../scripts/serve.cjs');
test('atomic private saves preserve notes, reject stale/invalid writes and keep backups',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'tracker-store-'));
 try{
  const row={id:'synthetic-1',company:'Example',jobTitle:'Intern',status:'Applied',notes:'Private prep',dateApplied:'2026-10-01',location:'Plano, TX',workArrangement:'Hybrid',requisition:'one',starred:true};
  assert.equal(workspace.save(root,{revision:0,items:[row],deleted:[]}).revision,1);assert.equal(workspace.read(root).items[0].notes,'Private prep');
  assert.throws(()=>workspace.save(root,{revision:0,items:[row]}),/changed in another tab/);
  const file=path.join(root,'.local-data/workspace.json'),before=fs.readFileSync(file,'utf8');
  for(const bad of [{...row,link:'javascript:alert(1)'},{...row,status:'bad'},{...row,dateApplied:'2026-02-30'},{...row,notes:12}]){assert.throws(()=>workspace.save(root,{revision:1,items:[bad]}));assert.equal(fs.readFileSync(file,'utf8'),before);}
  workspace.save(root,{revision:1,items:[{...row,notes:''}],deleted:['other']});assert.equal(workspace.read(root).items[0].notes,'');assert.equal(fs.readdirSync(path.join(root,'.local-backups')).length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('workspace HTTP API requires same-origin JSON and rejects stale revisions',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'tracker-api-'));const server=createTrackerServer(root);
 try{
  const port=await listen(server,0),url=`http://127.0.0.1:${port}`;
  const put=(origin=url,type='application/json',revision=0)=>fetch(url+'/api/workspace',{method:'PUT',headers:{Origin:origin,'Content-Type':type},body:JSON.stringify({revision,items:[],deleted:[]})});
  assert.equal((await(await put()).json()).revision,1);assert.equal((await(await fetch(url+'/api/workspace')).json()).revision,1);
  assert.equal((await put('https://foreign.invalid')).status,403);assert.equal((await put(url,'text/plain')).status,415);assert.equal((await put()).status,409);assert.equal((await fetch(url+'/.local-data/workspace.json')).status,404);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
});
