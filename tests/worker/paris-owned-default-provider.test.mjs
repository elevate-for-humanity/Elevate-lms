import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
test('PARIS engineering defaults to owned Elevate inference, not an unapproved paid provider',()=>{
 assert.match(source,/const provider=\(process\.env\.AI_PROVIDER\?\?'elevate'\)/);
 assert.doesNotMatch(source,/const provider=\(process\.env\.AI_PROVIDER\?\?'openai'\)/);
 assert.match(source,/provider==='elevate'\?null:await executePaidInference/);
});