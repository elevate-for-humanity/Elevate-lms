import test from 'node:test';
import assert from 'node:assert/strict';
import {businessRetailProjects as projects,businessRetailSections,businessRetailCase as scenario,checkBusinessRetailNumber as check} from './business-retail-workbook.mjs';
test('twenty distinct projects cover every published ESB v2 leaf objective and NRF public tasks',()=>{
 assert.equal(projects.length,20);assert.equal(new Set(projects.map(p=>p.id)).size,20);
 const esb=new Set(projects.flatMap(p=>p.esb));
 const counts={'1.1':7,'1.2':2,'1.3':2,'1.4':2,'1.5':2,'2.1':4,'2.2':5,'2.3':4,'3.1':2,'3.2':3,'3.3':2,'4.1':5,'4.2':3};
 const expected=Object.entries(counts).flatMap(([prefix,n])=>Array.from({length:n},(_,i)=>`${prefix}.${i+1}`));
 assert.deepEqual([...esb].sort(),expected.sort());
 const retail=new Set(projects.flatMap(p=>p.retail));
 for(const d of ['I','II','III'])for(let i=1;i<=4;i++)assert.ok(retail.has(`BOR-${d}-${i}`));
 for(const p of projects){assert.equal(p.tasks.length,3);assert.equal(p.choices.length,3);assert.ok(Number.isInteger(p.correct)&&p.correct>=0&&p.correct<3);assert.ok(p.teaching.length>170);assert.ok(p.explanation.length>40);}
 for(const s of businessRetailSections()){assert.equal(s.prompts.length,3);for(const p of s.prompts)assert.ok(p.length>160&&p.length<6000);}
});
test('independent accounting and operating figures are correct',()=>{
 assert.deepEqual(scenario('pricing').checks.map(x=>x[1]),[40,27,28.89]);
 assert.deepEqual(scenario('inventory').checks.map(x=>x[1]),[43,30,37]);
 assert.deepEqual(scenario('promotion').checks.map(x=>x[1]),[32,360,400]);
 assert.deepEqual(scenario('profit').checks.map(x=>x[1]),[9500,4500,2000]);
 assert.deepEqual(scenario('break-even').checks.map(x=>x[1]),[20,125]);
 assert.deepEqual(scenario('cash').checks.map(x=>x[1]),[700,-300]);
 assert.deepEqual(scenario('funding').checks.map(x=>x[1]),[7000,4500]);
 assert.deepEqual(scenario('roi').checks.map(x=>x[1]),[1000,50]);
 assert.deepEqual(scenario('marketing').checks.map(x=>x[1]),[20,5]);
 for(const p of projects)for(let v=0;v<3;v++)for(const c of scenario(p.math,v).checks)assert.ok(Number.isFinite(c[1]));
 assert.throws(()=>scenario('pricing',3));assert.throws(()=>scenario('pricing',-1));
});
test('blank, malformed and incorrect inputs never pass; cents rounding is allowed',()=>{
 for(const value of ['', ' ', 'NaN','Infinity','no','39.9'])assert.equal(check(value,40),false);
 assert.equal(check('40.00',40),true);assert.equal(check('66.67',200/3),true);assert.equal(check('0',0),true);
});
