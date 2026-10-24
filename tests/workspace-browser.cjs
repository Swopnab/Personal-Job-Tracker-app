const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn,execFileSync}=require('node:child_process'),{once}=require('node:events'),{chromium}=require('playwright');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'tracker-e2e-'));let server,browser;
 try{
  await fs.mkdir(path.join(root,'scripts'));await fs.mkdir(path.join(root,'.local-data'));
  for(const name of ['index.html','app.js','data.js','sync.js','style.css','applications.json','catalog.json','scripts/serve.py','scripts/workspace.py','scripts/mark.py'])await fs.copyFile(path.resolve(__dirname,'..',name),path.join(root,name));
  const seed={id:'fixture-role',company:'Synthetic Lab',jobTitle:'Software Intern',location:'Plano, TX',workArrangement:'Hybrid',term:'Summer 2027',group:'reviewed',authStatus:'explicit',requisition:'fixture-1',link:'https://example.com/job'};
  await fs.writeFile(path.join(root,'.local-data/catalog.json'),JSON.stringify({jobs:[seed],leads:[],restricted:[],contacts:[],importedAt:'2020-01-01T00:00:00Z'}));
  server=spawn('python3',['-u','scripts/serve.py','--port','0','--strict-port'],{cwd:root,stdio:['ignore','pipe','pipe']});
  const url=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('test server startup timed out')),10000);server.stdout.on('data',c=>{out+=c;const match=out.match(/Local tracker: (http:\/\/127\.0\.0\.1:\d+\/)/);if(match){clearTimeout(timer);resolve(match[1]);}});server.once('exit',code=>{clearTimeout(timer);reject(Error('test server exit '+code));});});
  browser=await chromium.launch({headless:true});const a=await browser.newContext(),b=await browser.newContext();const first=await a.newPage();const errors=[];first.on('pageerror',e=>errors.push(e.message));
  await first.goto(url);await first.getByText('1 of 1 roles',{exact:true}).waitFor();
  await first.locator('[data-action="star"]').click();await first.waitForFunction(()=>document.querySelector('.save-role').getAttribute('aria-pressed')==='true');
  await first.getByRole('button',{name:'Mark applied',exact:true}).click();await first.getByText('Stage updated',{exact:true}).waitFor();await first.locator('#all-applications').click();
  assert.equal(await first.locator('.status-select').inputValue(),'Applied');
  await first.getByRole('button',{name:'Edit Synthetic Lab application',exact:true}).click();await first.locator('#qa-notes').fill('Private synthetic prep');await first.locator('#qa-location').fill('Dallas, TX');await first.locator('#save-application').click();await first.getByText('Application updated',{exact:true}).waitFor();
  const second=await b.newPage();await second.goto(url);await second.locator('#all-applications').click();await second.getByRole('button',{name:'Edit Synthetic Lab application',exact:true}).click();assert.equal(await second.locator('#qa-notes').inputValue(),'Private synthetic prep');assert.equal(await second.locator('#qa-location').inputValue(),'Dallas, TX');
  // Hold a stale form in another browser while a newer revision is saved.
  await first.getByRole('button',{name:'Edit Synthetic Lab application',exact:true}).click();await second.locator('#qa-notes').fill('Newer notes from second browser');await second.locator('#save-application').click();await second.getByText('Application updated',{exact:true}).waitFor();
  await first.locator('#qa-notes').fill('Stale overwrite attempt');await first.locator('#save-application').click();await first.getByText(/changed in another tab/).waitFor();
  await first.locator('#quick-add-cancel').click();await first.locator('#refresh-data').click();await first.getByRole('button',{name:'Edit Synthetic Lab application',exact:true}).click();assert.equal(await first.locator('#qa-notes').inputValue(),'Newer notes from second browser');await first.locator('#quick-add-cancel').click();
  const saved=JSON.parse(await fs.readFile(path.join(root,'.local-data/workspace.json'),'utf8'));assert.equal(saved.items[0].notes,'Newer notes from second browser');assert.equal(saved.items[0].starred,true);assert.equal(saved.items[0].location,'Dallas, TX');assert.equal(saved.items[0].status,'Applied');
  await fs.writeFile(path.join(root,'.local-data/runtime.json'),JSON.stringify({port:Number(new URL(url).port)}));
  execFileSync('python3',['scripts/mark.py','--id','fixture-role','--status','Accepted'],{cwd:root});
  const marked=JSON.parse(await fs.readFile(path.join(root,'.local-data/workspace.json'),'utf8'));assert.equal(marked.items[0].status,'Accepted');assert.equal(marked.items[0].notes,'Newer notes from second browser');
  for(const route of ['.local-data/workspace.json','.local-data/catalog.json','scripts/workspace.py','.git/config']){const response=await first.request.get(url+route);assert.equal(response.status(),404);}
  assert.deepEqual(errors,[]);console.log('PASS private shared saving, stars, mark applied, editable location, two browser contexts, local status command, stale-write rejection, note preservation and private-route blocking');
 }finally{
  if(browser)await browser.close();
  if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}
  await fs.rm(root,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
