import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresHumanVerification, redactBrowserEvidence } from './provider-verification.mjs';
test('recognizes the visible provider challenge, not a bare status or ordinary login', () => {
  assert.equal(requiresHumanVerification({visibleText:'elements.envato.com Performing security verification Verify you are human Cloudflare'}), true);
  assert.equal(requiresHumanVerification({visibleText:'Please sign in to download',status:403}), false);
  assert.equal(requiresHumanVerification({visibleText:'Network timeout',status:429}), false);
  assert.equal(requiresHumanVerification({visibleText:'Help: solving CAPTCHAs',title:'Help center'}), false);
});
test('redacts URL query secrets, fragments and challenge path tokens from evidence', () => {
  const text = '403 https://elements.envato.com/sign-in/with-token?token=fake-secret#code=private and https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/pat/fake-private-path';
  const result = redactBrowserEvidence(text);
  assert.ok(result.includes('https://elements.envato.com/sign-in/with-token'));
  for (const secret of ['fake-secret','private','fake-private-path']) assert.equal(result.includes(secret),false);
});
test('redacts named secret assignments and bearer tokens', () => {
  const result=redactBrowserEvidence('password=secret-one access_token: secret-two Authorization: Bearer secret-three');
  for(const secret of ['secret-one','secret-two','secret-three'])assert.equal(result.includes(secret),false);
});
