import { expect, it } from 'vitest';
import {
  applicantDisplayName,
  applicantIdentityKeys,
  buildHolderStudentRow,
  isAssignableHolderStatus,
  selectReferralBatch,
  type ApplicantRow,
} from '@/lib/program-holder/applicant-assignment';

function app(overrides: Partial<ApplicantRow> & { id: string }): ApplicantRow {
  return {
    full_name: 'Test Applicant ' + overrides.id,
    email: 'test@example.com',
    phone: '(317) 555-0100',
    program_slug: 'cna',
    status: 'submitted',
    created_at: '2026-06-14T10:00:00Z',
    ...overrides,
  };
}

it('selects the earliest-submitted applications first, up to the limit', () => {
  const rows = [
    app({ id: 'c', created_at: '2026-07-07T10:00:00Z', email: 'c@example.com' }),
    app({ id: 'a', created_at: '2026-06-14T10:00:00Z', email: 'a@example.com' }),
    app({ id: 'b', created_at: '2026-06-20T10:00:00Z', email: 'b@example.com' }),
  ];
  const { selected } = selectReferralBatch(rows, { limit: 2 });
  expect(selected.map((row) => row.id)).toEqual(['a', 'b']);
});

it('never picks at random: the same input always yields the same batch', () => {
  const rows = [
    app({ id: 'z', created_at: '2026-07-01T10:00:00Z', email: 'z@example.com' }),
    app({ id: 'y', created_at: '2026-06-15T10:00:00Z', email: 'y@example.com' }),
    app({ id: 'x', created_at: '2026-06-16T10:00:00Z', email: 'x@example.com' }),
  ];
  const first = selectReferralBatch(rows, { limit: 2 });
  const second = selectReferralBatch([...rows].reverse(), { limit: 2 });
  expect(first.selected.map((row) => row.id)).toEqual(second.selected.map((row) => row.id));
});

