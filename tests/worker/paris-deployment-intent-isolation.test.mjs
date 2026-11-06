import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
test('deployment intents are keyed by exact target SHA',()=>{
 assert.match(code,/deploymentIntentBySha\?\.\[targetSha\]/);
 assert.match(code,/deploymentIntentBySha:\{\.\.\.repair\.verification\?\.deploymentIntentBySha,\[targetSha\]:/);
 assert.match(code,/targetSha===repair\.release_sha\?/);
});
