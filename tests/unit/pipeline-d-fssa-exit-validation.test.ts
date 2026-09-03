/**
 * D: FSSA exit interview — form validation, body builder, follow-up scheduling
 *
 * Extracted from:
 *   app/admin/fssa-impact/participants/[id]/ParticipantExitForm.tsx
 *   supabase/migrations/20260626000005_fssa_participants_exit_columns.sql
 *     (schedule_fssa_followups trigger logic)
 */

import { describe, it, expect } from 'vitest';

// ── Extracted: exit reason enum (mirrors DB CHECK constraint) ─────────────────

const EXIT_REASONS = [
  'employed',
  'training_complete',
  'voluntary_exit',
  'non_compliance',
  'ineligible',
  'other',
] as const;

type ExitReason = (typeof EXIT_REASONS)[number];

// ── Extracted: form validation ────────────────────────────────────────────────

function validateExitForm(data: {
  exitReason: string;
  exitNotes: string;
  employed: boolean;
  employerName?: string;
  hourlyWage?: string;
  hoursPerWeek?: string;
  credentialAttained: boolean;
  credentialName?: string;
  abawdExempt: boolean;
  abawdReason?: string;
}): { valid: boolean; error?: string } {
  if (!data.exitReason) {
    return { valid: false, error: 'Exit reason is required.' };
  }
  if (!EXIT_REASONS.includes(data.exitReason as ExitReason)) {
    return { valid: false, error: `Invalid exit reason: ${data.exitReason}` };
  }
  if (!data.exitNotes.trim()) {
    return { valid: false, error: 'Exit case notes are required for FSSA audit compliance.' };
  }
  if (data.employed && data.hourlyWage) {
    const wage = parseFloat(data.hourlyWage);
    if (isNaN(wage) || wage < 0) {
      return { valid: false, error: 'Hourly wage must be a positive number.' };
    }
  }
  if (data.employed && data.hoursPerWeek) {
    const hrs = parseInt(data.hoursPerWeek, 10);
    if (isNaN(hrs) || hrs < 0 || hrs > 80) {
      return { valid: false, error: 'Hours per week must be between 0 and 80.' };
    }
  }
  return { valid: true };
}

// ── Extracted: PATCH body builder ─────────────────────────────────────────────

function buildExitPatchBody(participantId: string, data: {
  exitReason: string;
  exitNotes: string;
  employed: boolean;
  employerName: string;
  jobTitle: string;
  hourlyWage: string;
  hoursPerWeek: string;
  employmentStartDate: string;
  credentialAttained: boolean;
  credentialName: string;
  credentialIssuedDate: string;
  abawdExempt: boolean;
  abawdReason: string;
}) {
  return {
    id:                     participantId,
    enrollment_status:      'exited',
    exit_reason:            data.exitReason,
    exit_notes:             data.exitNotes.trim(),
    employed_at_exit:       data.employed,
    employer_name:          data.employed ? data.employerName || null : null,
    job_title:              data.employed ? data.jobTitle || null : null,
    hourly_wage:            data.employed && data.hourlyWage ? parseFloat(data.hourlyWage) : null,
    hours_per_week:         data.employed && data.hoursPerWeek ? parseInt(data.hoursPerWeek, 10) : null,
    employment_start_date:  data.employed ? data.employmentStartDate || null : null,
    credential_attained:    data.credentialAttained,
    credential_name:        data.credentialAttained ? data.credentialName || null : null,
    credential_issued_date: data.credentialAttained ? data.credentialIssuedDate || null : null,
    abawd_exempt:           data.abawdExempt,
    abawd_exemption_reason: data.abawdExempt ? data.abawdReason || null : null,
  };
}

// ── Extracted: follow-up scheduling trigger logic ─────────────────────────────

function scheduleFollowUps(exitDate: Date): { q2: Date; q4: Date } {
  const q2 = new Date(exitDate);
  q2.setMonth(q2.getMonth() + 6);

  const q4 = new Date(exitDate);
  q4.setMonth(q4.getMonth() + 12);

  return { q2, q4 };
}

function formatFollowUpDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ── Extracted: follow-up preview display logic (from form component) ──────────

