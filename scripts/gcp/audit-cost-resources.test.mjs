import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCostResources} from './audit-cost-resources.mjs';

test('inventory is read-only, reports review candidates and excludes secrets',()=>{
  const calls=[];
  const report=auditCostResources({run:args=>{
    calls.push(args);
    if(args[0]==='asset')return JSON.stringify([{name:'projects/p/services/elevate-studio-browser',assetType:'run.googleapis.com/Service'},
      {name:'projects/p/instances/elevate-studio-browser',assetType:'compute.googleapis.com/Instance'}]);
    if(args[1]==='instances')return JSON.stringify([{name:'browser',status:'RUNNING',machineType:'zones/a/machineTypes/e2-standard-2',metadata:{secret:'private-fixture'}}]);
    if(args[1]==='disks')return JSON.stringify([{name:'unused',sizeGb:'10',users:[]},{name:'attached',users:['vm']}]);
    if(args[1]==='addresses')return JSON.stringify([{name:'reserved',status:'RESERVED',address:'private-fixture'}]);
    return '[]';
  }});
  assert.ok(calls.every(args=>args.includes('list')||args.includes('search-all-resources')));
  assert.equal(calls.length,8);
  assert.deepEqual(report.review.map(x=>x.kind),['unattached_disk','reserved_address','multiple_browser_platforms']);
  assert.equal(JSON.stringify(report).includes('private-fixture'),false);
  assert.equal(report.sections.virtualMachines.resources[0].machineType,'e2-standard-2');
});
test('permission failure and malformed inventories are explicit, never reported as zero resources',()=>{
  const report=auditCostResources({run:args=>{if(args[0]==='asset')throw Error('TOKEN=private-fixture');return '{}';}});
  for(const section of Object.values(report.sections)) {
    assert.equal(section.available,false);
    assert.equal(section.resources,undefined);
    assert.equal(section.count,undefined);
  }
  assert.equal(JSON.stringify(report).includes('private-fixture'),false);
  assert.deepEqual(report.review,[]);
});
