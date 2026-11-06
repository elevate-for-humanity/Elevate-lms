import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../components/admin/course-builder/CoursePipelineDiagram.tsx',import.meta.url),'utf8');

test('pipeline refuses a second request while the first remains in flight',()=>{
 assert.match(source,/const pendingRequest = useRef\(false\)/);
 assert.match(source,/if \(!courseId \|\| pendingRequest\.current\) return/);
 assert.match(source,/pendingRequest\.current = true/);
 assert.match(source,/finally \{\s*pendingRequest\.current = false/);
});

test('pipeline skips hidden-tab polling and uses 30-second refresh',()=>{
 assert.match(source,/document\.visibilityState === ["']visible["']/);
 assert.match(source,/\}, 30000\)/);
 assert.doesNotMatch(source,/\}, 15000\)/);
});

test('lesson detail fetch is not restarted by each 30-second checkpoint poll',()=>{
 const inspector=readFileSync(new URL('../../components/admin/course-builder/UltimateStageInspector.tsx',import.meta.url),'utf8');
 assert.match(inspector,/\},\[buildId,selectedLesson,updatedAt\]\)/);
 assert.doesNotMatch(inspector,/\},\[buildId,selectedLesson,updatedAt,retry\]\)/);
});
