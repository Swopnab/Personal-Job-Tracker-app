(() => {
'use strict';
const D=TrackerData,S=TrackerSync,$=id=>document.getElementById(id),e=D.escapeHtml;
const apiMode=document.body.dataset.storage==='api';
let catalog={jobs:[],leads:[],restricted:[],contacts:[]},mail={items:[],events:[]},catalogById=new Map();
let applications=[],deleted=[],revision=0,diskMode=false,busy=true,mode='available',stage='',limit=50,editing=null;
const label=status=>status==='Interested'?'Not applied':status==='OA'?'OA / assessment':status;
const color=status=>['Interview','Phone Screen','Technical Interview','Final Round'].includes(status)?'interview':status==='OA'||status==='Assessment'?'oa':['Offer Received','Accepted'].includes(status)?'offer':status==='Rejected'?'rejected':status==='Applied'?'applied':status==='Interested'?'interested':'other';
const badge=status=>`<span class="badge stage-${color(status)}">${e(label(status))}</span>`;
const options=value=>D.statuses.map(s=>`<option value="${e(s)}"${s===value?' selected':''}>${e(label(s))}</option>`).join('');
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const date=value=>value?new Date(value+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
function toast(message,error=false){const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=message;$('toast-container').replaceChildren(el);setTimeout(()=>el.remove(),5000);}
function warning(message){$('storage-warning').textContent=message;$('storage-warning').hidden=false;}
function setBusy(value){busy=value;document.querySelectorAll('button,select,input').forEach(el=>el.disabled=value);$('applications-container').setAttribute('aria-busy',String(value));}
async function request(method,body,path){
 const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok){const info=await response.json().catch(()=>({}));throw new Error(response.status===409?'This tracker changed in another tab. Refresh before saving; your open form is still here.':info.detail||'Could not save. Try again.');}
 return response.json();
}
async function load(){
 let local=[];
 try{local=D.validateApplications(JSON.parse(localStorage.getItem('jobTrackerApplications')||'[]'));deleted=JSON.parse(localStorage.getItem('jobTrackerDeleted')||'[]');if(!Array.isArray(deleted))deleted=[];}catch{warning('Saved browser data could not be read. Export a backup before editing.');}
 try{
  const read=async file=>{const r=await fetch('./'+file,{cache:'no-store'});if(!r.ok)throw Error('Local records unavailable');return r.json();};
  [catalog,mail]=await Promise.all([read('catalog.json'),read('applications.json')]);
  if(!apiMode){const response=await fetch('./api/workspace',{cache:'no-store'}).catch(()=>null);if(response?.ok){const disk=await response.json();local=S.mergeApplications(D.validateApplications(disk.items),local,[],true);deleted=[...new Set([...deleted,...disk.deleted])];revision=disk.revision;diskMode=true;}else if(response&&response.status!==404)throw Error('Shared local storage unavailable');}
  catalogById=new Map([...catalog.jobs,...catalog.leads,...catalog.restricted].map(j=>[j.id,j]));
  const seed=[...catalogById.values()].map(j=>({id:j.id,company:j.company,jobTitle:j.jobTitle,status:'Interested',dateApplied:'',link:j.link||'',salary:j.salary||'',notes:'',createdAt:catalog.importedAt,updatedAt:'2026-01-01T00:00:00.000Z',statusUpdatedAt:'2026-01-01T00:00:00.000Z',...(j.requisition?{requisition:j.requisition}:{})}));
  applications=S.mergeApplications(D.validateApplications(S.mergeApplications(seed,mail.items)),local,deleted);
  const checked=mail.lastCheckedAt||mail.lastSyncedAt;$('sync-state').textContent=checked?'Saved locally · Gmail checked '+new Date(checked).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/Chicago'}):'Saved locally · Say “scan Gmail” to import replies';
  $('research-download').hidden=catalog.research?.workbookAvailable!==true;
  if(catalog.notice){$('research-notice').hidden=false;$('research-notice-text').textContent=catalog.notice.text;$('research-notice-link').href=D.safeLink(catalog.notice.url);}
 }catch(error){applications=local;warning('Local records could not be loaded. Your saved browser records are still available.');}
 setBusy(false);render();
}
async function commit(rows){
 if(busy)return false;const valid=D.validateApplications(rows);setBusy(true);
 try{
  if(apiMode){const result=await request('PUT',{revision,items:valid},'/api/tracker/');revision=result.revision;applications=D.validateApplications(result.items);}
  else{if(diskMode){const saved=await request('PUT',{revision,items:valid,deleted},'/api/workspace');revision=saved.revision;}applications=valid;try{localStorage.setItem('jobTrackerApplications',JSON.stringify(valid));localStorage.setItem('jobTrackerDeleted',JSON.stringify(deleted));}catch{warning('Saved locally. This browser cannot keep an offline copy.');}}
  return true;
 }catch(error){if($('quick-add-modal').open){$('form-error').textContent=error.message;$('form-error').hidden=false;}else toast(error.message,true);return false;}
 finally{setBusy(false);render();}
}
function jobInfo(a){const source=catalogById.get(a.id)||catalogById.get(mail.items.find(m=>m.id===a.id)?.catalogId)||mail.items.find(m=>S.sameRole(m,a))||{};return {...source,...(a.location?{location:a.location}:{}),...(a.workArrangement?{workArrangement:a.workArrangement}:{}),...(a.term?{term:a.term}:{})};}
const matchInfo=a=>catalog.resumeMatches?.[a.id]||null;
function rows(){
 const q=$('search-input').value.trim().toLowerCase(),region=$('region-filter').value,arrangement=$('arrangement-filter').value,city=$('location-filter').value.trim().toLowerCase(),auth=$('cpt-filter').value,role=$('role-filter').value,term=$('term-filter').value;
 return applications.filter(a=>{
  if(mode==='available'&&a.listingUnavailable||D.applicationBucket(a)!==mode||mode==='applied'&&stage&&D.applicationStage(a)!==stage)return false;
  const j=jobInfo(a),geo=D.jobLocation(j),restricted=j.authStatus==='excluded'||j.degreeCheck==='incompatible';
  const authorization=!auth||auth==='explicit'&&(j.authStatus==='explicit'||j.internationalStatus==='cpt')&&!restricted||auth==='international'&&D.hasInternationalEvidence(j)||auth==='excluded'&&restricted||auth==='confirm'&&!restricted&&!['cpt','f1','sponsorship'].includes(j.internationalStatus)&&j.authStatus!=='explicit';
  return authorization&&(!region||geo.region===region)&&(!arrangement||geo.arrangement===arrangement)&&(!city||geo.location.toLowerCase().includes(city))&&(!role||D.roleFocus({...j,jobTitle:a.jobTitle})===role)&&(!term||(term==='summer')===/Summer 2027/i.test(D.jobTerm({...j,jobTitle:a.jobTitle})))&&(!q||[a.company,a.jobTitle,a.notes,geo.location,j.stack,j.recruiter,j.requisition].some(v=>String(v||'').toLowerCase().includes(q)));
 }).sort((a,b)=>{
  const sort=$('sort-select').value;
  if(sort==='dfw'){const rank=D.opportunityRank(jobInfo(a))-D.opportunityRank(jobInfo(b));if(rank)return rank;if(mode==='available'){const review=j=>j.group==='restricted'?3:j.availabilityStatus==='talent-pool'?2:j.group==='reviewed'?0:1;const next=review(jobInfo(a))-review(jobInfo(b));if(next)return next;}}
  if(sort==='date')return (b.dateApplied||'').localeCompare(a.dateApplied||'')||a.company.localeCompare(b.company);
  if(sort==='resume'){const diff=(matchInfo(b)?.score??-1)-(matchInfo(a)?.score??-1);if(diff)return diff;}
  return a.company.localeCompare(b.company)||a.jobTitle.localeCompare(b.jobTitle);
 });
}
function clearFilters(){for(const id of ['search-input','region-filter','arrangement-filter','location-filter','cpt-filter','role-filter','term-filter'])$(id).value='';stage='';limit=50;}
function switchMode(next){mode=next;clearFilters();render();}
function external(url,text,cls=''){let safe='';try{safe=D.safeLink(url);}catch{}return safe?`<a class="${cls}" href="${e(safe)}" target="_blank" rel="noopener noreferrer">${e(text)} ↗</a>`:'';}
function render(){
 const available=applications.filter(a=>D.applicationBucket(a)==='available'&&!a.listingUnavailable),applied=applications.filter(a=>D.applicationBucket(a)==='applied');
 const unavailable=applications.filter(a=>D.applicationBucket(a)==='available'&&a.listingUnavailable);
 $('unavailable-jobs').hidden=mode!=='available'||!unavailable.length;
 $('unavailable-count').textContent=unavailable.length;
 $('unavailable-container').innerHTML=unavailable.map(a=>`<article class="unavailable-job" data-id="${e(a.id)}"><div><strong>${e(a.company)}</strong><span class="job-title">${e(a.jobTitle)}</span></div><div>${external(a.link,'Check link')}<button class="secondary" data-restore-id="${e(a.id)}">Restore</button></div></article>`).join('');
 $('opportunity-count').textContent=available.length;$('nav-count').textContent=applied.length;
 for(const [id,active]of [['opportunities-nav',mode==='available'],['all-applications',mode==='applied']]){$(id).classList.toggle('active',active);if(active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
 $('list-heading').textContent=mode==='available'?'Available jobs':'Applied';$('list-description').textContent=mode==='available'?'Jobs you haven’t applied to. Check the posting before applying.':'Your applications and the replies you’ve received.';
 $('stage-filters').hidden=mode!=='applied';
 const groups=[['','All'],['applied','Applied'],['oa','OA'],['interview','Interview'],['accepted','Accepted / offers'],['rejected','Rejected'],['other','Other']];
 $('stage-filters').innerHTML=groups.map(([value,title])=>`<button data-stage-filter="${value}" class="stage-filter${stage===value?' active':''}" aria-pressed="${stage===value}">${e(title)} <span>${value?applied.filter(a=>D.applicationStage(a)===value).length:applied.length}</span></button>`).join('');
 const all=rows(),visible=all.slice(0,limit);$('results-count').textContent=`${visible.length} of ${all.length} ${mode==='applied'?'applications':'jobs'}`;$('show-more').hidden=all.length<=limit;
 if(!visible.length){$('applications-container').innerHTML=`<div class="empty-state"><h3>${all.length?'No jobs':'Nothing here yet'}</h3><p>No ${mode==='applied'?'applications':'jobs'} match these filters.</p><button data-action="clear">Clear filters</button></div>`;return;}
 $('applications-container').innerHTML=`<div class="table-scroll"><table class="jobs-table"><thead><tr><th>Company / job</th><th>${mode==='applied'?'Status':'Resume match'}</th><th>${mode==='applied'?'Applied on':'Location'}</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${visible.map(a=>{
  const j=jobInfo(a),geo=D.jobLocation(j),m=matchInfo(a),score=m?.score!=null?m.score+'%':'—';
  const note=j.availabilityStatus==='talent-pool'?'Talent pool · not actively recruiting':j.group==='restricted'?'Closed or restricted · see Details':j.group==='unverified'?'Eligibility / availability needs checking':'';
  const meta=[mode==='applied'?geo.location:null,geo.arrangement==='Unknown'?null:geo.arrangement,mode==='applied'&&m?.score!=null?'Resume keywords '+score:null].filter(Boolean).join(' · ');
  return `<tr data-id="${e(a.id)}"><td class="job-cell"><strong>${e(a.company)}</strong><span class="job-title">${e(a.jobTitle)}</span>${meta?`<span class="job-meta">${e(meta)}</span>`:''}${mode==='available'&&note?`<span class="job-note">${e(note)}</span>`:''}</td><td data-label="${mode==='applied'?'Status':'Resume match'}">${mode==='applied'?`<label class="sr-only" for="status-${e(a.id)}">Status for ${e(a.company)} ${e(a.jobTitle)}</label><select id="status-${e(a.id)}" class="status-select stage-${color(a.status)}" data-stage-id="${e(a.id)}">${options(a.status)}</select>`:`<span class="match-score" title="Technical keyword coverage; not an employer ATS score">${score}</span>`}</td><td class="date-location" data-label="${mode==='applied'?'Applied on':'Location'}">${e(mode==='applied'?date(a.dateApplied):geo.location||'Unverified')}</td><td class="row-actions">${mode==='available'?`${external(a.link,'Open job')}<button class="primary" data-action="applied" data-id="${e(a.id)}">Mark applied</button>`:''}<button class="secondary" data-action="details" data-id="${e(a.id)}">Details</button>${mode==='available'?`<button class="unavailable-button" data-action="unavailable" data-id="${e(a.id)}" title="Job doesn’t exist" aria-label="Job doesn’t exist: ${e(a.company)} ${e(a.jobTitle)}">×</button>`:''}</td></tr>`;
 }).join('')}</tbody></table></div>`;
}
function details(id){
 const a=applications.find(a=>a.id===id);if(!a)return;const j=jobInfo(a),m=matchInfo(a);
 const fields=[['Location',j.location],['Work arrangement',D.jobLocation(j).arrangement],['Term',D.jobTerm({...j,jobTitle:a.jobTitle})],['Date applied',a.dateApplied?date(a.dateApplied):''],['Compensation',a.salary||j.salary],['Your notes',a.notes],['Degree / graduation',j.classStanding||j.graduationFit],['CPT / work authorization',j.authorization||'Not verified'],['Listing availability',j.availabilityStatus==='talent-pool'?'Talent pool; not actively recruiting':j.availability],['Restriction',j.reason],['Recruiter / hiring contact',j.recruiter],['Contact relevance',j.contactRelevance]];
 if(m)fields.push(['Resume keyword match',m.score===null?'Unavailable: not enough job-description evidence.':`${m.score}% · ${m.matched.length} of ${m.total} detected skill terms appear in your resume.`],['Matched terms',m.matched.join(', ')||'None detected'],['Missing terms',m.missing.join(', ')||'None among detected terms'],['Match basis',m.scope+'. '+m.method]);
 const updates=(mail.events||[]).filter(v=>v.applicationId===a.id||S.sameRole(v,a)).sort((x,y)=>y.at.localeCompare(x.at));
 $('details-content').innerHTML=`<p class="eyebrow">${e(a.company)}</p><h2 id="details-title">${e(a.jobTitle)}</h2>${badge(a.status)}<div class="detail-links">${external(a.link,'Open job','secondary')}${external(j.recruiterLink,'LinkedIn contact','secondary')}${external(m?.sourceUrl||j.sourceUrl,'Job source','secondary')}</div>${updates.length?`<section class="reply-history"><h3>Application updates</h3><ul>${updates.map(v=>`<li>${badge(v.status)} <time>${e(new Date(v.at).toLocaleDateString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric'}))}</time><p>${e(v.summary)}</p></li>`).join('')}</ul></section>`:''}<dl>${fields.filter(([,value])=>value).map(([key,value])=>`<div><dt>${e(key)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl><div class="dialog-actions"><button id="detail-save" class="secondary save-role" aria-pressed="${!!a.starred}">${a.starred?'Unsave job':'Save job'}</button><button id="detail-edit" class="primary">Edit status / notes</button></div>`;
 $('detail-edit').onclick=()=>{$('details-modal').close();openEditor(id);};$('detail-save').onclick=async()=>{if(await commit(applications.map(v=>v.id===id?{...v,starred:!v.starred,updatedAt:new Date().toISOString()}:v))){$('details-modal').close();details(id);}};$('details-modal').showModal();
}
function openEditor(id=null){
 if(busy)return;editing=id;const a=applications.find(a=>a.id===id)||{status:mode==='available'?'Interested':'Applied'};$('quick-add-form').reset();
 for(const [field,key]of [['company','company'],['jobtitle','jobTitle'],['status','status'],['date','dateApplied'],['link','link'],['location','location'],['arrangement','workArrangement'],['term','term'],['salary','salary'],['notes','notes']])$(`qa-${field}`).value=a[key]||jobInfo(a)[key]||'';
 $('editor-title').textContent=id?'Edit job':'Add a job';$('form-error').hidden=true;$('quick-add-modal').showModal();$('qa-company').focus();
}
async function setUnavailable(id,value){
 const job=applications.find(a=>a.id===id);if(!job||D.applicationBucket(job)!=='available')return;
 const now=new Date().toISOString();
 if(await commit(applications.map(a=>a.id===id?{...a,listingUnavailable:value,listingAvailabilityUpdatedAt:now,updatedAt:now}:a)))toast(value?'Moved to “Job doesn’t exist”. You can restore it from that list.':'Job restored to Available jobs');
}
async function changeStage(id,status){const now=new Date().toISOString();if(await commit(applications.map(a=>a.id===id?{...a,status,statusUpdatedAt:now,updatedAt:now,dateApplied:a.dateApplied||(status==='Applied'?day():'')}:a))){switchMode(status==='Interested'?'available':'applied');toast(status==='Interested'?'Moved to Available jobs':'Application updated');}}
$('qa-status').innerHTML=options('Interested');
$('opportunities-nav').onclick=()=>switchMode('available');$('all-applications').onclick=()=>switchMode('applied');
$('stage-filters').onclick=event=>{const button=event.target.closest('[data-stage-filter]');if(button){stage=button.dataset.stageFilter;limit=50;render();}};
for(const id of ['search-input','region-filter','arrangement-filter','location-filter','sort-select','cpt-filter','role-filter','term-filter'])$(id).addEventListener(['search-input','location-filter'].includes(id)?'input':'change',()=>{limit=50;render();});
$('applications-container').onclick=event=>{const button=event.target.closest('[data-action]');if(!button)return;const id=button.dataset.id;if(button.dataset.action==='unavailable')setUnavailable(id,true);if(button.dataset.action==='applied')changeStage(id,'Applied');if(button.dataset.action==='details')details(id);if(button.dataset.action==='clear'){clearFilters();render();}};
$('unavailable-container').onclick=event=>{const button=event.target.closest('[data-restore-id]');if(button)setUnavailable(button.dataset.restoreId,false);};
$('applications-container').onchange=event=>{if(event.target.dataset.stageId)changeStage(event.target.dataset.stageId,event.target.value);};
$('add-application-btn').onclick=()=>openEditor();$('show-more').onclick=()=>{limit+=50;render();};$('refresh-data').onclick=()=>{setBusy(true);load();};
$('quick-add-close').onclick=$('quick-add-cancel').onclick=()=>$('quick-add-modal').close();$('details-close').onclick=()=>$('details-modal').close();
$('quick-add-form').onsubmit=async event=>{
 event.preventDefault();if(busy)return;const old=applications.find(a=>a.id===editing),now=new Date().toISOString();
 const row={...old,id:editing||crypto.randomUUID(),company:$('qa-company').value.trim(),jobTitle:$('qa-jobtitle').value.trim(),status:$('qa-status').value,dateApplied:$('qa-date').value,link:$('qa-link').value.trim(),location:$('qa-location').value.trim(),workArrangement:$('qa-arrangement').value,term:$('qa-term').value.trim(),salary:$('qa-salary').value,notes:$('qa-notes').value,createdAt:old?.createdAt||now,updatedAt:now,statusUpdatedAt:old&&old.status===$('qa-status').value?(old.statusUpdatedAt||old.updatedAt):now};
 try{if(!row.company||!row.jobTitle)throw Error('Company and job title are required.');D.validateApplications([row]);if(await commit(old?applications.map(a=>a.id===row.id?row:a):[row,...applications])){$('quick-add-modal').close();switchMode(D.applicationBucket(row));toast('Job saved');}}catch(error){$('form-error').textContent=error.message;$('form-error').hidden=false;}
};
$('export-btn').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(applications,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='job-tracker-'+day()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-btn').onclick=()=>$('import-file-input').click();$('import-file-input').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file||busy)return;try{if(file.size>10*1024*1024)throw Error('Backup exceeds 10 MB');const imported=D.validateApplications(JSON.parse(await file.text()));if(applications.length&&!confirm('Merge this backup? Newer statuses and notes will be kept.'))return;if(await commit(S.mergeApplications(applications,imported,deleted)))toast('Backup imported');}catch(error){toast('Import rejected: '+error.message+'. Existing records were kept.',true);}};
$('help-close').onclick=()=>$('help-modal').close();document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!document.querySelector('dialog[open]'))openEditor();}});
setBusy(true);load();
})();
