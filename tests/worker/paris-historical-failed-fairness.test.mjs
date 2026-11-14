import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
test('PARIS scans historical failed jobs using rotated bounded pages',()=>{
 const from=source.indexOf('const failedPageSize=20;');
 const through=source.indexOf('for(const job of failedJobs.data??[])',from);
 assert.ok(from>=0 && through>from);
 const scan=source.slice(from,through);
 assert.match(scan,/count:'exact'/);
 assert.match(scan,/Math\.floor\(Date\.now\(\)\/600000\)%failedPages/);
 assert.match(scan,/\.range\(failedPage\*failedPageSize,\(failedPage\+1\)\*failedPageSize-1\)/);
 assert.doesNotMatch(scan,/\.gte\('updated_at'/);
 assert.doesNotMatch(scan,/\.limit\(5\)/);
});
