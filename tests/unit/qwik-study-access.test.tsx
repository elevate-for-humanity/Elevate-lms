import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { canReadQwikStudyCode, loadQwikStudyCode } from '@/lib/learner/qwik-study-access';
import HvacStartHere from '@/components/learner/HvacStartHere';

const enrollment = {
  user_id: 'student-one', student_id: 'student-one', program_id: 'hvac-program',
  status: 'active', enrollment_state: 'active', access_status: null,
  access_granted_at: '2026-10-31T00:00:00Z', revoked_at: null, cancelled_at: null,
  suspended_at: null, refunded_at: null,
};

describe('QwikStudy shared download access', () => {
  it('permits a current enrollment with granted training access', () => {
    expect(canReadQwikStudyCode(enrollment, 'student-one')).toBe(true);
  });
  it.each([
    { user_id: 'another-student' }, { access_granted_at: null },
    { status: 'completed' }, { enrollment_state: 'withdrawn' },
    { access_status: 'hold' }, { revoked_at: '2026-10-31' },
    { cancelled_at: '2026-10-31' }, { suspended_at: '2026-10-31' },
    { refunded_at: '2026-10-31' }, { program_id: null },
  ])('withholds the code when enrollment is ineligible: %j', patch => {
    expect(canReadQwikStudyCode({ ...enrollment, ...patch }, 'student-one')).toBe(false);
  });
  it('does not load the private code without an eligible HVAC enrollment', async () => {
    const query: any = { select: () => query, or: () => query,
      eq: async () => ({ data: [{ ...enrollment, access_status: 'hold' }], error: null }) };
    const db: any = { from: vi.fn(() => query) };
    expect(await loadQwikStudyCode(db, 'student-one')).toBeNull();
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.from).toHaveBeenCalledWith('program_enrollments');
  });
  it('uses the server-provided code with the official external link', () => {
    const html = renderToStaticMarkup(<HvacStartHere studyCode="TEST-CODE-ONLY" />);
    expect(html).toContain('TEST-CODE-ONLY');
    expect(html).toContain('https://ww2.epatest.com/software/');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('requires Windows');
  });
  it('does not invent a code if access is missing', () => {
    const html = renderToStaticMarkup(<HvacStartHere />);
    expect(html).toContain('Contact Elevate staff for your software download code');
    expect(html).not.toContain('TEST-CODE-ONLY');
    expect(html).not.toContain('<code');
  });
});
