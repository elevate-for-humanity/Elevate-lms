import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { HiringProfile, HiringPublicState, HiringQuestion, HiringRole } from './hiring-types';

export const HIRING_BUCKET = 'tenant-hiring-qualifications';
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENTS = 5;
export const profileSchema = z.object({
  role: z.enum(['company', 'individual', 'apprentice']), name: z.string().trim().min(2).max(160),
  email: z.email().max(240), phone: z.string().trim().min(7).max(40),
  company: z.string().trim().max(200).default(''), serviceArea: z.string().trim().min(2).max(500),
  services: z.string().trim().min(2).max(1500), experience: z.string().trim().min(2).max(2000),
  availability: z.string().trim().min(2).max(500), capacity: z.string().trim().min(1).max(200),
  equipment: z.string().trim().max(1000).default(''), insurance: z.string().trim().max(500).default(''),
  qualificationsNote: z.string().trim().max(1500).default(''),
}).refine(p => p.role !== 'company' || p.company.length >= 2, { message: 'Enter your cleaning company name.', path: ['company'] });

const documentSchema = z.object({ id: z.uuid(), name: z.string().max(180), mime: z.string(), bytes: z.number().int().positive(), path: z.string() });
export const hiringDataSchema = z.object({
  profile: profileSchema,
  assessment: z.object({ answers: z.record(z.string(), z.number().int()), score: z.number(), reviewTopics: z.array(z.string()), completedAt: z.string() }).optional(),
  interview: z.object({ messages: z.array(z.object({ role: z.enum(['PARIS', 'Applicant']), text: z.string().max(2400) })).max(12), answered: z.number().int().min(0).max(5), complete: z.boolean() }),
  documents: z.array(documentSchema).max(MAX_DOCUMENTS), submittedAt: z.string().optional(),
});
export type HiringData = z.infer<typeof hiringDataSchema>;

// Answer keys remain on the server. Scores measure knowledge, never honesty,
// personality, certification, or hiring eligibility. Final decisions are human.
const QUESTIONS = [
  { id: 'chemicals', question: 'A coworker wants to mix bleach and ammonia to make a stronger cleaner. What should you do?', options: ['Mix them outdoors.', 'Do not mix them; follow the product label and safe-work instructions.', 'Use a smaller amount of each.'], answer: 1, topic: 'Chemical mixing safety' },
  { id: 'contact-time', question: 'A disinfectant label requires a wet contact time. What does that mean?', options: ['Wipe the surface dry immediately.', 'The time you spend opening the container.', 'Keep the surface wet for the label’s stated contact time.'], answer: 2, topic: 'Disinfectant contact time' },
  { id: 'soil', question: 'A visibly dirty surface needs disinfecting. What is the appropriate approach?', options: ['Clean the dirt first, then disinfect as directed by the product label.', 'Apply perfume to the surface.', 'Disinfectant always replaces cleaning.'], answer: 0, topic: 'Cleaning before disinfection' },
  { id: 'label', question: 'You find an unlabeled bottle of cleaning liquid. What is the best next step?', options: ['Smell it to identify it.', 'Mix it with another bottle.', 'Do not use it until it is properly identified and labeled.'], answer: 2, topic: 'Chemical identification' },
  { id: 'ppe', question: 'How do you choose protective equipment for a cleaning chemical?', options: ['Use the label, safety data sheet and required workplace training.', 'Choose only by the product’s color.', 'Protective equipment is never needed for green products.'], answer: 0, topic: 'Protective equipment and SDS' },
  { id: 'separation', question: 'After cleaning a toilet, you need to clean a kitchen counter. What should happen?', options: ['Use the same dirty cloth to save time.', 'Use separate appropriate clean equipment and follow hand hygiene and site procedures.', 'Spray fragrance on the cloth.'], answer: 1, topic: 'Avoiding cross-contamination' },
  { id: 'hazard', question: 'You discover a sharp object or unknown hazardous material outside your training. What should you do?', options: ['Pick it up with bare hands.', 'Hide it in normal trash.', 'Keep people away and notify the supervisor or designated site contact.'], answer: 2, topic: 'Recognizing work outside training' },
  { id: 'delay', question: 'You cannot reach an assigned job at the agreed time. What should you do?', options: ['Notify the designated contact promptly and follow the attendance procedure.', 'Wait until the next week.', 'Mark the job complete.'], answer: 0, topic: 'Attendance communication' },
  { id: 'damage', question: 'You notice damage while cleaning. What is the best response?', options: ['Hide it and leave.', 'Stop work that may worsen it and report it according to the site procedure.', 'Repair it with any chemical available.'], answer: 1, topic: 'Damage reporting' },
  { id: 'scope', question: 'A customer asks for a task outside the agreed scope that you are not trained to perform. What should you do?', options: ['Say it is complete without doing it.', 'Do it without checking requirements.', 'Explain the limitation and ask the supervisor to review the request.'], answer: 2, topic: 'Scope and capability verification' },
] as const;

