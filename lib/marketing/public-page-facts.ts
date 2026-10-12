export type PublicPageFact = { question: string; answer: string; href: string; link: string };
export type PublicPageFacts = { title: string; imageProgram?: string; facts: PublicPageFact[] };

const apprenticeshipFacts: PublicPageFact[] = [
  { question: 'How do I pay for apprenticeship training?', answer: 'Apprenticeship programs are self-pay only. Review your program’s published tuition, deposit and payment terms before enrollment. Financing, when offered, requires separate provider approval and repayment.', href: '/apprenticeships', link: 'Compare apprenticeship programs' },
  { question: 'Does applying enroll me or reserve a training spot?', answer: 'An inquiry or application does not by itself confirm enrollment or placement. Complete the required intake, payment and enrollment steps shown for your program.', href: '/apply/student', link: 'Start a student application' },
  { question: 'Who pays wages and supervises workplace training?', answer: 'The employing Host Shop or employer provides wages and licensed supervision. Elevate supports related instruction and training records. Employment and schedules depend on an approved placement.', href: '/partners/host-shops', link: 'Explore Host Shops' },
  { question: 'How do I know the hours, tuition and licensing requirements?', answer: 'Use the details on your exact program page. Requirements differ by occupation. A competency-based apprenticeship is completed through its required competencies and related instruction, rather than a single hour total.', href: '/apprenticeships', link: 'Find your program requirements' },
];

export function getPublicPageFacts(pathname: string): PublicPageFacts {
  const programSlug = pathname.match(/^\/programs\/([^/]+)/)?.[1];
  if (/apprenticeship/.test(pathname) || ['/programs/esthetician', '/programs/nail-technician'].includes(pathname)) {
    return { title: 'Apprenticeship facts before you apply', imageProgram: programSlug || 'barber-apprenticeship', facts: apprenticeshipFacts };
  }
  if (/host-shop|barber-beauty-network/.test(pathname)) return {
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
  if (/employer|jobs|career/.test(pathname)) return { title: 'Jobs and employer questions', facts: [
    { question: 'Where do I post an opening?', answer: 'Start with the employer job-posting page and complete the required onboarding and approval steps.', href: '/employers/post-job', link: 'Post a job' },
    { question: 'Where do I find participating employers?', answer: 'The employer directory provides a place to explore participating businesses. A directory listing does not guarantee a current vacancy or a job offer.', href: '/employers/directory', link: 'Browse employers' },
    { question: 'Does completing training guarantee employment?', answer: 'Training and career support do not guarantee hiring. Employers make their own hiring decisions and confirm job requirements and availability.', href: '/career-services', link: 'Explore career support' },
  ] };
  if (pathname.startsWith('/funding')) return { title: 'Tuition and funding facts', facts: [
    apprenticeshipFacts[0],
    { question: 'Is funding available for every career program?', answer: 'No. Workforce funding is specific to the evidenced program and the applicant. The responsible agency determines eligibility and written authorization before funded enrollment.', href: '/funding', link: 'Review program-specific funding' },
    { question: 'Does applying guarantee approval?', answer: 'An application is a request for review. It does not guarantee funding, enrollment, placement or employment.', href: '/programs', link: 'Compare program requirements' },
  ] };
  return { title: 'Quick answers before your next step', imageProgram: programSlug, facts: [
    { question: 'Where do I find the schedule, cost and entry requirements?', answer: 'Open the exact program or product you are considering. Review its published details and required steps before applying or purchasing.', href: '/programs', link: 'Explore program details' },
    apprenticeshipFacts[0],
    { question: 'Does an inquiry enroll me?', answer: 'An inquiry requests information. Enrollment requires the applicable application, intake, payment and enrollment requirements to be completed.', href: '/apply/student', link: 'Start an application' },
    { question: 'Where can I find shops, employers and opportunities?', answer: 'Use the Host Shop and employer directories. Availability and placement are confirmed for the specific occupation and business.', href: '/partners/host-shops', link: 'Explore the network' },
  ] };
}
