#!/usr/bin/env node
// Update an explicitly confirmed application; no employer forms or Gmail calls.
const fs=require('node:fs'),path=require('node:path'),{parseArgs}=require('node:util');
const {ROOT}=require('./serve.cjs');
async function main(args=process.argv.slice(2)){
 const {values}=parseArgs({args,options:{id:{type:'string'},company:{type:'string'},role:{type:'string'},status:{type:'string'},date:{type:'string'}}});
 if(!values.status||(!values.id&&!(values.company&&values.role)))throw Error('Supply --status and an exact --id, or both --company and --role.');
 const runtime=JSON.parse(fs.readFileSync(path.join(ROOT,'.local-data/runtime.json'),'utf8')),origin=`http://127.0.0.1:${runtime.port}`;
 async function get(route){const response=await fetch(origin+route,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Could not read the running local tracker.');return response.json();}
 const [workspace,snapshot,catalog]=await Promise.all([get('/api/workspace'),get('/applications.json'),get('/catalog.json')]);
 const candidates=new Map([...catalog.jobs,...catalog.leads,...catalog.restricted,...snapshot.items,...workspace.items].map(row=>[row.id,row]));
 const matches=values.id?(candidates.has(values.id)?[candidates.get(values.id)]:[]):[...candidates.values()].filter(row=>row.company.toLowerCase()===values.company.toLowerCase()&&row.jobTitle.toLowerCase()===values.role.toLowerCase());
 if(matches.length!==1)throw Error('No unique role found. Supply the exact application ID from local records.');
 const source=matches[0];if(workspace.deleted.includes(source.id))throw Error('This role was deleted. Restore it explicitly before changing status.');
 const row={};for(const key of ['id','company','jobTitle','notes','salary','link','location','workArrangement','term','requisition','starred','createdAt'])if(key in source)row[key]=source[key];
 const now=new Date();Object.assign(row,{status:values.status,statusUpdatedAt:now.toISOString(),updatedAt:now.toISOString(),dateApplied:values.date||source.dateApplied||''});
 if(values.status==='Applied'&&!row.dateApplied)row.dateApplied=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const existing=workspace.items.find(item=>item.id===row.id);if(existing)row.notes=existing.notes||'';
 workspace.items=workspace.items.filter(item=>item.id!==row.id).concat(row);
 const response=await fetch(origin+'/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(workspace),signal:AbortSignal.timeout(10000)});
 if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.detail||'Could not save the application.');}
 console.log(`Updated ${row.company} — ${row.jobTitle} to ${values.status}. Refresh the tracker.`);
}
module.exports={main};if(require.main===module)main().catch(error=>{console.error('Status update stopped: '+error.message);process.exitCode=1;});
