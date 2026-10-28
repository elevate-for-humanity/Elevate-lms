import test from 'node:test';
import assert from 'node:assert/strict';
import {practicalServiceProgress} from '../../lib/apprenticeship/practical-service-progress.mjs';

test('program service targets count only verified aggregate rows and cap progress at each target',()=>{
 const result=practicalServiceProgress([
  {service_name:'Haircut',required_count:3,counts_for_completion:true},
  {service_name:'Basic facial',required_count:2,counts_for_completion:true},
  {service_name:'Optional style',required_count:4,counts_for_completion:false},
 ],[
  {service_name:'Haircut',recorded_count:7},
  {service_name:'Basic facial',recorded_count:1},
 ]);
 assert.equal(result.requiredCount,5);assert.equal(result.recordedCount,4);assert.equal(result.percent,80);assert.equal(result.complete,false);
 assert.equal(result.items.find(item=>item.service_name==='Haircut').complete,true);
 assert.equal(result.items.find(item=>item.service_name==='Optional style').complete,false);
});

test('programs without configured practice targets are not blocked',()=>{
 assert.deepEqual(practicalServiceProgress([],[]),{items:[],requiredCount:0,recordedCount:0,percent:100,complete:true});
});
