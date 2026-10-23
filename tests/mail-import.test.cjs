const {test}=require('node:test'),assert=require('node:assert/strict');
const {mergeBatch}=require('../scripts/import-mail.cjs');
const row={id:'role-1',company:'Example',jobTitle:'Intern',status:'Applied',dateApplied:'2026-10-01',notes:'Keep my prep',updatedAt:'2026-10-01T00:00:00Z'};
const snapshot={items:[row],events:[],processedMessageHashes:[],lastSyncedAt:null};
const update={messageId:'synthetic-message-1',at:'2026-10-22T12:00:00Z',summary:'Application decision received',application:{...row,id:'legacy-id',status:'Rejected',notes:'Untrusted email text'}};
test('mail import deduplicates message IDs and roles and preserves private notes',()=>{const a=mergeBatch(snapshot,[update,update]);assert.equal(a.imported,1);assert.equal(a.snapshot.items.length,1);assert.equal(a.snapshot.items[0].id,row.id);assert.equal(a.snapshot.items[0].status,'Rejected');assert.equal(a.snapshot.items[0].notes,'Keep my prep');assert.equal(a.snapshot.events.length,1);assert.equal(mergeBatch(a.snapshot,[update]).imported,0);assert(!JSON.stringify(a.snapshot).includes('synthetic-message'));});
test('older mail cannot replace a newer manual status',()=>{const a=mergeBatch({...snapshot,items:[{...row,status:'Accepted',updatedAt:'2026-10-23T12:00:00Z'}]},[update]);assert.equal(a.snapshot.items[0].status,'Accepted');});
test('invalid batch does not mutate the source snapshot',()=>{const before=JSON.stringify(snapshot);assert.throws(()=>mergeBatch(snapshot,[update,{...update,messageId:'next',application:{...row,status:'invalid'}}]));assert.equal(JSON.stringify(snapshot),before);});
