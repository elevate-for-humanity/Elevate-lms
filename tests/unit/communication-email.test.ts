import { describe, expect, it } from 'vitest';
import {
  isActiveEmailProfile,
  isStaffMailboxRole,
  normalizeEmailSubject,
  parseEmailList,
  selectPrimaryMailbox,
} from '@/lib/email/communication-email';

describe('communication email eligibility', () => {
  it('limits personal mailboxes to operational staff roles', () => {
    expect(isStaffMailboxRole('case_manager')).toBe(true);
    expect(isStaffMailboxRole('Instructor')).toBe(true);
    expect(isStaffMailboxRole('program_holder')).toBe(false);
    expect(isStaffMailboxRole('host_shop_admin')).toBe(false);
    expect(isStaffMailboxRole('student')).toBe(false);
  });

  it('rejects inactive and non-production staff identities', () => {
    expect(
      isActiveEmailProfile({
        email: 'counselor@elevateforhumanity.org',
        fullName: 'Career Counselor',
        isActive: true,
        status: 'active',
      }),
    ).toBe(true);
    expect(
      isActiveEmailProfile({
        email: 'test.counselor@elevateforhumanity.org',
        fullName: 'Test Counselor',
        isActive: true,
        status: 'active',
      }),
    ).toBe(false);
    expect(
      isActiveEmailProfile({
        email: 'former@elevateforhumanity.org',
        fullName: 'Former Employee',
        isActive: false,
        status: 'archived',
      }),
    ).toBe(false);
  });
});

describe('communication email helpers', () => {
  it('normalizes reply prefixes and recipient lists', () => {
    expect(normalizeEmailSubject('RE: Fwd: Student placement')).toBe('student placement');
    expect(parseEmailList('one@example.com; Two <two@example.org>, one@example.com')).toEqual([
      'one@example.com',
      'two@example.org',
    ]);
  });

  it('prefers organization mailboxes over personal and shared mailboxes', () => {
    expect(
      selectPrimaryMailbox([
        { id: 'department', mailboxKind: 'department' },
        { id: 'individual', mailboxKind: 'individual' },
        { id: 'shop', mailboxKind: 'host_shop' },
      ])?.id,
    ).toBe('shop');
    expect(
      selectPrimaryMailbox([
        { id: 'department', mailboxKind: 'department' },
        { id: 'holder', mailboxKind: 'program_holder' },
      ])?.id,
    ).toBe('holder');
  });
});
