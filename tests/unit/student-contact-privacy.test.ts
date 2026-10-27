import { describe, expect, it } from 'vitest';
import { studentContactProjection } from '../../lib/program-holder/contact-privacy';

describe('student contact privacy', () => {
  it.each([false, true])(
    'keeps names-only partners private even when agreement signed=%s',
    (signed) => {
      expect(studentContactProjection(true, signed)).toEqual({
        granted: false,
        enrollment: '',
        applicant: '',
        notes: '',
      });
    },
  );
  it('withholds contact fields from other partners until their agreement is signed', () => {
    const result = studentContactProjection(false, false);
    expect(result.granted).toBe(false);
    expect(result.enrollment).toBe('');
    expect(result.applicant).toBe('');
  });
  it('preserves authorized contact access for other signed partners', () => {
    const result = studentContactProjection(false, true);
    expect(result.granted).toBe(true);
    expect(result.enrollment).toContain('email,phone');
    expect(result.applicant).toContain('applicant_email,applicant_phone');
  });
});
