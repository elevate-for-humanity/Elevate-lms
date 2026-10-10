export interface ProgressHoursEntry {
  id: string;
  apprentice_id: string;
  program_id: string;
  status: string;
  work_date: string;
  week_ending: string;
  hours_worked: number | string;
  notes: string | null;
  tasks_completed: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
}
export interface HoursApprentice {
  id: string;
  user_id: string;
  program_id: string;
  total_hours_required: number | null;
  status: string;
  start_date: string | null;
  enrollment_date: string | null;
}
export interface HoursProgram {
  id: string;
  slug: string;
  name: string | null;
  title: string | null;
  total_hours: number | null;
  required_hours: number | null;
}
export interface HoursProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}
export interface AdminHoursEntry extends ProgressHoursEntry {
  student_id: string;
  program_key: string;
  program_title: string;
  name: string;
  email: string | null;
  required_hours: number | null;
  hours_worked: number;
  approval_blocker: string | null;
}
const normalized = (value: string) => value.trim().toLowerCase();
export const roundHours = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

// Date-only database values must not shift to the previous day in the browser.
export function formatHoursDate(value: string | null) {
  if (!value) return '—';
  return new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function hydrateAdminHours(
  rows: ProgressHoursEntry[],
  apprentices: HoursApprentice[],
  programs: HoursProgram[],
  profiles: HoursProfile[],
): AdminHoursEntry[] {
  const apprenticeById = new Map(apprentices.map((a) => [a.id, a]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const programByRef = new Map<string, HoursProgram>();
  for (const program of programs) {
    programByRef.set(normalized(program.id), program);
    if (program.slug) programByRef.set(normalized(program.slug), program);
  }
  const entries = rows.map((row) => {
    const studentId = apprenticeById.get(row.apprentice_id)?.user_id ?? row.apprentice_id;
    const profile = profileById.get(studentId);
    const program = programByRef.get(normalized(row.program_id));
    const enrollment = apprentices.find(
      (a) => a.user_id === studentId && a.program_id === program?.id,
    );
    const required =
      [enrollment?.total_hours_required, program?.required_hours, program?.total_hours]
        .map(Number)
        .find((hours) => Number.isFinite(hours) && hours > 0) ?? null;
    const hours = Number(row.hours_worked);
    let blocker: string | null = null;
    if (row.status !== 'submitted')
      blocker = row.status === 'draft' ? 'Draft — submit before approval' : 'Not submitted';
    else if (!Number.isFinite(hours) || hours <= 0) blocker = 'No completed hours';
    else if (row.clock_in_at && !row.clock_out_at) blocker = 'Shift has not been clocked out';
    else if (!profile || !program) blocker = 'Student or program needs to be linked';
    return {
      ...row,
      hours_worked: Number.isFinite(hours) ? hours : 0,
      student_id: studentId,
      name: profile?.full_name?.trim() || profile?.email || 'Unlinked student',
      email: profile?.email ?? null,
      program_key: program?.id ?? normalized(row.program_id),
      program_title: program?.name || program?.title || 'Unlinked program',
      required_hours: required,
      approval_blocker: blocker,
    };
  });
  const sameDay = new Map<string, AdminHoursEntry[]>();
  for (const entry of entries) {
    if (entry.hours_worked <= 0 || !['submitted', 'verified'].includes(entry.status)) continue;
    const key = `${entry.student_id}:${entry.program_key}:${entry.work_date}`;
    sameDay.set(key, [...(sameDay.get(key) ?? []), entry]);
  }
  for (const group of sameDay.values()) {
    if (group.length < 2) continue;
    for (const entry of group) {
      if (entry.status === 'submitted' && !entry.approval_blocker)
        entry.approval_blocker =
          'Multiple entries for this student, program and work date — review before approval';
    }
  }
  return entries;
}

export function summarizeAdminHours(entries: AdminHoursEntry[]) {
  const summaries = new Map<
    string,
    {
      key: string;
      student_id: string;
      program_key: string;
      name: string;
      program_title: string;
      required_hours: number | null;
      approved_hours: number;
      pending_hours: number;
      entries: AdminHoursEntry[];
    }
  >();
  for (const entry of entries) {
    const key = `${entry.student_id}:${entry.program_key}`;
    const summary = summaries.get(key) ?? {
      key,
      student_id: entry.student_id,
      program_key: entry.program_key,
      name: entry.name,
      program_title: entry.program_title,
      required_hours: entry.required_hours,
      approved_hours: 0,
      pending_hours: 0,
      entries: [],
    };
    if (entry.status === 'verified')
      summary.approved_hours = roundHours(summary.approved_hours + entry.hours_worked);
    if (entry.status === 'submitted')
      summary.pending_hours = roundHours(summary.pending_hours + entry.hours_worked);
    summary.entries.push(entry);
    summaries.set(key, summary);
  }
  return [...summaries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function hoursApprovalSnapshot(entry: ProgressHoursEntry) {
  return {
    id: entry.id,
    apprentice_id: entry.apprentice_id,
    program_id: entry.program_id,
    work_date: entry.work_date,
    week_ending: entry.week_ending,
    hours_worked: Number(entry.hours_worked),
    notes: entry.notes,
    tasks_completed: entry.tasks_completed,
    clock_in_at: entry.clock_in_at,
    clock_out_at: entry.clock_out_at,
  };
}
export type HoursApprovalSnapshot = ReturnType<typeof hoursApprovalSnapshot>;
export interface HoursLedgerEntry {
  id: string;
  user_id: string | null;
  program_slug: string | null;
  progress_entry_id: string | null;
  legacy_source: string | null;
  legacy_id: string | null;
  status: string;
  work_date: string | null;
  hours_claimed: number | string;
  accepted_hours: number | string | null;
  source_type: string;
}

export function applyLedgerReview(
  entries: AdminHoursEntry[],
  ledger: HoursLedgerEntry[],
  programs: HoursProgram[],
) {
  const programById = new Map(programs.map((p) => [p.id, p]));
  for (const entry of entries) {
    if (entry.approval_blocker) continue;
    const slug = programById.get(entry.program_key)?.slug;
    const conflict = ledger.some(
      (h) =>
        h.user_id === entry.student_id &&
        h.program_slug?.toLowerCase() === slug?.toLowerCase() &&
        h.work_date === entry.work_date &&
        ['pending', 'approved', 'locked'].includes(h.status) &&
        ['ojl', 'timeclock', 'manual', 'host_shop'].includes(h.source_type) &&
        h.progress_entry_id !== entry.id &&
        !(h.legacy_source === 'progress_entries' && h.legacy_id === entry.id),
    );
    if (conflict)
      entry.approval_blocker =
        'Another hours ledger entry exists for this work date — reconcile before approval';
  }
}

export function summarizeHoursLedger(
  ledger: HoursLedgerEntry[],
  userId: string,
  programSlug: string | undefined,
) {
  const rows = ledger.filter(
    (h) =>
      h.user_id === userId &&
      programSlug &&
      h.program_slug?.toLowerCase() === programSlug.toLowerCase(),
  );
  return {
    approved: roundHours(
      rows
        .filter((h) => ['approved', 'locked'].includes(h.status))
        .reduce(
          (sum, h) =>
            sum +
            (Number(h.accepted_hours) > 0 ? Number(h.accepted_hours) : Number(h.hours_claimed)),
          0,
        ),
    ),
    pending: roundHours(
      rows
        .filter((h) => h.status === 'pending')
        .reduce((sum, h) => sum + Number(h.hours_claimed), 0),
    ),
  };
}
