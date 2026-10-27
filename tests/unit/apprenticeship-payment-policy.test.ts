import { describe, expect, it } from 'vitest';
import { apprenticeshipPaymentError } from '@/lib/programs/apprenticeship-payment-policy';
import { applyInterviewAnswer, createApplicationInterviewState, getNextApplicationInterviewQuestion, getRequiredInterviewFields, applicationInterviewReadyForSubmission, interviewStateToApplicationPayload } from '@/lib/paris/admissions/interview-engine';

describe('self-pay-only apprenticeship application policy', () => {
  it.each(['wioa', 'wrg', 'fssa', 'jri', 'employer', 'employer_sponsored'])('rejects %s for apprenticeship tuition', (method) => {
    expect(apprenticeshipPaymentError('nail-technician-apprenticeship', method)).toMatch(/self-pay only/i);
  });
  it.each(['self_pay', 'self-pay', 'payment_plan', 'bnpl'])('accepts self-pay repayment method %s', (method) => {
    expect(apprenticeshipPaymentError('barber-apprenticeship', method)).toBeNull();
  });
  it('does not change evidenced non-apprenticeship funding paths', () => {
    expect(apprenticeshipPaymentError('cdl-training', 'wrg')).toBeNull();
  });
  it('requires a saved funded apprenticeship draft to choose self-pay again', () => {
    const state = createApplicationInterviewState('en');
    const required = getRequiredInterviewFields({ program: 'barber-apprenticeship' });
    state.answers = { ...Object.fromEntries(required.map((field) => [field, 'yes'])), program: 'barber-apprenticeship', fundingSource: 'wioa' };
    state.confirmed = required;
    expect(applicationInterviewReadyForSubmission(state)).toBe(false);
    const question = getNextApplicationInterviewQuestion(state);
    expect(question?.field).toBe('fundingSource');
    expect(question?.options?.map((option) => option.value)).toEqual(['self_pay']);
    expect(question?.help).toMatch(/self-pay only/i);
  });
  it('rejects typed funded choices and sends confirmed self-pay to admissions', () => {
    const state = createApplicationInterviewState('en');
    state.answers.program = 'esthetician-apprenticeship';
    const rejected = applyInterviewAnswer(state, 'fundingSource', 'wioa', true);
    expect(rejected.answers.fundingSource).toBe('');
    const accepted = applyInterviewAnswer(rejected, 'fundingSource', 'self_pay', true);
    expect(interviewStateToApplicationPayload(accepted).fundingType).toBe('self_pay');
    expect(getRequiredInterviewFields(accepted.answers)).not.toContain('workoneCenter');
  });
});
