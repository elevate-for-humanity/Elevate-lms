import { describe, it, expect } from 'vitest';
import {
  getRequiredInterviewFields,
  interviewStateToApplicationPayload,
} from '../../lib/paris/admissions/interview-engine';

describe('CDL funding follow-up interview', () => {
  it('asks every CDL applicant about WorkOne and self-pay, including self-pay applicants', () => {
    const fields = getRequiredInterviewFields({
      program: 'cdl-training',
      fundingSource: 'self_pay',
    });
    expect(fields).toEqual(
      expect.arrayContaining([
        'workoneAppointmentStatus',
        'workoneFundingStatus',
        'workoneNextStep',
        'workoneBarriers',
        'selfPayPreference',
      ]),
    );
    expect(
      getRequiredInterviewFields({ program: 'bookkeeping', fundingSource: 'self_pay' }),
    ).not.toContain('workoneFundingStatus');
  });
  it('keeps the answers in the application support notes without treating them as funding approval', () => {
    const payload = interviewStateToApplicationPayload({
      locale: 'en',
      confirmed: [],
      answers: {
        program: 'cdl-training',
        fundingSource: 'wioa',
        hasWorkOneReferral: 'yes',
        workoneFundingStatus: 'denied',
        workoneNextStep: 'Needs documents',
        workoneBarriers: 'Transportation',
        selfPayPreference: 'Payment arrangements',
      },
    });
    expect(payload.supportNeeds).toContain('denied');
    expect(payload.supportNeeds).toContain('Transportation');
    expect(payload.supportNeeds).toContain('Payment arrangements');
    expect(payload).not.toHaveProperty('funding_verified');
  });
});
