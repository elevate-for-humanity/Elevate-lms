import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const session = readFileSync('apps/admin/app/api/admin/dev-studio/browser/session/route.ts','utf8');
const agent = readFileSync('apps/admin/app/api/admin/dev-studio/browser/agent/route.ts','utf8');
test('both session GET and POST hydrate shared browser settings before reading environment',()=>{
 assert.match(session,/export async function GET[\s\S]*?await hydrateProcessEnv\(\);[\s\S]*?const config = configuration\(\)/);
 assert.match(session,/export async function POST[\s\S]*?await hydrateProcessEnv\(\);[\s\S]*?const config = configuration\(\)/);
});
test('health response must advertise ready instead of HTTP 200 alone',()=>{
 assert.match(session,/ready: response\.ok && health\?\.ready === true/);
});
test('browser agent respects canonical runtime secrets and does not ignore hydration errors',()=>{
 assert.match(agent,/await hydrateProcessEnv\(\);/);
 assert.doesNotMatch(agent,/hydrateProcessEnv\(\)\.catch\(\(\) => undefined\)/);
});
