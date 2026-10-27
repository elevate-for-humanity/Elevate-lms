import {test} from 'node:test';import assert from 'node:assert/strict';
import {contiguousRenderSegments} from './progressive-segments.mjs';
const lessonId='a3cc313b-beee-453c-84af-f84cf3bbead7',startedAt='2026-10-18T11:00:00Z';
const row=(start,end,fingerprint='a'.repeat(24),updatedAt='2026-10-18T11:47:00Z')=>({key:`course-render-checkpoints/${lessonId}/${fingerprint}/${start}-${end}.mp4`,bytes:100,updatedAt});
test('plays contiguous completed portions in frame order and stops at a missing portion',()=>{
 const rows=contiguousRenderSegments([row(1800,2699),row(0,899),row(900,1799),row(3600,4499)],{lessonId,startedAt});
 assert.deepEqual(rows.map(r=>r.start),[0,900,1800]);
});
test('never combines stale renders, fingerprints, another lesson, or malformed object names',()=>{
 const rows=contiguousRenderSegments([row(0,899,'b'.repeat(24),'2026-10-17T11:47:00Z'),row(900,1799,'b'.repeat(24)),row(0,899),{...row(900,1799),key:row(900,1799).key.replace(lessonId,'other')},row(900,9000),row(900,1799,'../bad'),{...row(900,1799),updatedAt:'invalid'}],{lessonId,startedAt});
 assert.deepEqual(rows.map(r=>r.start),[0]);
 assert.deepEqual(contiguousRenderSegments([row(0,899)],{lessonId,startedAt:'invalid'}),[]);
});
