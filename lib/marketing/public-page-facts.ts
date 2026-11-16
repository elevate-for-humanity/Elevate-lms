import { resolveSlug } from '@/lib/program-registry';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
export type PublicPageFact = { question: string; answer: string; href: string; link: string };
export type PublicPageFacts = { title: string; imageProgram?: string; facts: PublicPageFact[] };

const apprenticeshipFacts: PublicPageFact[] = [
  { question: 'How do I pay for apprenticeship training?', answer: 'Apprenticeship programs are self-pay only. Review the published total tuition, deposit, supplies, and what is due now. Pay in full or use a program payment plan when offered. BNPL, when displayed, is third-party financing requiring provider approval and repayment; review interest and terms. It is not a grant.', href: '/apprenticeships', link: 'Compare apprenticeship programs' },
  { question: 'Does applying enroll me or reserve a training spot?', answer: 'An inquiry is free and requests information; it does not enroll you or reserve placement. An enrollment application requests admission and requires the payment steps shown for your program. Enrollment is confirmed only after Elevate verifies approval, documents, agreements, payment arrangements, and any required placement.', href: '/apply/student', link: 'Start a student application' },
  { question: 'Who pays wages and supervises workplace training?', answer: 'The employing Host Shop or employer provides wages and licensed supervision. Elevate supports related instruction and training records. Employment and schedules depend on an approved placement.', href: '/partners/host-shops', link: 'Explore Host Shops' },
  { question: 'How do I know the hours, tuition and licensing requirements?', answer: 'Use the details on your exact program page. Requirements differ by occupation. A competency-based apprenticeship is completed through its required competencies and related instruction, rather than a single hour total.', href: '/apprenticeships', link: 'Find your program requirements' },
];

