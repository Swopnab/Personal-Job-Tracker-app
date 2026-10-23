const {test}=require('node:test');
const assert=require('node:assert/strict');
const {jobLocation}=require('../data.js');
test('DFW ranking uses the job location and distinguishes other Texas cities',()=>{
 for(const location of ['Plano','Fort Worth, TX','Dallas, Texas','Irving, TX','Arlington, TX'])assert.equal(jobLocation({location}).region,'dfw');
 assert.equal(jobLocation({location:'Austin, TX'}).region,'texas');
 assert.equal(jobLocation({location:'Arlington, VA'}).region,'other');
 assert.equal(jobLocation({location:'See posting'}).region,'unknown');
});
test('work arrangement requires explicit evidence; city alone is not onsite',()=>{
 assert.equal(jobLocation({location:'Fort Worth, TX'}).arrangement,'Unknown');
 assert.equal(jobLocation({location:'Remote - United States'}).arrangement,'Remote');
 assert.equal(jobLocation({location:'Dallas, TX',workArrangement:'Hybrid'}).arrangement,'Hybrid');
 assert.equal(jobLocation({location:'On-site, Plano'}).arrangement,'Onsite');
});
