/**
 * C: IEP form validation + status transition logic
 *
 * Extracted from:
 *   app/admin/wioa/iep/IepCreateButton.tsx  (form validation, splitLines)
 *   app/admin/wioa/iep/[id]/IepStatusButton.tsx  (TRANSITIONS map)
 *   supabase/migrations/20260626000004_individual_employment_plans_full_schema.sql
 *     (status CHECK constraint)
 */

import { describe, it, expect } from 'vitest';

// ── Extracted: IEP status transition map ─────────────────────────────────────

type IepStatus = 'draft' | 'active' | 'completed' | 'cancelled';

const TRANSITIONS: Record<IepStatus, IepStatus[]> = {
  draft:     ['active', 'cancelled'],
  active:    ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function canTransition(from: IepStatus, to: IepStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

function availableTransitions(from: IepStatus): IepStatus[] {
  return TRANSITIONS[from];
}

// ── Extracted: IEP form validation ───────────────────────────────────────────

function splitLines(val: string): string[] {
  return val
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface IepFormData {
  userId: string;
  careerGoal: string;
  targetWage?: string;
  completionDate?: string;
  milestones?: Array<{ title: string; due_date: string; completed: boolean }>;
}

function validateIepForm(data: IepFormData): { valid: boolean; error?: string } {
  if (!data.userId.trim()) return { valid: false, error: 'Participant user ID is required' };
  if (!data.careerGoal.trim()) return { valid: false, error: 'Career goal is required' };
  if (data.targetWage !== undefined && data.targetWage !== '') {
    const wage = parseFloat(data.targetWage);
    if (isNaN(wage) || wage < 0) return { valid: false, error: 'Target wage must be a positive number' };
  }
  return { valid: true };
}

// ── Extracted: milestone filtering (only non-empty titles are saved) ──────────

function filterMilestones(
  milestones: Array<{ title: string; due_date: string; completed: boolean }>,
): Array<{ title: string; due_date: string; completed: boolean }> {
  return milestones.filter((m) => m.title.trim().length > 0);
}

// ── Extracted: body builder (mirrors what submit() sends to the API) ──────────

function buildIepBody(data: {
  userId: string;
  careerGoal: string;
  employmentGoal: string;
  educationLevel: string;
  employmentStatus: string;
  skills: string;
  barriers: string[];
  strengths: string;
  trainingNeeds: string;
  supportServices: string;
  targetOccupation: string;
  targetIndustry: string;
  targetWage: string;
  completionDate: string;
  milestones: Array<{ title: string; due_date: string; completed: boolean }>;
  notes: string;
}) {
  return {
    userId:                data.userId.trim(),
    careerGoal:            data.careerGoal.trim(),
    employmentGoal:        data.employmentGoal.trim() || null,
    educationLevel:        data.educationLevel || null,
    workExperience:        data.employmentStatus ? [data.employmentStatus] : [],
    skills:                splitLines(data.skills),
    barriers:              data.barriers,
    strengths:             splitLines(data.strengths),
    trainingNeeds:         splitLines(data.trainingNeeds),
    supportServicesNeeded: splitLines(data.supportServices),
    targetOccupation:      data.targetOccupation.trim() || null,
    targetIndustry:        data.targetIndustry.trim() || null,
    targetWage:            data.targetWage ? parseFloat(data.targetWage) : null,
    completionDate:        data.completionDate || null,
    milestones:            filterMilestones(data.milestones),
    notes:                 data.notes.trim() || null,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('IEP status transitions', () => {
  describe('canTransition', () => {
    it('draft → active is allowed', () => {
      expect(canTransition('draft', 'active')).toBe(true);
    });

    it('draft → cancelled is allowed', () => {
      expect(canTransition('draft', 'cancelled')).toBe(true);
    });

    it('draft → completed is NOT allowed (must activate first)', () => {
      expect(canTransition('draft', 'completed')).toBe(false);
    });

    it('active → completed is allowed', () => {
      expect(canTransition('active', 'completed')).toBe(true);
    });

    it('active → cancelled is allowed', () => {
      expect(canTransition('active', 'cancelled')).toBe(true);
    });

    it('active → draft is NOT allowed (no regression)', () => {
      expect(canTransition('active', 'draft')).toBe(false);
    });

    it('completed has no further transitions', () => {
      expect(availableTransitions('completed')).toHaveLength(0);
    });

    it('cancelled has no further transitions', () => {
      expect(availableTransitions('cancelled')).toHaveLength(0);
    });
  });

  describe('availableTransitions', () => {
    it('draft offers active and cancelled', () => {
      expect(availableTransitions('draft')).toEqual(['active', 'cancelled']);
    });

    it('active offers completed and cancelled', () => {
      expect(availableTransitions('active')).toEqual(['completed', 'cancelled']);
    });
  });

  describe('valid status values (migration CHECK constraint)', () => {
    const VALID_STATUSES: IepStatus[] = ['draft', 'active', 'completed', 'cancelled'];

    it('all transition targets are valid statuses', () => {
      for (const [, targets] of Object.entries(TRANSITIONS)) {
        for (const t of targets) {
          expect(VALID_STATUSES).toContain(t);
        }
      }
    });

    it('all transition sources are valid statuses', () => {
      for (const source of Object.keys(TRANSITIONS)) {
        expect(VALID_STATUSES).toContain(source as IepStatus);
      }
    });
  });
});

describe('IEP form validation', () => {
  it('rejects empty userId', () => {
    const r = validateIepForm({ userId: '', careerGoal: 'Become an HVAC tech' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/user ID/);
  });

  it('rejects whitespace-only userId', () => {
    const r = validateIepForm({ userId: '   ', careerGoal: 'Become an HVAC tech' });
    expect(r.valid).toBe(false);
  });

  it('rejects empty careerGoal', () => {
    const r = validateIepForm({ userId: 'abc-123', careerGoal: '' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/career goal/i);
  });

  it('accepts valid userId and careerGoal', () => {
    const r = validateIepForm({ userId: 'abc-123', careerGoal: 'HVAC Technician' });
    expect(r.valid).toBe(true);
  });

  it('accepts valid targetWage', () => {
    const r = validateIepForm({ userId: 'abc', careerGoal: 'goal', targetWage: '22.50' });
    expect(r.valid).toBe(true);
  });

  it('rejects negative targetWage', () => {
    const r = validateIepForm({ userId: 'abc', careerGoal: 'goal', targetWage: '-5' });
    expect(r.valid).toBe(false);
  });

  it('rejects non-numeric targetWage', () => {
    const r = validateIepForm({ userId: 'abc', careerGoal: 'goal', targetWage: 'abc' });
    expect(r.valid).toBe(false);
  });

  it('ignores empty targetWage string', () => {
    const r = validateIepForm({ userId: 'abc', careerGoal: 'goal', targetWage: '' });
    expect(r.valid).toBe(true);
  });
});

describe('splitLines', () => {
  it('splits on newlines', () => {
    expect(splitLines('EPA 608\nOSHA 10')).toEqual(['EPA 608', 'OSHA 10']);
  });

  it('trims whitespace from each line', () => {
    expect(splitLines('  EPA 608  \n  OSHA 10  ')).toEqual(['EPA 608', 'OSHA 10']);
  });

  it('filters empty lines', () => {
    expect(splitLines('EPA 608\n\n\nOSHA 10')).toEqual(['EPA 608', 'OSHA 10']);
  });

  it('returns empty array for empty string', () => {
    expect(splitLines('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(splitLines('   \n   ')).toEqual([]);
  });
});

describe('filterMilestones', () => {
  it('keeps milestones with non-empty titles', () => {
    const result = filterMilestones([
      { title: 'Complete EPA 608', due_date: '2025-06-01', completed: false },
      { title: '', due_date: '', completed: false },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Complete EPA 608');
  });

  it('filters whitespace-only titles', () => {
    const result = filterMilestones([
      { title: '   ', due_date: '', completed: false },
    ]);
    expect(result).toHaveLength(0);
  });

  it('returns all milestones when all have titles', () => {
    const result = filterMilestones([
      { title: 'Step 1', due_date: '2025-01-01', completed: false },
      { title: 'Step 2', due_date: '2025-02-01', completed: true },
    ]);
    expect(result).toHaveLength(2);
  });
});

describe('buildIepBody', () => {
  const base = {
    userId: '  abc-123  ',
    careerGoal: '  HVAC Technician  ',
    employmentGoal: '',
    educationLevel: '',
    employmentStatus: 'Unemployed — looking for work',
    skills: 'Customer service\nBasic computers',
    barriers: ['Transportation', 'Childcare'],
    strengths: 'Reliable',
    trainingNeeds: 'EPA 608',
    supportServices: '',
    targetOccupation: 'HVAC Tech',
    targetIndustry: '',
    targetWage: '22.50',
    completionDate: '2025-12-01',
    milestones: [
      { title: 'Complete orientation', due_date: '2025-06-01', completed: false },
      { title: '', due_date: '', completed: false },
    ],
    notes: '',
  };

  it('trims userId and careerGoal', () => {
    const body = buildIepBody(base);
    expect(body.userId).toBe('abc-123');
    expect(body.careerGoal).toBe('HVAC Technician');
  });

  it('converts empty employmentGoal to null', () => {
    const body = buildIepBody(base);
    expect(body.employmentGoal).toBeNull();
  });

  it('wraps employmentStatus in workExperience array', () => {
    const body = buildIepBody(base);
    expect(body.workExperience).toEqual(['Unemployed — looking for work']);
  });

  it('splits skills into array', () => {
    const body = buildIepBody(base);
    expect(body.skills).toEqual(['Customer service', 'Basic computers']);
  });

  it('passes barriers array through', () => {
    const body = buildIepBody(base);
    expect(body.barriers).toEqual(['Transportation', 'Childcare']);
  });

  it('parses targetWage as float', () => {
    const body = buildIepBody(base);
    expect(body.targetWage).toBe(22.50);
  });

  it('converts empty targetIndustry to null', () => {
    const body = buildIepBody(base);
    expect(body.targetIndustry).toBeNull();
  });

  it('filters empty milestone', () => {
    const body = buildIepBody(base);
    expect(body.milestones).toHaveLength(1);
    expect(body.milestones[0].title).toBe('Complete orientation');
  });

  it('converts empty notes to null', () => {
    const body = buildIepBody(base);
    expect(body.notes).toBeNull();
  });

  it('converts empty supportServices to empty array', () => {
    const body = buildIepBody(base);
    expect(body.supportServicesNeeded).toEqual([]);
  });
});
