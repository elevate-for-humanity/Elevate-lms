import { describe, expect, it } from 'vitest';
import { documentExtension, hashHiringToken, hiringDataSchema, newHiringToken, profileSchema, publicHiringQuestions, publicHiringState, scoreHiringAssessment, submissionProblems, validHiringToken } from '@/lib/tenant/hiring';

const profile = { role: 'apprentice', name: 'Owner Test', email: 'owner@example.com', phone: '3175550100', company: '', serviceArea: 'Indianapolis', services: 'Janitorial work', experience: 'Seeking supervised paid training', availability: 'Weekdays', capacity: 'One person', equipment: '', insurance: '', qualificationsNote: 'New applicant requesting training; no current certificates.' };
describe('tenant hiring evidence and capability boundaries', () => {
  it('keeps answer keys off the public question payload', () => {
    const questions = publicHiringQuestions();
    expect(questions).toHaveLength(10);
    expect(questions.every(q => !('answer' in q) && !('score' in q))).toBe(true);
  });
  it('rejects incomplete answers and extra question keys instead of trusting a claimed score', () => {
    expect(() => scoreHiringAssessment({ chemicals: 1, score: 100 })).toThrow();
    const wrong = Object.fromEntries(publicHiringQuestions().map(q => [q.id, 0]));
    expect(scoreHiringAssessment(wrong).score).toBeLessThan(100);
    expect(() => scoreHiringAssessment({ ...wrong, forged: 1 })).toThrow();
  });
  it('requires a real company name only on the business partner track', () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
    expect(profileSchema.safeParse({ ...profile, role: 'company' }).success).toBe(false);
  });
  it('does not treat apprenticeship interest or an interview flag as a completed application', () => {
    const data = hiringDataSchema.parse({ profile, interview: { messages: [], answered: 0, complete: true }, documents: [] });
    expect(submissionProblems(data)).toEqual(['Complete the skills assessment.', 'Complete the PARIS interview.']);
  });
  it('requires qualification evidence or an explanation without inventing a credential', () => {
    const data = hiringDataSchema.parse({ profile: { ...profile, qualificationsNote: '' }, interview: { messages: [], answered: 5, complete: true }, documents: [] });
    expect(submissionProblems(data)).toContain('Upload qualifications or explain which documents or training you can provide.');
    data.profile.role = 'company'; data.profile.company = 'Owner Test Cleaning'; data.profile.qualificationsNote = 'Documents will follow';
    expect(submissionProblems(data)).toContain('Upload at least one qualification or business document.');
  });
  it('rejects mismatched continuation capabilities', () => {
    const first = newHiringToken(); const second = newHiringToken();
    expect(validHiringToken(first, hashHiringToken(first))).toBe(true);
    expect(validHiringToken(second, hashHiringToken(first))).toBe(false);
    expect(validHiringToken('invalid', hashHiringToken(first))).toBe(false);
  });
  it('does not expose private object paths or server answer selections in public state', () => {
    const data = hiringDataSchema.parse({ profile, interview: { messages: [], answered: 0, complete: false }, documents: [{ id: '00000000-0000-4000-8000-000000000001', name: 'qualification.pdf', mime: 'application/pdf', bytes: 100, path: 'private/site/application/file.pdf' }] });
    expect(JSON.stringify(publicHiringState('record', data, 0))).not.toContain('private/site');
  });
  it('rejects executable or mislabeled uploads even with a document extension', () => {
    expect(documentExtension(new TextEncoder().encode('<script>bad()</script>'), 'application/pdf', 'certificate.pdf')).toBeNull();
    expect(documentExtension(new TextEncoder().encode('%PDF-1.7'), 'application/pdf', 'certificate.html')).toBeNull();
    expect(documentExtension(new TextEncoder().encode('%PDF-1.7'), 'application/pdf', 'certificate.pdf')).toBe('pdf');
  });
});
