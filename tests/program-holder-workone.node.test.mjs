import test from 'node:test';
import assert from 'node:assert/strict';
import { programHolderWorkOneEmail } from '../lib/email/templates/program-holder-workone.ts';

test('CDL outreach uses the assigned program and requests every WorkOne status', () => {
  const email = programHolderWorkOneEmail({ applicantName: 'Alex Driver', programTitle: 'CDL Training', bookingUrl: 'https://workone.example/booking' });
  assert.match(email.subject, /CDL Training/);
  assert.doesNotMatch(email.html, /HVAC|INDY ON DEMAND/);
  for (const status of ['not scheduled', 'appointment scheduled', 'already attended', 'pending', 'denied']) assert.ok(email.text.includes(status));
  assert.ok(email.html.includes('https://workone.example/booking'));
});

test('other programs retain their own title and applicant input cannot inject HTML', () => {
  const email = programHolderWorkOneEmail({ applicantName: '<script>alert(1)</script>', programTitle: 'HVAC & Refrigeration', bookingUrl: 'https://workone.example/booking' });
  assert.match(email.subject, /HVAC & Refrigeration/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /HVAC &amp; Refrigeration/);
});

test('missing assigned program is rejected instead of guessing a program', () => {
  assert.throws(() => programHolderWorkOneEmail({ applicantName: '', programTitle: ' ', bookingUrl: 'https://workone.example/booking' }), /Assigned program/);
});
