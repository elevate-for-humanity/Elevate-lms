import { describe, expect, it } from 'vitest';
import { apprenticeshipPaymentError } from '@/lib/programs/apprenticeship-payment-policy';
import { applyInterviewAnswer, createApplicationInterviewState, getNextApplicationInterviewQuestion, getRequiredInterviewFields, applicationInterviewReadyForSubmission, interviewStateToApplicationPayload } from '@/lib/paris/admissions/interview-engine';

// Owner rule (Elizabeth, 2026-11-28): a deposit may be asked ONLY of
// self-paying applicants. Apprenticeship tuition is normally self-pay, but a
// declared workforce-funding path is accepted and routed to Admissions
// review — never rejected, never rewritten to self-pay, never deposit-gated.
describe('apprenticeship funding policy (owner rule 2026-11-28)', () => {
  it.each(['wioa', 'wrg', 'fssa', 'jri', 'employer', 'employer_sponsored'])('accepts funded path %s for apprenticeship tuition', (method) => {
    expect(apprenticeshipPaymentError('nail-technician-apprenticeship', method)).toBeNull();
  });
  it.each(['self_pay', 'self-pay', 'payment_plan', 'bnpl'])('accepts self-pay repayment method %s', (method) => {
    expect(apprenticeshipPaymentError('barber-apprenticeship', method)).toBeNull();
  });
  it('rejects an unrecognized funding value for an apprenticeship', () => {
    expect(apprenticeshipPaymentError('barber-apprenticeship', 'lottery_winnings')).toMatch(/workforce funding/i);
  });
  it('does not change evidenced non-apprenticeship funding paths', () => {
    expect(apprenticeshipPaymentError('cdl-training', 'wrg')).toBeNull();
  });
  it('offers funded apprentices the full funding options, including WorkOne fields', () => {
    const state = createApplicationInterviewState('en');
    const required = getRequiredInterviewFields({ program: 'barber-apprenticeship', fundingSource: 'wioa', hasWorkOneReferral: 'yes' });
    expect(required).toContain('workoneCenter');
    state.answers = { ...Object.fromEntries(required.map((field) => [field, 'yes'])), program: 'barber-apprenticeship', fundingSource: 'wioa', hasWorkOneReferral: 'yes', workoneCenter: 'Indianapolis', hasHostShop: 'no' };
    state.confirmed = required;
    expect(applicationInterviewReadyForSubmission(state)).toBe(true);
    const asking = createApplicationInterviewState('en');
    asking.answers = { ...Object.fromEntries(required.map((field) => [field, 'yes'])), program: 'barber-apprenticeship', fundingSource: '', hasWorkOneReferral: 'yes', workoneCenter: 'Indianapolis' };
    asking.confirmed = required.filter((field) => field !== 'fundingSource');
    const question = getNextApplicationInterviewQuestion(asking);
    expect(question?.field).toBe('fundingSource');
    expect(question?.options?.map((option) => option.value)).toContain('wioa');
    expect(question?.options?.map((option) => option.value)).toContain('self_pay');
  });
  it('accepts a typed funded choice for an apprentice and keeps it in the payload', () => {
    const state = createApplicationInterviewState('en');
    state.answers.program = 'esthetician-apprenticeship';
    const accepted = applyInterviewAnswer(state, 'fundingSource', 'wioa', true);
    expect(accepted.answers.fundingSource).toBe('wioa');
    expect(interviewStateToApplicationPayload(accepted).fundingType).toBe('wioa');
    const selfPay = applyInterviewAnswer(state, 'fundingSource', 'self_pay', true);
    expect(interviewStateToApplicationPayload(selfPay).fundingType).toBe('self_pay');
  });
});
