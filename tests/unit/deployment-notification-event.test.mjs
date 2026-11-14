import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDeploymentEvent } from '../../scripts/deployment-notification-event.mjs';
const event = (url, state = 'success') => ({ deployment_status: { state, environment_url: url } });
test('health-check only exact production service origins', () => {
  for (const host of ['www', 'app', 'admin']) {
    assert.deepEqual(classifyDeploymentEvent(event(`https://${host}.elevateforhumanity.org/path?token=private`)),
      { notify: true, origin: `https://${host}.elevateforhumanity.org`, reason: 'Terminal production website deployment.' });
  }
});
test('non-website job execution statuses do not create false health failures', () => {
  assert.equal(classifyDeploymentEvent(event('https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37825975045/job/113616331662')).notify, false);
});
test('unknown hosts, misleading prefixes, credentials and invalid URLs still fail', () => {
  for (const url of [undefined, 'invalid', 'http://app.elevateforhumanity.org',
    'https://app.elevateforhumanity.org.attacker.example',
    'https://secret@app.elevateforhumanity.org', 'https://app.elevateforhumanity.org:8443',
    'https://github.com/other/repo/actions/runs/1']) {
    assert.throws(() => classifyDeploymentEvent(event(url)));
  }
});
test('nonterminal and manually dispatched events skip notifications', () => {
  assert.equal(classifyDeploymentEvent(event(undefined, 'in_progress')).notify, false);
  assert.equal(classifyDeploymentEvent({}).notify, false);
});
