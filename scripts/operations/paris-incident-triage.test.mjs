import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeIncident,buildIncidentReport} from './paris-incident-triage.mjs';

test('classifies external licensing and access blockers without claiming repairs',()=>{
 assert.equal(routeIncident({type:'failed'},{last_error:'ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED'}).route,'licensed-assets');
 assert.equal(routeIncident({type:'failed'},{last_error:'captions HTTP 401'}).route,'credentials');
});
test('routes code failures only to an already authorized PARIS review',()=>{
 const x=routeIncident({type:'failed'},{last_error:'SCENE_CONSTRUCTION_CHECKPOINT_FAILED'});
 assert.equal(x.route,'paris-review');assert.equal(x.automaticMutation,false);
});
test('creates incident evidence without authorizing repairs or mutating input',()=>{
 const snapshot={source:'verified-runtime-readonly',capturedAt:'2026-11-04T09:00:00Z',
   diagnostics:{alerts:[{type:'completed',jobId:'a'},{type:'failed',jobId:'b'}],
   byId:{a:{status:'completed'},b:{status:'failed',last_error:'CAPTION_HTTP_401'}}}};
 const before=JSON.stringify(snapshot);
 const r=buildIncidentReport(snapshot,{results:[{name:'admin-health',healthy:false}]});
 assert.equal(r.detectedCount,3);assert.equal(r.dispatchAuthorized,false);
 assert.ok(r.incidents.every(i=>i.automaticMutation===false));
 assert.equal(JSON.stringify(snapshot),before);
});
test('rejects unverified or malformed job evidence',()=>{
 assert.throws(()=>buildIncidentReport({source:'repository-code'}),/VERIFIED_JOB_EVIDENCE_REQUIRED/);
});
