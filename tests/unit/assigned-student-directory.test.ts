import { describe, expect, it, vi } from 'vitest';
import {
  assignedStudentDirectory,
  assignedInstructorDirectory,
} from '@/lib/email/assigned-student-directory';
function database(holders: any[], students: any[], acknowledged = true) {
  const holderQuery: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: any) => Promise.resolve({ data: holders }).then(resolve),
  };
  const studentQuery: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: students }),
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
            : studentQuery,
      ),
    },
    holderQuery,
    studentQuery,
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
        id: 'student-student-1',
        address: 'student@example.com',
        display_name: 'Assigned Student',
        mailbox_kind: 'individual',
      },
    ]);
    expect(holderQuery.eq).toHaveBeenCalledWith('user_id', 'holder-user');
    expect(holderQuery.eq).toHaveBeenCalledWith('status', 'active');
    expect(studentQuery.in).toHaveBeenCalledWith('program_holder_id', ['holder-1']);
    expect(studentQuery.in).toHaveBeenCalledWith('status', ['applied', 'pending', 'enrolled']);
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