it('deduplicates the same person under two different emails', () => {
  // The live admin list has this exact shape: the same name twice under
  // different emails. The later application must be reported as a
  // duplicate, not assigned twice.
  const rows = [
    app({ id: 'first', created_at: '2026-06-14T10:00:00Z', full_name: 'Maya Hansboro', email: 'maya@example.com' }),
    app({ id: 'second', created_at: '2026-07-01T10:00:00Z', full_name: 'Maya Hansboro', email: 'maya.h@example.com' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, { limit: 50 });
  expect(selected.map((row) => row.id)).toEqual(['first']);
  expect(skipped.duplicate.map((row) => row.id)).toEqual(['second']);
});

it('deduplicates by email and by platform user id', () => {
  const rows = [
    app({ id: 'one', email: 'same@example.com', user_id: 'user-1' }),
    app({ id: 'two', email: 'same@example.com', full_name: 'Someone Else' }),
    app({ id: 'three', email: 'other@example.com', user_id: 'user-1' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, { limit: 50 });
  expect(selected.map((row) => row.id)).toEqual(['one']);
  expect(skipped.duplicate.map((row) => row.id)).toEqual(['three', 'two']);
});

it('excludes applications already assigned to any holder', () => {
  const rows = [
    app({ id: 'assigned', email: 'assigned@example.com' }),
    app({ id: 'free', email: 'free@example.com' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, {
    limit: 50,
    alreadyAssignedApplicationIds: new Set(['assigned']),
  });
  expect(selected.map((row) => row.id)).toEqual(['free']);
  expect(skipped.alreadyAssigned.map((row) => row.id)).toEqual(['assigned']);
});

it('excludes the same person already assigned under a different application', () => {
  const rows = [
    app({ id: 'new-app', email: 'person@example.com', full_name: 'Guy Akionla' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, {
    limit: 50,
    alreadyAssignedKeys: new Set(['email:person@example.com']),
  });
  expect(selected).toEqual([]);
  expect(skipped.duplicate.map((row) => row.id)).toEqual(['new-app']);
});

it('excludes applicants who are already enrolled', () => {
  const rows = [
    app({ id: 'enrolled', user_id: 'user-9', email: 'enrolled@example.com' }),
    app({ id: 'fresh', user_id: 'user-10', email: 'fresh@example.com' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, {
    limit: 50,
    enrolledUserIds: new Set(['user-9']),
  });
  expect(selected.map((row) => row.id)).toEqual(['fresh']);
  expect(skipped.alreadyEnrolled.map((row) => row.id)).toEqual(['enrolled']);
});

it('excludes rejected, withdrawn, and revoked applications and reports why', () => {
  const rows = [
    app({ id: 'rejected', status: 'rejected', email: 'r@example.com' }),
    app({ id: 'withdrawn', status: 'withdrawn', email: 'w@example.com' }),
    app({ id: 'revoked', status: 'submitted', revoked_at: '2026-07-01T00:00:00Z', email: 'v@example.com' }),
    app({ id: 'ok', status: 'submitted', email: 'ok@example.com' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, { limit: 50 });
  expect(selected.map((row) => row.id)).toEqual(['ok']);
  expect(skipped.wrongStatus.map((row) => row.id)).toEqual(['rejected', 'withdrawn']);
  expect(skipped.revoked.map((row) => row.id)).toEqual(['revoked']);
});

it('reports eligible applicants past the limit instead of silently dropping them', () => {
  const rows = [
    app({ id: 'one', created_at: '2026-06-14T10:00:00Z', email: 'one@example.com' }),
    app({ id: 'two', created_at: '2026-06-15T10:00:00Z', email: 'two@example.com' }),
    app({ id: 'three', created_at: '2026-06-16T10:00:00Z', email: 'three@example.com' }),
  ];
  const { selected, skipped } = selectReferralBatch(rows, { limit: 2 });
  expect(selected.map((row) => row.id)).toEqual(['one', 'two']);
  expect(skipped.beyondLimit.map((row) => row.id)).toEqual(['three']);
});

it('treats approved_pending_mou holders as assignable', () => {
  // Achieve: approved, only the MOU signature is outstanding.
  expect(isAssignableHolderStatus('approved_pending_mou')).toBe(true);
  expect(isAssignableHolderStatus('approved')).toBe(true);
  expect(isAssignableHolderStatus('active')).toBe(true);
  expect(isAssignableHolderStatus('pending')).toBe(false);
  expect(isAssignableHolderStatus('suspended')).toBe(false);
  expect(isAssignableHolderStatus('rejected')).toBe(false);
  expect(isAssignableHolderStatus(null)).toBe(false);
});

it('builds the holder projection row the portal reads', () => {
  const row = buildHolderStudentRow(
    'acc9f5ab-8804-432e-9b12-aac1a6c86426',
    'program-cna-id',
    app({
      id: 'app-1',
      user_id: 'user-1',
      full_name: 'Wideline Cius',
      email: 'WidelineCius0526@Gmail.com',
      status: 'submitted',
    }),
  );
  expect(row.program_holder_id).toBe('acc9f5ab-8804-432e-9b12-aac1a6c86426');
  expect(row.application_id).toBe('app-1');
  expect(row.program_id).toBe('program-cna-id');
  expect(row.applicant_name).toBe('Wideline Cius');
  expect(row.applicant_email).toBe('widelinecius0526@gmail.com');
  expect(row.status).toBe('applied');
  expect(row.application_status).toBe('submitted');
});

it('derives a display name from first/last name when no full name exists', () => {
  expect(
    applicantDisplayName({ id: 'x', first_name: 'Reese', last_name: 'Ewing' }),
  ).toBe('Reese Ewing');
  expect(applicantIdentityKeys({ id: 'x', first_name: 'Reese', last_name: 'Ewing' })).toContain(
    'name:reese ewing',
  );
});
