import test from 'node:test';
import assert from 'node:assert/strict';
import {courseWorkerLogEvidence as evidence} from './course-worker-log-evidence.mjs';
test('a numeric identifier is not an HTTP quota rejection',()=>{
 assert.equal(evidence('worker=autopilot-media-429abcd').categories.includes('photo_provider_failure'),false);
 for(const value of ['GOOGLE_TEACHING_PHOTO_HTTP_429','HTTP 429',JSON.stringify({status:429})])assert.ok(evidence(value).categories.includes('photo_provider_failure'));
});
test('startup module and authentication failures expose bounded diagnostic evidence',()=>{
 assert.deepEqual(evidence("Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'tsx'").missingModule,'tsx');
 assert.ok(evidence('[UltimateWorker] fatal Invalid API key').categories.includes('runtime_failure'));
 assert.equal(evidence('[UltimateWorker] fatal Invalid API key').messageClass,'invalid_database_key');
});
test('configuration and signed URLs never become diagnostic output',()=>{
 const result=JSON.stringify(evidence('[UltimateWorker] fatal {token:Bearer secret-value,url:https://private.example/object?signature=private-value}'));
 assert.doesNotMatch(result,/secret-value|private-value|private.example/);
});
