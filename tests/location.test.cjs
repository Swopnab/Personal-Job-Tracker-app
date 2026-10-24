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
