import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseAccess, summarizeAccess } from './diagnose-access.mjs';

test('diagnostics exclude credentials, policy members and provider response messages', () => {
  const result = summarizeAccess('secretMetadata', { status: 403, ok: false }, {
    error: { status: 'PERMISSION_DENIED', message: 'sensitive-payload', details: [{
      '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'IAM_PERMISSION_DENIED',
      metadata: { permission: 'secretmanager.secrets.list', secret: 'sensitive-payload' },
    }] },
  });
  assert.equal(result.permission, 'secretmanager.secrets.list');
  assert.equal(JSON.stringify(result).includes('sensitive-payload'), false);
});
test('inventory access does not imply authority to grant IAM', async () => {
  const report = await diagnoseAccess('private-token', async url => new Response(JSON.stringify(
    url.endsWith(':testIamPermissions') ? { permissions: ['secretmanager.secrets.list'] } : {},
  )));
  assert.equal(report.canPrepareAccess, false);
  assert.ok(report.missing.includes('resourcemanager.projects.setIamPolicy'));
  assert.equal(report.checks.length, 6);
  assert.equal(JSON.stringify(report).includes('private-token'), false);
});
