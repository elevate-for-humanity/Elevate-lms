import { describe, expect, it, vi } from 'vitest';
import {
  assignedStudentDirectory,
  assignedInstructorDirectory,
} from '@/lib/email/assigned-student-directory';
function database(
  holders: any[],
  students: any[],
  acknowledged = true,
  enrollments: any[] = [],
  profiles: any[] = [],
) {
  const holderQuery: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: any) => Promise.resolve({ data: holders }).then(resolve),
  };
  const studentQuery: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    returns: vi.fn().mockImplementation(() => {
      const call = studentQuery.range.mock.calls.at(-1);
      return Promise.resolve({ data: students.slice(call[0], call[1] + 1) });
    }),
  };
  const enrollmentQuery: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    returns: vi.fn().mockImplementation(() => {
      const call = enrollmentQuery.range.mock.calls.at(-1);
      return Promise.resolve({ data: enrollments.slice(call[0], call[1] + 1) });
    }),
  };
  const acknowledgementQuery: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi
      .fn()
      .mockResolvedValue({ data: acknowledged ? [{ document_type: 'non_compete' }] : [] }),
  };
  return {
    db: {
      from: vi.fn((table: string) =>
        table === 'program_holders'
          ? holderQuery
          : table === 'program_holder_acknowledgements'
            ? acknowledgementQuery
            : table === 'profiles'
              ? {
                  select: vi.fn().mockReturnThis(),
                  in: vi.fn().mockResolvedValue({ data: profiles }),
                }
              : table === 'program_enrollments'
                ? enrollmentQuery
                : studentQuery,
      ),
    },
    holderQuery,
    studentQuery,
    enrollmentQuery,
  };
}
describe('assigned student email suggestions', () => {
  it('scopes contact suggestions to the active holder and assigned roster', async () => {
    const { db, holderQuery, studentQuery } = database(
      [{ id: 'holder-1' }],
      [
        {
          id: 'student-1',
          applicant_name: 'Assigned Student',
          applicant_email: 'student@example.com',
        },
        { id: 'student-2', applicant_name: 'No Email', applicant_email: null },
      ],
    );
    expect(await assignedStudentDirectory(db as any, 'holder-user')).toEqual([
      {
        id: 'program_holder_students-student-1',
        address: 'student@example.com',
        display_name: 'Assigned Student',
        mailbox_kind: 'individual',
      },
    ]);
    expect(holderQuery.eq).toHaveBeenCalledWith('user_id', 'holder-user');
    expect(holderQuery.eq).toHaveBeenCalledWith('status', 'active');
    expect(studentQuery.in).toHaveBeenCalledWith('program_holder_id', ['holder-1']);
    expect(studentQuery.in).toHaveBeenCalledWith('status', [
      'applicant',
      'applied',
      'pending',
      'enrolled',
      'active',
      'completed',
      'graduated',
    ]);
  });
  it('does not query student contacts for an unrelated account', async () => {
    const { db, studentQuery } = database([], []);
    expect(await assignedStudentDirectory(db as any, 'student-user')).toEqual([]);
    expect(studentQuery.select).not.toHaveBeenCalled();
  });
});

it('offers only the student assigned instructor active course mailbox', async () => {
  const assignments: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [{ program_holder_id: 'holder-1' }] }),
  };
  const holders: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi
      .fn()
      .mockResolvedValue({ data: [{ id: 'holder-1', contact_name: 'Course Instructor' }] }),
  };
  const mailboxes: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: any) =>
      Promise.resolve({
        data: [{ id: 'mailbox-1', address: 'course@example.com', program_holder_id: 'holder-1' }],
      }).then(resolve),
  };
  const db = {
    from: vi.fn((table: string) =>
      table === 'program_holder_students'
        ? assignments
        : table === 'program_holders'
          ? holders
          : mailboxes,
    ),
  };
  expect(await assignedInstructorDirectory(db as any, 'student-user')).toEqual([
    {
      id: 'mailbox-1',
      address: 'course@example.com',
      display_name: 'Course Instructor',
      mailbox_kind: 'program_holder',
    },
  ]);
  expect(assignments.eq).toHaveBeenCalledWith('user_id', 'student-user');
  expect(mailboxes.in).toHaveBeenCalledWith('program_holder_id', ['holder-1']);
  expect(mailboxes.eq).toHaveBeenCalledWith('active', true);
});

it('keeps protected contacts hidden until agreements are signed', async () => {
  const { db, studentQuery } = database([{ id: 'holder-1' }], [], false);
  expect(await assignedStudentDirectory(db as any, 'holder-user')).toEqual([]);
  expect(studentQuery.select).not.toHaveBeenCalled();
});
it('preserves names-only partner contact restrictions', async () => {
  const { db, studentQuery } = database(
    [{ id: 'holder-1', organization_name: 'Enchanted Hearts' }],
    [],
  );
  expect(await assignedStudentDirectory(db as any, 'holder-user')).toEqual([]);
  expect(studentQuery.select).not.toHaveBeenCalled();
});

it('includes canonical enrolled and graduated students, deduplicates applicant email, and excludes revoked enrollment rows in the query', async () => {
  const { db, enrollmentQuery } = database(
    [{ id: 'holder-1' }],
    [{ id: 'a', applicant_name: 'Duplicate', applicant_email: 'STUDENT@example.com' }],
    true,
    [
      { id: 'e', full_name: 'Enrolled learner', email: 'student@example.com' },
      { id: 'g', full_name: 'Graduate', email: 'grad@example.com' },
      { id: 'missing', full_name: 'Missing', email: null },
    ],
  );
  const result = await assignedStudentDirectory(db as any, 'holder-user');
  expect(result.map((r) => r.address)).toEqual(['student@example.com', 'grad@example.com']);
  expect(result[0].display_name).toBe('Enrolled learner');
  expect(enrollmentQuery.in).toHaveBeenCalledWith('program_holder_id', ['holder-1']);
  expect(enrollmentQuery.is).toHaveBeenCalledWith('revoked_at', null);
});

it('loads later roster pages and uses only linked account emails when enrollment contact is missing', async () => {
  const enrollments = Array.from({ length: 501 }, (_, i) => ({
    id: 'e' + i,
    full_name: 'Student ' + i,
    email: 'student' + i + '@example.com',
  }));
  enrollments[500] = {
    id: 'last',
    full_name: 'Linked account',
    email: null,
    user_id: 'owned-user',
  } as any;
  const { db, enrollmentQuery } = database([{ id: 'holder-1' }], [], true, enrollments, [
    { id: 'owned-user', email: 'linked@example.com' },
  ]);
  const result = await assignedStudentDirectory(db as any, 'holder-user');
  expect(result).toHaveLength(501);
  expect(result.some((row) => row.address === 'linked@example.com')).toBe(true);
  expect(enrollmentQuery.range).toHaveBeenCalledWith(500, 999);
});
