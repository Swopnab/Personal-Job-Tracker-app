#!/usr/bin/env node
// Local, transparent skill-term coverage; never contacts an employer or an external ATS.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {resumeSkillMatch}=require('../data.js');
const {sameRole}=require('../sync.js');
function main(args=process.argv.slice(2)){
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'.local-data');
 const resumePath=args[0]||path.join(dir,'resume.txt');const resume=fs.readFileSync(resumePath,'utf8');if(resume.trim().length<100)throw Error('Supply an extracted resume with readable text.');
 const catalog=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'))),applications=JSON.parse(fs.readFileSync(path.join(dir,'applications.json')));
 const descriptionsPath=path.join(dir,'job-descriptions.json'),descriptions=fs.existsSync(descriptionsPath)?JSON.parse(fs.readFileSync(descriptionsPath)):{};
 const catalogRows=[...catalog.jobs,...catalog.leads,...catalog.restricted];
 const records=new Map(catalogRows.map(r=>[r.id,r]));for(const a of applications.items)if(!records.has(a.id)){const match=catalogRows.find(r=>sameRole(r,a));records.set(a.id,match?{...match,id:a.id,matchEvidenceId:match.id}:a);}
 const checkedAt=new Date().toISOString();catalog.resumeMatches={};
 for(const [id,job]of records){const source=descriptions[job.matchEvidenceId||id];const jobText=source?.text||job.stack||'';const result=resumeSkillMatch(resume,jobText);catalog.resumeMatches[id]={...result,scope:source?'Employer text snapshot':'Limited listing skill summary',sourceUrl:source?.sourceUrl||job.sourceUrl||job.link||'',sourceCheckedAt:source?.checkedAt||job.checked||'',checkedAt};}
 catalog.research={...catalog.research,resumeMatch:{method:'Equal-weight detected technical skill coverage. Does not evaluate ATS parsing, experience, degree, graduation or work authorization.',resumeName:path.basename(resumePath),resumeSha256:crypto.createHash('sha256').update(resume).digest('hex'),checkedAt}};
 const backup=path.join(root,'.local-backups','before-resume-match-'+Date.now());fs.mkdirSync(backup,{recursive:true,mode:0o700});fs.copyFileSync(path.join(dir,'catalog.json'),path.join(backup,'catalog.json'));
 const dest=path.join(dir,'catalog.json'),tmp=dest+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(catalog,null,2)+'\n',{mode:0o600});fs.renameSync(tmp,dest);
 const scored=Object.values(catalog.resumeMatches).filter(m=>m.score!==null).length,appScored=applications.items.filter(a=>catalog.resumeMatches[a.id]?.score!==null).length;
 console.log(`Resume keyword match: ${scored}/${records.size} records and ${appScored}/${applications.items.length} applications have enough skill evidence. Others show no score.`);
}
module.exports={main};if(require.main===module)try{main();}catch(e){console.error('Resume match stopped: '+e.message);process.exitCode=1;}
