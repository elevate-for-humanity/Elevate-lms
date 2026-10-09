export const APPLICANT_OUTREACH_CAMPAIGN = 'all-program-applicant-interest-2026-10-09';
export const APPLICANT_OUTREACH_SUBJECT = 'Elevate enrollment: are you ready to get started?';
export type ApplicantInterest = 'interested' | 'not_interested' | 'needs_follow_up';
export type OutreachProgram = { slug: string; title: string; funded: boolean };

/** Classify only the applicant's new text, never quoted instructions or history. */
export function classifyApplicantReply(text: string): ApplicantInterest {
 const fresh = text.split(/\n\s*(?:On .+wrote:|From:|[-_]{3,}|>)/i)[0].trim().toLowerCase();
 if (!fresh || fresh.length>1500 || /\b(?:maybe|not sure|unsure|not yet|later|next year|what if|if i|if you|unless)\b/.test(fresh)) return 'needs_follow_up';
 const decline = /\b(?:not interested|no longer interested|do not (?:want|wish)|don't (?:want|wish)|unsubscribe|remove me|stop (?:emailing|contacting)|no thanks|no thank you)\b/.test(fresh);
 const accept = /^(?:interested|yes)[.!\s]*$/.test(fresh) || /\b(?:i(?:'m| am) interested|still interested|yes|i want to (?:start|get started|enroll)|ready to (?:start|get started|enroll)|let'?s get started)\b/.test(fresh);
 if (decline && accept && !/\bno longer interested\b/.test(fresh)) return 'needs_follow_up';
 if (decline) return 'not_interested';
 if (accept && !/\b(?:not|don't|do not|can't|cannot)\b/.test(fresh)) return 'interested';
 return 'needs_follow_up';
}

export function applicantOutreachText(name: string, programs: OutreachProgram[], followup=false): string {
 const intro=followup ? 'Thank you for confirming that you want to get started. Here are your next steps.' : 'You contacted or applied to Elevate for Humanity. Are you still interested in getting started?';
 const lines=[`Hi ${name || 'there'},`, '', intro, ''];
 for(const p of programs) {
  lines.push(`${p.title}: ${p.funded ? 'WorkOne funding review pathway' : 'Self-pay enrollment pathway'}.`);
  lines.push(`Program information: https://www.elevateforhumanity.org/programs/${p.slug}`);
  lines.push(`Enrollment intake: https://www.elevateforhumanity.org/apply?program=${encodeURIComponent(p.slug)}&funding=${p.funded ? 'workone' : 'self_pay'}`);
 }
 if(!programs.length) lines.push('Choose your program: https://www.elevateforhumanity.org/enroll', 'Reply with the program you want so admissions can confirm the correct enrollment and payment steps.');
 if(programs.some(p=>p.funded)) lines.push('', 'For a workforce-funded program, WorkOne determines your individual eligibility and must authorize funding before funded training starts. Funding is not guaranteed.', 'Indianapolis WorkOne appointment booking: https://workoneindy.as.me/schedule/e8f310c0/appointment/91381838', 'If you are outside Indianapolis, use your local WorkOne office. Reply with your appointment date, attended/pending/denied status, and any help you need.');
 if(!programs.length || programs.some(p=>!p.funded)) lines.push('', 'Self-pay programs require tuition payment. Admissions will confirm the current tuition, any required deposit, and available payment arrangements before enrollment.', 'Affirm offers eligible purchases payment options that may include Pay in 4 or monthly installments. Options depend on the purchase and eligibility; monthly rates may be 0–36% APR and a down payment may be required. Do not assume approval or that every plan is available for your tuition. Admissions will confirm whether Affirm is available for your specific invoice.', 'Learn about Affirm: https://www.affirm.com/how-it-works', 'Tuition information: https://www.elevateforhumanity.org/tuition');
 lines.push('', 'Reply INTERESTED (and the program you want) to continue, NOT INTERESTED to leave the active applicant outreach queue, or HELP if you need assistance.', 'If you already enrolled or started training, reply with that update so we can correct your intake record.', '', 'PARIS · Elevate Admissions', 'Replies: admissions@elevateforhumanity.org');
 return lines.join('\n');
}
