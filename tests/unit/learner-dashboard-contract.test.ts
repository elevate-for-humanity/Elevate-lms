import { describe, expect, it } from 'vitest';
import { ROLE_NAVIGATION } from '@/lib/navigation/navigation-config';
import { getRequiredAgreements } from '@/lib/legal/requiredAgreements';

describe('learner dashboard contract', () => {
  it('exposes every required learner workspace destination', () => {
    const hrefs = ROLE_NAVIGATION.student.flatMap((section) => section.items.map((item) => item.href));
    for (const path of ['/lms/onboarding','/lms/documents','/lms/binder','/lms/agreements','/lms/handbook','/lms/courses','/lms/career']) expect(hrefs).toContain(path);
  });
  it('requires core learner legal acknowledgments', () => {
    const types = getRequiredAgreements('student').map((agreement) => agreement.type);
    expect(types).toEqual(expect.arrayContaining(['enrollment','handbook','data_sharing','mou']));
  });
  it('does not silently treat unknown learner aliases as exempt', () => {
    expect(getRequiredAgreements('learner')).toEqual(getRequiredAgreements('student'));
  });
  it('keeps partner delivery separate from internal course publication', () => {
    expect(ROLE_NAVIGATION.student.flatMap((section) => section.items).some((item) => item.href === '/lms/courses')).toBe(true);
  });
});
