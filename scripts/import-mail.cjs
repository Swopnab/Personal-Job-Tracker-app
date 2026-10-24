// Imports a reviewed, normalized batch locally; never contacts Gmail or GitHub.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validateApplications}=require('../data.js');
const {normalize,mergeApplications}=require('../sync.js');
function mergeBatch(snapshot,batch){
 if(!Array.isArray(batch)||batch.length>10000)throw Error('Expected up to 10,000 reviewed updates');
 let items=validateApplications(snapshot.items),events=[...snapshot.events],hashes=new Set(snapshot.processedMessageHashes);
 // Validate the entire batch before returning anything to the writer.
 const updates=batch.map(update=>{
  if(typeof update.messageId!=='string'||!update.messageId||update.messageId.length>500)throw Error('A Gmail message ID is required');
  if(typeof update.at!=='string'||!Number.isFinite(Date.parse(update.at)))throw Error('Invalid message timestamp');
  if(typeof update.summary!=='string'||update.summary.length>1000)throw Error('Use a short reviewed summary, not the raw email');
  const [application]=validateApplications([update.application]);
  if(!application.company.trim()||!application.jobTitle.trim())throw Error('Company and role are required; review ambiguous messages manually');
  return {...update,application,at:new Date(update.at).toISOString()};
 }).sort((a,b)=>a.at.localeCompare(b.at));
 let imported=0;
 for(const update of updates){
  const hash=crypto.createHash('sha256').update(update.messageId).digest('hex');
  if(hashes.has(hash))continue;
  const a=update.application;
  const exact=items.find(r=>r.id===a.id);
  const matches=exact?[exact]:items.filter(r=>normalize(r.company)===normalize(a.company)&&normalize(r.jobTitle)===normalize(a.jobTitle));
  if(matches.length>1)throw Error('Ambiguous application match; use the existing unique ID and resolve duplicate roles before importing');
  const old=matches[0],id=old?.id||a.id;
  const incoming={...a,id,notes:old?.notes||'',updatedAt:update.at,statusUpdatedAt:update.at};
  items=mergeApplications(items,[incoming]);
  events.push({applicationId:id,company:a.company,jobTitle:a.jobTitle,status:a.status,at:update.at,summary:update.summary});
  hashes.add(hash);imported++;
 }
 return {snapshot:{...snapshot,items:validateApplications(items),events,processedMessageHashes:[...hashes],lastSyncedAt:imported?new Date().toISOString():snapshot.lastSyncedAt,lastCheckedAt:new Date().toISOString()},imported};
}
function main(){
 const input=process.argv[2];if(!input)throw Error('Usage: npm run import:mail -- /path/to/reviewed-updates.json');
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'.local-data');fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const lock=path.join(dir,'import.lock');fs.mkdirSync(lock);
 try{
  const target=path.join(dir,'applications.json');
  const snapshot=JSON.parse(fs.readFileSync(fs.existsSync(target)?target:path.join(root,'applications.json'),'utf8'));
  const result=mergeBatch(snapshot,JSON.parse(fs.readFileSync(input,'utf8')));
  { // Record a successful scan even when every message was already processed.
   if(fs.existsSync(target)){const backups=path.join(root,'.local-backups');fs.mkdirSync(backups,{recursive:true,mode:0o700});fs.copyFileSync(target,path.join(backups,`applications-${Date.now()}.json`));}
   const temp=target+'.tmp';fs.writeFileSync(temp,JSON.stringify(result.snapshot,null,2)+'\n',{mode:0o600});fs.renameSync(temp,target);
  }
  console.log(`Imported ${result.imported} new application updates. Refresh the local tracker tab.`);
 }finally{fs.rmdirSync(lock);}
}
module.exports={mergeBatch};if(require.main===module){try{main();}catch(error){console.error('Import stopped: '+error.message);process.exitCode=1;}}
