(function(root){
 const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function mergeApplications(remote,local,deleted=[]){
  const map=new Map(remote.map(a=>[a.id,{...a}])), hidden=new Set(deleted);
  for(const a of local){let id=a.id;const match=map.has(id)?null:[...map.values()].find(r=>normalize(r.company)===normalize(a.company)&&normalize(r.jobTitle)===normalize(a.jobTitle));if(match)id=match.id;
   const r=map.get(id);if(!r)map.set(id,{...a});else {const localWins=Date.parse(a.updatedAt||0)>=Date.parse(r.updatedAt||0);map.set(id,{...r,...(localWins?a:{}),id,link:a.link||r.link,notes:a.notes||r.notes||'',dateApplied:a.dateApplied||r.dateApplied||''});}}
  return [...map.values()].filter(a=>!hidden.has(a.id));
 }
 const api={normalize,mergeApplications};if(typeof module!=='undefined')module.exports=api;else root.TrackerSync=api;
})(typeof globalThis!=='undefined'?globalThis:this);
