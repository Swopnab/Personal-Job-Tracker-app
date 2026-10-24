(function(root){
 const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const stamp=a=>Date.parse(a.statusUpdatedAt||a.updatedAt||a.createdAt||0);
 function sameRole(a,b){return normalize(a.company)===normalize(b.company)&&normalize(a.jobTitle)===normalize(b.jobTitle)&&!(a.requisition&&b.requisition&&a.requisition!==b.requisition);}
 function mergeApplications(remote,local,deleted=[],canonical=false){
  const map=new Map(remote.map(a=>[a.id,{...a}])),hidden=new Set(deleted);
  for(const a of local){
   let id=a.id;
   const match=map.has(id)?null:[...map.values()].find(r=>sameRole(r,a));
   if(match)id=match.id;
   const r=map.get(id);
   if(!r){map.set(id,{...a});continue;}
   const localWins=stamp(a)>=stamp(r);
   const latest=Date.parse(a.updatedAt||0)>=Date.parse(r.updatedAt||0)?a:r;
   const merged={...r,...(localWins?a:{}),id,
    link:a.link||r.link,notes:canonical?(latest.notes??''):(a.notes||r.notes||''),
    dateApplied:a.dateApplied||r.dateApplied||''};
   for(const key of ['location','workArrangement','term','requisition'])if(a[key]||r[key])merged[key]=a[key]||r[key];
   if('starred' in a||'starred' in r)merged.starred=canonical?(latest.starred??false):(a.starred??r.starred);
   // A note edit or bookmark must not mask an employer's later status event.
   const winner=localWins?a:r;
   if(winner.statusUpdatedAt)merged.statusUpdatedAt=winner.statusUpdatedAt;else delete merged.statusUpdatedAt;
   map.set(id,merged);
  }
  return [...map.values()].filter(a=>!hidden.has(a.id));
 }
 const api={normalize,sameRole,mergeApplications};if(typeof module!=='undefined')module.exports=api;else root.TrackerSync=api;
})(typeof globalThis!=='undefined'?globalThis:this);
