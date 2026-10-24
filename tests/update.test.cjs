const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net');
const {requireCIData,requireClean}=require('../scripts/update.cjs'),{createManager}=require('../scripts/manage.cjs');
test('local delivery requires a successful latest main run on the exact SHA',()=>{
 const success={head_sha:'abc',head_branch:'main',run_number:1,status:'completed',conclusion:'success'};
 for(const runs of [[],[{...success,head_branch:'other'}],[{...success,status:'in_progress',conclusion:null}],[{...success,conclusion:'failure'}],[{...success,head_sha:'other'}],[success,{...success,run_number:2,conclusion:'failure'}]])assert.throws(()=>requireCIData(runs,'abc'));
 assert.doesNotThrow(()=>requireCIData([success],'abc'));
 assert.throws(()=>requireClean(()=> ' M app.js'),/local changes/);
});
test('managed JavaScript restart keeps the origin and private snapshots',async()=>{
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'tracker-manager-')));fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'.local-data'));
 for(const name of ['scripts/serve.cjs','scripts/workspace.cjs','data.js'])fs.copyFileSync(path.resolve(__dirname,'..',name),path.join(root,name));
 const snapshot=path.join(root,'.local-data/applications.json');fs.writeFileSync(snapshot,'{"items":[{"company":"SYNTHETIC_PRIVATE"}]}');fs.writeFileSync(path.join(root,'index.html'),'<h1>Fixture</h1>');
 const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));const manager=createManager(root);
 try{
  assert.equal(await manager.start(port),port);assert(await manager.healthy(port));assert(manager.ownsProcess(manager.readState()));assert.equal(await manager.start(),port);await manager.stop();assert.equal(await manager.start(port),port);assert(await manager.healthy(port));assert(fs.readFileSync(snapshot,'utf8').includes('SYNTHETIC_PRIVATE'));
 }finally{await manager.stop();fs.rmSync(root,{recursive:true,force:true});}
});
