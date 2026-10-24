const {test}=require('node:test');
const assert=require('node:assert/strict');
const {jobLocation}=require('../data.js');
test('DFW ranking uses the job location and distinguishes other Texas cities',()=>{
 for(const location of ['Plano','Fort Worth, TX','Dallas, Texas','Irving, TX','Arlington, TX','North Richland Hills, TX','Hurst, TX','Euless, TX','Bedford, TX','Keller, TX'])assert.equal(jobLocation({location}).region,'dfw');
 assert.equal(jobLocation({location:'Austin, TX'}).region,'texas');
 assert.equal(jobLocation({location:'Arlington, VA'}).region,'other');
 assert.equal(jobLocation({location:'See posting'}).region,'unknown');
});
test('work arrangement requires explicit evidence; city alone is not onsite',()=>{
 assert.equal(jobLocation({location:'Fort Worth, TX'}).arrangement,'Unknown');
 assert.equal(jobLocation({location:'Remote - United States'}).arrangement,'Remote');
 assert.equal(jobLocation({location:'Dallas, TX',workArrangement:'Hybrid'}).arrangement,'Hybrid');
 assert.equal(jobLocation({location:'On-site, Plano'}).arrangement,'Onsite');
 assert.equal(jobLocation({location:'San Francisco, CA; approved U.S. remote locations vary',workArrangement:'Unknown'}).arrangement,'Unknown');
});
test('filters recognize explicit mail titles and do not invent an internship season',()=>{const {jobTerm,roleFocus}=require('../data.js');assert.equal(jobTerm({jobTitle:'Software Engineer, Intern (Summer 2027) - US'}),'Summer 2027');assert.equal(jobTerm({term:'2027 · summer May/June start available'}),'Summer 2027');assert.equal(jobTerm({jobTitle:'Technology Intern'}),'');assert.equal(jobTerm({jobTitle:'Full Stack Co-op - Spring 2027'}),'Spring 2027');assert.equal(roleFocus({jobTitle:'Data Engineer Intern'}),'data');assert.equal(roleFocus({jobTitle:'AI-Enabled Full-Stack Intern'}),'ai');});
test('priority is DFW, confirmed remote, then other US locations',()=>{const {opportunityRank}=require('../data.js');const rows=[{id:'onsite',location:'San Francisco, CA',workArrangement:'Onsite'},{id:'possible',location:'San Francisco or remote, offer dependent',workArrangement:'Unknown'},{id:'remote',location:'United States',workArrangement:'Remote'},{id:'dfw',location:'Arlington, TX',workArrangement:'Onsite'}];rows.sort((a,b)=>opportunityRank(a)-opportunityRank(b));assert.deepEqual(rows.map(a=>a.id),['dfw','remote','onsite','possible']);});
test('international evidence needs an audited role source and cannot override restrictions',()=>{const {hasInternationalEvidence,internationalLabel}=require('../data.js');assert.equal(hasInternationalEvidence({sponsorsH1B:true}),false);const role={internationalStatus:'sponsorship',internationalEvidenceUrl:'https://example.com/role'};assert.equal(hasInternationalEvidence(role),true);assert.equal(hasInternationalEvidence({...role,degreeCheck:'incompatible'}),false);assert.equal(hasInternationalEvidence({...role,authStatus:'excluded'}),false);assert.match(internationalLabel(role),/confirm CPT/);assert.match(internationalLabel({internationalStatus:'cpt'}),/CPT stated/);});

test('a same-named city outside Texas is not sorted into DFW',()=>{for(const location of ['Bedford, NH','Dallas, GA','Austin, MN']){assert.equal(jobLocation({location}).dfw,false);assert.equal(jobLocation({location}).region,'other');}assert.equal(jobLocation({location:'Bedford, TX'}).dfw,true);assert.equal(jobLocation({location:'Westlake, TX; Durham, NC'}).dfw,true);});
