const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {createTrackerServer,listen}=require('../scripts/serve.cjs');
function raw(url,headers){return new Promise((resolve,reject)=>{http.get(url,{headers},response=>{response.resume();response.on('end',()=>resolve(response.statusCode));}).on('error',reject);});}
test('local server substitutes private data and denies private paths and foreign hosts',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'tracker-privacy-'));let server;
 try{
  await fs.mkdir(path.join(root,'.local-data'));await fs.writeFile(path.join(root,'applications.json'),'{"items":[]}');await fs.writeFile(path.join(root,'.local-data/applications.json'),'{"items":[{"company":"PRIVATE_FIXTURE"}]}');await fs.writeFile(path.join(root,'.env'),'SECRET_FIXTURE');await fs.writeFile(path.join(root,'index.html'),'<h1>Fixture</h1>');
  server=createTrackerServer(root);const port=await listen(server,0),url=`http://127.0.0.1:${port}`;
  assert.equal((await(await fetch(url+'/applications.json')).json()).items[0].company,'PRIVATE_FIXTURE');
  for(const route of ['/.local-data/applications.json','/.env','/.git/config','/../.local-data/applications.json','/scripts/serve.cjs'])assert.equal((await fetch(url+route)).status,404);
  assert.equal(await raw(url+'/applications.json',{Host:'external.invalid'}),403);
  assert.equal((await(await fetch(url+'/health.json')).json()).runtime,'node');
 }finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await fs.rm(root,{recursive:true,force:true});}
});