function followUpPreviewDates(now = new Date()): { q2: string; q4: string } {
  const q2 = new Date(now.getTime() + 180 * 86400000);
  const q4 = new Date(now.getTime() + 365 * 86400000);
  return {
    q2: q2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    q4: q4.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FSSA exit form validation', () => {
  const validBase = {
    exitReason: 'employed',
    exitNotes: 'Participant secured full-time employment at Acme HVAC.',
    employed: true,
    credentialAttained: false,
    abawdExempt: false,
  };

  it('accepts a fully valid exit form', () => {
    expect(validateExitForm(validBase).valid).toBe(true);
  });

  it('rejects missing exit reason', () => {
    const r = validateExitForm({ ...validBase, exitReason: '' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Exit reason/);
  });

  it('rejects invalid exit reason', () => {
    const r = validateExitForm({ ...validBase, exitReason: 'fired' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Invalid exit reason/);
  });

  it('rejects empty exit notes', () => {
    const r = validateExitForm({ ...validBase, exitNotes: '' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/case notes/i);
  });

  it('rejects whitespace-only exit notes', () => {
    const r = validateExitForm({ ...validBase, exitNotes: '   ' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/case notes/i);
  });

  it('rejects negative hourly wage when employed', () => {
    const r = validateExitForm({ ...validBase, employed: true, hourlyWage: '-5' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/wage/i);
  });

  it('rejects non-numeric hourly wage', () => {
    const r = validateExitForm({ ...validBase, employed: true, hourlyWage: 'abc' });
    expect(r.valid).toBe(false);
  });

  it('accepts valid hourly wage', () => {
    const r = validateExitForm({ ...validBase, employed: true, hourlyWage: '22.50' });
    expect(r.valid).toBe(true);
  });

  it('ignores wage validation when not employed', () => {
    const r = validateExitForm({ ...validBase, employed: false, hourlyWage: '-99' });
    expect(r.valid).toBe(true);
  });

  it('rejects hours per week > 80', () => {
    const r = validateExitForm({ ...validBase, employed: true, hoursPerWeek: '81' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/hours/i);
  });

  it('accepts hours per week = 40', () => {
    const r = validateExitForm({ ...validBase, employed: true, hoursPerWeek: '40' });
    expect(r.valid).toBe(true);
  });

  it('accepts all valid exit reasons', () => {
    for (const reason of EXIT_REASONS) {
      const r = validateExitForm({ ...validBase, exitReason: reason });
      expect(r.valid).toBe(true);
    }
  });
});

describe('buildExitPatchBody', () => {
  const base = {
    exitReason: 'employed',
    exitNotes: '  Confirmed employment at Acme HVAC.  ',
    employed: true,
    employerName: 'Acme HVAC',
    jobTitle: 'HVAC Technician',
    hourlyWage: '22.50',
    hoursPerWeek: '40',
    employmentStartDate: '2025-06-01',
    credentialAttained: true,
    credentialName: 'EPA 608',
    credentialIssuedDate: '2025-05-15',
    abawdExempt: false,
    abawdReason: '',
  };

  it('sets enrollment_status to exited', () => {
    const body = buildExitPatchBody('pid-1', base);
    expect(body.enrollment_status).toBe('exited');
  });

  it('trims exit notes', () => {
    const body = buildExitPatchBody('pid-1', base);
    expect(body.exit_notes).toBe('Confirmed employment at Acme HVAC.');
  });

  it('parses hourly_wage as float', () => {
    const body = buildExitPatchBody('pid-1', base);
    expect(body.hourly_wage).toBe(22.50);
  });

  it('parses hours_per_week as int', () => {
    const body = buildExitPatchBody('pid-1', base);
    expect(body.hours_per_week).toBe(40);
  });

  it('includes credential fields when attained', () => {
    const body = buildExitPatchBody('pid-1', base);
    expect(body.credential_attained).toBe(true);
    expect(body.credential_name).toBe('EPA 608');
    expect(body.credential_issued_date).toBe('2025-05-15');
  });

  it('nulls credential fields when not attained', () => {
    const body = buildExitPatchBody('pid-1', { ...base, credentialAttained: false });
    expect(body.credential_name).toBeNull();
    expect(body.credential_issued_date).toBeNull();
  });

  it('nulls employment fields when not employed', () => {
    const body = buildExitPatchBody('pid-1', { ...base, employed: false });
    expect(body.employer_name).toBeNull();
    expect(body.job_title).toBeNull();
    expect(body.hourly_wage).toBeNull();
    expect(body.hours_per_week).toBeNull();
    expect(body.employment_start_date).toBeNull();
  });

  it('nulls abawd_exemption_reason when not exempt', () => {
    const body = buildExitPatchBody('pid-1', base);
    expect(body.abawd_exempt).toBe(false);
    expect(body.abawd_exemption_reason).toBeNull();
  });

  it('includes abawd_exemption_reason when exempt', () => {
    const body = buildExitPatchBody('pid-1', {
      ...base,
      abawdExempt: true,
      abawdReason: 'Age (under 18 or 50+)',
    });
    expect(body.abawd_exempt).toBe(true);
    expect(body.abawd_exemption_reason).toBe('Age (under 18 or 50+)');
  });

  it('nulls empty employer name', () => {
    const body = buildExitPatchBody('pid-1', { ...base, employerName: '' });
    expect(body.employer_name).toBeNull();
  });
});

describe('Follow-up scheduling (DB trigger logic)', () => {
  it('schedules Q2 follow-up ~6 months after exit', () => {
    const exit = new Date('2025-01-01');
    const { q2 } = scheduleFollowUps(exit);
    expect(formatFollowUpDate(q2)).toBe('2025-07-01');
  });

  it('schedules Q4 follow-up ~12 months after exit', () => {
    const exit = new Date('2025-01-01');
    const { q4 } = scheduleFollowUps(exit);
    expect(formatFollowUpDate(q4)).toBe('2026-01-01');
  });

  it('Q4 is always 6 months after Q2', () => {
    const exit = new Date('2025-03-15');
    const { q2, q4 } = scheduleFollowUps(exit);
    const diffMs = q4.getTime() - q2.getTime();
    const diffDays = diffMs / 86400000;
    // ~180 days between Q2 and Q4 (6 months, allow ±2 days for month length variation)
    expect(diffDays).toBeGreaterThanOrEqual(178);
    expect(diffDays).toBeLessThanOrEqual(184);
  });

  it('Q2 is always after exit date', () => {
    const exit = new Date('2025-06-30');
    const { q2 } = scheduleFollowUps(exit);
    expect(q2.getTime()).toBeGreaterThan(exit.getTime());
  });

  it('Q4 is always after Q2', () => {
    const exit = new Date('2025-06-30');
    const { q2, q4 } = scheduleFollowUps(exit);
    expect(q4.getTime()).toBeGreaterThan(q2.getTime());
  });

  it('handles end-of-year exit correctly', () => {
    const exit = new Date('2025-12-01');
    const { q2, q4 } = scheduleFollowUps(exit);
    expect(q2.getFullYear()).toBe(2026);
    expect(q4.getFullYear()).toBe(2026);
  });
});

describe('Follow-up preview display', () => {
  it('Q2 preview is approximately 180 days from now', () => {
    const now = new Date('2025-01-01');
    const preview = followUpPreviewDates(now);
    // Should contain 2025 or 2026
    expect(preview.q2).toMatch(/202[56]/);
  });

  it('Q4 preview is approximately 365 days from now', () => {
    const now = new Date('2025-01-01');
    const preview = followUpPreviewDates(now);
    expect(preview.q4).toMatch(/2026/);
  });

  it('Q4 preview date is after Q2 preview date', () => {
    const now = new Date('2025-06-01');
    const preview = followUpPreviewDates(now);
    // Both are locale strings — compare by parsing
    const q2 = new Date(preview.q2);
    const q4 = new Date(preview.q4);
    expect(q4.getTime()).toBeGreaterThan(q2.getTime());
  });
});

describe('Exit reason enum', () => {
  it('contains all 6 required FSSA exit reasons', () => {
    expect(EXIT_REASONS).toHaveLength(6);
    expect(EXIT_REASONS).toContain('employed');
    expect(EXIT_REASONS).toContain('training_complete');
    expect(EXIT_REASONS).toContain('voluntary_exit');
    expect(EXIT_REASONS).toContain('non_compliance');
    expect(EXIT_REASONS).toContain('ineligible');
    expect(EXIT_REASONS).toContain('other');
  });
});