export function getPublicPageFacts(pathname: string): PublicPageFacts {
  const programPath = pathname.match(/^\/programs\/(?:(healthcare|healthcare-training)\/)?([^/]+)\/?$/);
  const programSlug = programPath?.[2];
  const applicationSlug = programSlug ? resolveSlug(programSlug) : undefined;
  const contract = programSlug ? getRegisteredProgramStandard(programSlug) : null;
  if (contract || /^\/apprenticeships(?:\/|$)/.test(pathname) || (programSlug?.endsWith('-apprenticeship') ?? false)) {
    const facts = contract ? [...apprenticeshipFacts.slice(0, 3), { question: 'What are the completion requirements for this occupation?', answer: `${contract.standard.occupationTitle} requires ${contract.completion.competencyCount} verified occupational competencies and ${contract.completion.requiredRtiHours} hours of related technical instruction, with supervised Host Shop practice. Work hours are training evidence, not a fixed graduation denominator. Apprenticeship completion and Indiana licensing requirements are separate steps.`, href: pathname, link: 'Review the complete occupation requirements' }] : apprenticeshipFacts;
    return { title: 'Apprenticeship facts before you apply', imageProgram: programSlug || 'barber-apprenticeship', facts };
  }
  if (/^\/(?:partners\/)?(?:host-shops?|barber-beauty-network)(?:\/|$)/.test(pathname)) return {
    title: 'Host Shop and network questions', imageProgram: 'barber-apprenticeship', facts: [
      { question: 'Is it free to join as a Host Shop?', answer: 'There is no Host Shop application or placement fee. The shop still covers employee wages, insurance and normal business expenses. Apprenticeship tuition is self-pay only.', href: '/host-shop/apply', link: 'Apply free as a Host Shop' },
      { question: 'Can any business begin training apprentices immediately?', answer: 'Elevate verifies the occupation, worksite, licenses, insurance and supervising professional before approval and placement. Submitting an application is not approval.', href: '/partners/host-shops', link: 'Review Host Shop requirements' },
      { question: 'Which shops train in my occupation?', answer: 'Use the Barber, Cosmetology, Nail Technician or Esthetics filters. A listing does not guarantee an open position; placement depends on the occupation and current supervisor capacity.', href: '/partners/host-shops', link: 'Browse the shop directory' },
      { question: 'Where can a business list a job?', answer: 'Use the employer job-posting path. Employer onboarding and applicable approval are required before a posting is published.', href: '/employers/post-job', link: 'Post an employer job' },
    ],
  };
  if (pathname.startsWith('/store')) return { title: 'Before you choose a store product', facts: [
    { question: 'Where can I see the price and try a product?', answer: 'Each catalog offer links to its product details, available demo and pricing information. Review the plan, included features and any limits before checkout.', href: '/store#marketplace', link: 'Browse the catalog' },
    { question: 'Are barber, cosmetology, esthetics and nail student kits available?', answer: 'Supplier-fulfilled student kits are not available to order yet. Kits need verified contents, a retail price, shipping terms and a working supplier fulfillment connection before checkout opens.', href: '/store', link: 'Check current store availability' },
    { question: 'Do demos use my real business records?', answer: 'Demo environments illustrate product workflows. Use your authenticated workspace for your own business or learner records.', href: '/store/demos', link: 'Explore demos' },
    { question: 'What should I check before buying?', answer: 'Review the specific offer’s price, billing frequency, availability, included features and terms. Product availability and plan limits differ between offers.', href: '/store/proof', link: 'Review offer details and limits' },
  ] };
  if (/^\/(?:employers?|jobs|careers?|career-services)(?:\/|$)/.test(pathname)) return { title: 'Jobs and employer questions', facts: [
    { question: 'Where do I post an opening?', answer: 'Start with the employer job-posting page and complete the required onboarding and approval steps.', href: '/employers/post-job', link: 'Post a job' },
    { question: 'Where do I find participating employers?', answer: 'The employer directory provides a place to explore participating businesses. A directory listing does not guarantee a current vacancy or a job offer.', href: '/employers/directory', link: 'Browse employers' },
    { question: 'Does completing training guarantee employment?', answer: 'Training and career support do not guarantee hiring. Employers make their own hiring decisions and confirm job requirements and availability.', href: '/career-services', link: 'Explore career support' },
  ] };
  if (pathname.startsWith('/funding')) return { title: 'Tuition and funding facts', facts: [
    apprenticeshipFacts[0],
    { question: 'Is funding available for every career program?', answer: 'No. Workforce funding is specific to the evidenced program and the applicant. The responsible agency determines eligibility and written authorization before funded enrollment.', href: '/funding', link: 'Review program-specific funding' },
    { question: 'Does applying guarantee approval?', answer: 'An application is a request for review. It does not guarantee funding, enrollment, placement or employment.', href: '/programs', link: 'Compare program requirements' },
  ] };
  if (pathname === '/testing' || pathname.startsWith('/testing/')) return {
    title: 'Testing appointment questions', facts: [
      { question: 'How do I choose a testing date?', answer: 'Select your provider and exam, then choose an available date and appointment time in the booking form. Only published appointments with enough space for your group can be selected.', href: '/testing#booking', link: 'Choose a testing appointment' },
      { question: 'Does adding an exam to the cart reserve my appointment?', answer: 'Adding an exam to the cart does not reserve a date. Complete the appointment selection and secure checkout. Review your booking confirmation before attending.', href: '/testing#booking', link: 'Complete your booking' },
      { question: 'What if no appointment is available?', answer: 'Contact the testing center for scheduling assistance before paying. An unavailable date cannot be booked.', href: '/contact', link: 'Contact the testing center' },
    ],
  };
  if (programSlug && (applicationSlug || programPath?.[1])) return {
    title: 'Questions about this program', imageProgram: programSlug, facts: [
      { question: 'Where are this program’s schedule, cost and entry requirements?', answer: 'Review the schedule, tuition, included materials and admission requirements on this program page. Requirements and payment arrangements are specific to the selected program.', href: pathname, link: 'Review this program' },
      ...(applicationSlug ? [{ question: 'How do I apply for this program?', answer: 'An inquiry requests information. Admission requires the applicable application, documents and enrollment steps for this program. An inquiry alone does not reserve a place.', href: `/apply/student?program=${encodeURIComponent(applicationSlug)}`, link: 'Apply for this program' }] : []),
      { question: 'Does completing the course award a certification?', answer: 'Course completion and an external certification or license are separate steps. Review the credentials and any examination requirements listed for this program.', href: pathname, link: 'Review program credentials' },
    ],
  };
  // Unrelated pages already contain their own content. Do not append another
  // program’s tuition, Host Shop instructions or enrollment block to them.
  return { title: '', facts: [] };
}
