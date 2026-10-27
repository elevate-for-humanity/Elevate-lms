import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');

test('PARIS treats denied or rate-limited optional GitHub code search as discovery failure, not repair failure',()=>{
  assert.match(source,/if \(response\.status === 403 \|\| response\.status === 429\) \{\s*return \[\];\s*\}/);
  assert.match(source,/if \(action\.type === 'list'\)/);
  assert.match(source,/if \(action\.type === 'read' \|\| action\.type === 'list'\)/);
  assert.match(source,/await readFile\(action\.path, branch\)/);
  assert.match(source,/Repository path is not allowed/);
});
