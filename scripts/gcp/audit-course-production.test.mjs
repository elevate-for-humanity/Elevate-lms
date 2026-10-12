import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCourseProduction,courseErrorCategories} from './audit-course-production.mjs';
test('worker diagnostics classify causes without exposing raw runtime secrets',()=>{
  const sensitive='signed-token-value';
  assert.deepEqual(courseErrorCategories({textPayload:`LOCAL_TRANSCRIPTION SIGKILL ${sensitive}`}),['memory_exhaustion','local_transcription']);
  const report=auditCourseProduction(args=>args[0]==='run'?JSON.stringify({spec:{template:{spec:{template:{spec:{serviceAccountName:'worker',containers:[{image:'image@sha256:123',env:[{name:'SECRET',value:sensitive}],resources:{limits:{cpu:'8',memory:'32Gi'}}}]}}}}}}):JSON.stringify([{textPayload:`LOCAL_TRANSCRIPTION SIGKILL ${sensitive}`,timestamp:'2026-10-12T00:00:00Z'}]));
  assert.equal(report.job.resources.memory,'32Gi');
  assert.equal(JSON.stringify(report).includes(sensitive),false);
});
test('missing cloud read access is reported precisely without aborting independent readback',()=>{
  const report=auditCourseProduction(()=>{const error=new Error('sensitive CLI output');error.code='permission_denied';throw error;});
  assert.deepEqual(report.failures,[{operation:'job_readback',code:'permission_denied'},{operation:'worker_error_logs',code:'permission_denied'}]);
  assert.equal(JSON.stringify(report).includes('sensitive'),false);
});
