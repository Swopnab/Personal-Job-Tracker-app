// Private manual edits shared by local browsers. Uses the same validator as the UI.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validateApplications}=require('../data.js');
function validate(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid workspace');
 const items=validateApplications(payload.items),deleted=payload.deleted??[];
 if(!Array.isArray(deleted)||deleted.length>20000||deleted.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)))throw Error('Invalid deleted records');
 return {items,deleted:[...new Set(deleted)]};
}
function read(root){
 const file=path.join(root,'.local-data/workspace.json');
 if(!fs.existsSync(file))return {revision:0,items:[],deleted:[]};
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Number.isSafeInteger(data.revision)||data.revision<0)throw Error('Invalid saved revision');
 return {...validate(data),revision:data.revision};
}
function save(root,payload){
 const data=validate(payload),current=read(root);
 if(!Number.isSafeInteger(payload.revision)||payload.revision!==current.revision){const error=Error('This tracker changed in another tab. Refresh before saving.');error.status=409;throw error;}
 const privateDir=path.join(root,'.local-data'),file=path.join(privateDir,'workspace.json');
 fs.mkdirSync(privateDir,{recursive:true,mode:0o700});
 if(fs.existsSync(file)){
  const backups=path.join(root,'.local-backups');fs.mkdirSync(backups,{recursive:true,mode:0o700});
  const backup=path.join(backups,`workspace-${Date.now()}-${crypto.randomUUID()}.json`);fs.copyFileSync(file,backup);fs.chmodSync(backup,0o600);
 }
 const result={...data,revision:current.revision+1},temp=path.join(privateDir,`workspace-${crypto.randomUUID()}.tmp`);
 let descriptor;
 try{descriptor=fs.openSync(temp,'wx',0o600);fs.writeFileSync(descriptor,JSON.stringify(result,null,2)+'\n');fs.fsyncSync(descriptor);fs.closeSync(descriptor);descriptor=undefined;fs.renameSync(temp,file);}
 finally{if(descriptor!==undefined)fs.closeSync(descriptor);if(fs.existsSync(temp))fs.unlinkSync(temp);}
 return result;
}
module.exports={read,save,validate};
