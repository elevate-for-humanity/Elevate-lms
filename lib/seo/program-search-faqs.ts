import type { ProgramSchema } from '@/lib/programs/program-schema';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import { getVerifiedProgramFunding } from '@/lib/programs/funding-registry';

export type SearchFaq = { question: string; answer: string };

export function getProgramTotalHours(program: ProgramSchema) {
  return Object.values(program.hoursBreakdown ?? {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
}

export function buildProgramSearchFaqs(program: ProgramSchema): SearchFaq[] {
  const hosts = FEATURED_BEAUTY_HOST_PARTNERS.filter((shop) => shop.programs.includes(program.slug));
  const cities = [...new Set(hosts.map((shop) => shop.city))];
  const verifiedFunding = getVerifiedProgramFunding(program.slug);
  const workforceFunded = Boolean(
    verifiedFunding?.etplListedFor2Exclusive &&
      (verifiedFunding.wioaEligible || verifiedFunding.wrgEligible),
  );
  const hours = getProgramTotalHours(program);
  const credential = program.credentials?.[0]?.name ?? 'program credential';

  const generated: SearchFaq[] = [
    {
      question: `How many hours is the Indiana ${program.title}?`,
      answer:
        hours > 0
          ? `The published Elevate program record totals ${hours.toLocaleString()} training hours across the program's supervised practical, technical instruction, exam-preparation, and career components. Actual completion timing depends on the approved schedule, attendance, competency progress, and any accepted transfer credit.`
          : 'The required hours and completion schedule are listed in the program details. Admissions can confirm the current registered standard before enrollment.',
    },
    {
      question: `Can I use WorkOne or WIOA funding for the ${program.title}?`,
      answer: workforceFunded
        ? 'This program is in Elevate’s verified workforce-funded registry. WorkOne or the responsible agency must still determine participant eligibility, covered costs, and issue written authorization before funded enrollment.'
        : 'This track is not currently presented on Elevate’s public site as an ETPL/WIOA tuition-funded program. Admissions can review self-pay, employer-paid, supportive-service, or other eligible funding options without promising WIOA approval.',
    },
    {
      question: `What credential does the ${program.title} prepare me for?`,
      answer: `The program is designed to prepare learners toward ${credential}. State licensure, when applicable, is issued by the responsible licensing authority after the learner satisfies the current state application, examination, and other licensing requirements.`,
    },
    {
      question: 'Do I need to find my own host shop or salon?',
      answer:
        hosts.length > 0
          ? `You may bring a qualified shop for approval or ask about current host-site availability. Elevate currently publishes ${hosts.length} host partner${hosts.length === 1 ? '' : 's'} for this track${cities.length ? ` in ${cities.join(', ')}` : ''}. Placement is subject to shop capacity and program approval.`
          : 'You may bring a qualified shop for approval or ask admissions about host-site availability. Placement must be approved before supervised on-the-job learning begins.',
    },
  ];

  const seen = new Set(generated.map((faq) => faq.question.toLowerCase()));
  for (const faq of program.faqs ?? []) {
    if (!faq?.question || !faq?.answer) continue;
    const key = faq.question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    generated.push(faq);
  }

  return generated;
}
