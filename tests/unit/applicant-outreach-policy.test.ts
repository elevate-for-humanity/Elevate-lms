import {describe,it,expect} from 'vitest';
import {classifyApplicantReply,applicantOutreachText} from '@/lib/email/applicant-outreach-policy';
describe('applicant outreach intent and program routing',()=>{
 it('uses clear new replies and ignores quoted history',()=>{
  expect(classifyApplicantReply('I want to get started.\nOn Friday Admissions wrote:\nNOT INTERESTED')).toBe('interested');
  expect(classifyApplicantReply('Not interested. Please remove me.')).toBe('not_interested');
  expect(classifyApplicantReply('Yes, but I am not interested in CDL')).toBe('needs_follow_up');
  expect(classifyApplicantReply('Maybe later, I am interested')).toBe('needs_follow_up');
  expect(classifyApplicantReply('I cannot get started now')).toBe('needs_follow_up');
 });
 it('keeps self-pay out of WorkOne and never promises financing approval',()=>{
  const text=applicantOutreachText('Alex',[{slug:'barber-apprenticeship',title:'Barber Apprenticeship',funded:false}],true);
  expect(text).toContain('funding=self_pay');
  expect(text).not.toContain('WorkOne appointment');
  expect(text).toContain('Do not assume approval');
 });
 it('gives funded applicants appointment steps without guaranteed funding',()=>{
  const text=applicantOutreachText('Alex',[{slug:'hvac-technician',title:'HVAC Certification',funded:true}]);
  expect(text).toContain('funding=workone');
  expect(text).toContain('Funding is not guaranteed');
 });
});