export function publicHiringQuestions(): HiringQuestion[] {
  return QUESTIONS.map(q => ({ id: q.id, question: q.question, options: [...q.options] }));
}
export function scoreHiringAssessment(raw: unknown) {
  const parsed = z.record(z.string(), z.number().int().min(0).max(2)).safeParse(raw);
  if (!parsed.success || Object.keys(parsed.data).length !== QUESTIONS.length || QUESTIONS.some(q => parsed.data[q.id] === undefined)) throw new Error('Answer every skills question exactly once.');
  const missed = QUESTIONS.filter(q => parsed.data[q.id] !== q.answer);
  return { answers: parsed.data, score: Math.round((QUESTIONS.length - missed.length) / QUESTIONS.length * 100), reviewTopics: missed.map(q => q.topic), completedAt: new Date().toISOString() };
}
export function newHiringToken() { return randomBytes(32).toString('hex'); }
export function hashHiringToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function validHiringToken(token: string, hash: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(hash)) return false;
  return timingSafeEqual(Buffer.from(hashHiringToken(token), 'hex'), Buffer.from(hash, 'hex'));
}
export function publicHiringState(id: string, data: HiringData, version: number): HiringPublicState {
  return { id, profile: data.profile as HiringProfile, version, submittedAt: data.submittedAt,
    assessment: data.assessment && { score: data.assessment.score, reviewTopics: data.assessment.reviewTopics, completedAt: data.assessment.completedAt },
    interview: data.interview, documents: data.documents.map(({ id, name, mime, bytes }) => ({ id, name, mime, bytes })) };
}
export function interviewTopic(role: HiringRole, answered: number) {
  const topics = [
    role === 'company' ? 'Describe a specific cleaning contract your company performed, your role, the team size and what evidence you can provide.' : role === 'apprentice' ? 'Describe any cleaning experience you have and what you want to learn through supervised paid work.' : 'Describe a specific cleaning job you performed, the tasks you completed and how the work was checked.',
    'Explain your safe cleaning process, including product labels, protective equipment and avoiding cross-contamination.',
    'Describe how you handle a missed shift, a customer complaint or a cleaning mistake. Give a real example if you have one.',
    role === 'company' ? 'Explain how you supervise staff, cover an absence and verify the qualifications and equipment needed for a contract.' : 'Explain which tasks you can do confidently, which require training, your availability and how you would ask for help.',
    'Describe the qualifications or references you can provide and any limitations the hiring team should verify before assigning work.',
  ];
  return topics[answered] || '';
}
export function submissionProblems(data: HiringData): string[] {
  const problems: string[] = [];
  if (!data.assessment) problems.push('Complete the skills assessment.');
  if (!data.interview.complete || data.interview.answered !== 5) problems.push('Complete the PARIS interview.');
  if (!data.documents.length && data.profile.role !== 'apprentice') problems.push('Upload at least one qualification or business document.');
  else if (!data.documents.length && !data.profile.qualificationsNote.trim()) problems.push('Upload qualifications or explain which documents or training you can provide.');
  return problems;
}
export function documentExtension(bytes: Uint8Array, mime: string, name: string): 'pdf' | 'png' | 'jpg' | null {
  if (mime === 'application/pdf' && /\.pdf$/i.test(name) && Buffer.from(bytes.subarray(0, 5)).toString() === '%PDF-') return 'pdf';
  if (mime === 'image/png' && /\.png$/i.test(name) && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (mime === 'image/jpeg' && /\.jpe?g$/i.test(name) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  return null;
}
