import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const registry=readFileSync(new URL('../../lib/ai/tools/registry.ts',import.meta.url),'utf8');
const studio=readFileSync(new URL('../../apps/admin/app/api/admin/dev-studio/execute/route.ts',import.meta.url),'utf8');
test('studio engineering admits PARIS and historical AI specialists',()=>{
 const block=registry.slice(registry.indexOf("name: 'studio.engineering.execute'"),registry.indexOf("name: 'applications.search'"));
 assert.match(block,/allowedAgents: \['PARIS', 'ELLIE', 'LIZZY', 'ZORA'\]/);
 assert.match(block,/allowedRoles: PRIVILEGED_ADMIN_ROLES/);
});
test('studio uses canonical PARIS tool identity with executor authorization',()=>{
 assert.match(studio,/canAgentUseTool\(tool, 'PARIS'\)/);
 assert.match(studio,/return 'ROUTER'/);
 assert.match(studio,/executeRegisteredAITool\(tool.name/);
});
