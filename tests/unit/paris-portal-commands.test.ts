import { beforeEach, expect, test, vi } from 'vitest';
import { resolvePortalNavigation } from '@/lib/paris/portal-navigation';
import { parsePortalReadCommand } from '@/lib/paris/portal-read-command';
const mocks = vi.hoisted(() => ({ holder: vi.fn(), role: vi.fn(), board: vi.fn() }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: mocks.holder }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.role }));
vi.mock('@/lib/partner/board', () => ({ getHostShopBoard: mocks.board }));
import { executePortalReadCommand } from '@/lib/paris/portal-read-tools';
beforeEach(() => vi.resetAllMocks());
test('questions and writes never become navigation or read actions', () => {
  for (const command of [
    'show how many pending applicants',
    'send an email to applicants',
    'update student hours',
    'open students and send them a message',
  ]) {
    expect(resolvePortalNavigation(command, '/program-holder/dashboard')).toBeNull();
  }
  expect(parsePortalReadCommand('approve all pending hours')).toBeNull();
  expect(parsePortalReadCommand('draft a summary of students')).toBeNull();
  expect(resolvePortalNavigation('open email', '/program-holder/dashboard')?.href).toBe(
    '/program-holder/email',
  );
  expect(resolvePortalNavigation('open messages', '/host-shop/dashboard')?.href).toBe(
    '/host-shop/dashboard/communications',
  );
});
test('holder counts use authenticated holder and assigned program scope, including preview', async () => {
  const calls: unknown[][] = [];
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((...args) => {
      calls.push(args);
      return query;
    }),
    in: vi.fn((...args) => {
      calls.push(args);
      return query;
    }),
    then: (resolve: (value: unknown) => unknown) => resolve({ count: 54, error: null }),
  };
  const from = vi.fn(() => query);
  mocks.holder.mockResolvedValue({
    mode: 'preview',
    holderId: 'holder-a',
    programIds: ['program-a'],
    db: { from },
  });
  expect(
    await executePortalReadCommand('How many pending applicants?', '/program-holder/dashboard'),
  ).toContain('Read-only preview: 54 applicants');
  expect(calls).toContainEqual(['program_holder_id', 'holder-a']);
  expect(calls).toContainEqual(['program_id', ['program-a']]);
  expect(from).toHaveBeenCalledWith('program_holder_students');
});
test('role checks fail closed before reading host records', async () => {
  mocks.role.mockRejectedValue(new Error('ACCESS_DENIED'));
  await expect(
    executePortalReadCommand('How many apprentices?', '/host-shop/dashboard'),
  ).rejects.toThrow('ACCESS_DENIED');
  expect(mocks.board).not.toHaveBeenCalled();
});
test('host counts use only the board owned by the authenticated user', async () => {
  mocks.role.mockResolvedValue({ user: { id: 'host-a' } });
  mocks.board.mockResolvedValue({ pendingHoursCount: 7, apprentices: [{}, {}] });
  expect(
    await executePortalReadCommand('How many pending hours?', '/host-shop/dashboard'),
  ).toContain('7 hour entries');
  expect(mocks.board).toHaveBeenCalledWith('host-a');
});
test('query failures do not become fabricated zero counts', async () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      resolve({ count: null, error: new Error('DB_UNAVAILABLE') }),
  };
  mocks.holder.mockResolvedValue({
    mode: 'holder',
    holderId: 'holder-a',
    programIds: ['program-a'],
    db: { from: () => query },
  });
  await expect(
    executePortalReadCommand('How many applicants?', '/program-holder/dashboard'),
  ).rejects.toThrow('DB_UNAVAILABLE');
});
