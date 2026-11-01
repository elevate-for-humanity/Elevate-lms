'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STUDENT = [
  {
    href: '/programs',
    label: 'Find your career program',
    text: 'Compare the credential, duration, cost and entry requirements before you apply.',
  },
  {
    href: '/check-eligibility',
    label: 'Understand how to pay',
    text: 'Review funding eligibility or the payment options for your chosen program.',
  },
  {
    href: '/apply/student',
    label: 'Start your application',
    text: 'Tell admissions which program you want. Then follow your document and enrollment checklist.',
  },
];
const EMPLOYER = [
  {
    href: '/hire-graduates',
    label: 'Connect with career talent',
    text: 'Review hiring services and tell the team about your role and requirements.',
  },
  {
    href: '/partners/host-shops',
    label: 'Become a Host Shop',
    text: 'Review supervision responsibilities and apply to host workplace learning.',
  },
  {
    href: '/partners/apply',
    label: 'Start a partnership',
    text: 'Submit your organization and goals so the team can review the right pathway.',
  },
];

export default function PublicPathwayLinks() {
  const path = usePathname() || '/';
  // Transaction, authentication, policy and operational screens retain their focused flows.
  const employer =
    /^\/(?:employers?|for-employers|hire-graduates|partners|host-shops|for-agencies)(?:\/|$)/.test(
      path,
    );
  const student =
    /^\/(?:programs|apprenticeships|barber-and-beauty-apprenticeships|funding|student-resources|student-support|career-services|employment-support|how-it-works|tuition|financing|grants|faq|about)(?:\/|$)/.test(
      path,
    );
  if (
    (!employer && !student) ||
    /\/(?:apply|confirmation|dashboard|onboarding|mou|orientation)(?:\/|$)/.test(path)
  )
    return null;
  const cards = (employer ? EMPLOYER : STUDENT).filter((card) => card.href !== path);
  return (
    <section
      aria-labelledby="connected-next-step-heading"
      className="border-t border-slate-200 bg-slate-50 px-4 py-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-700">
          Keep moving forward
        </p>
        <h2
          id="connected-next-step-heading"
          className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl"
        >
          {employer ? 'Choose how you want to work with Elevate.' : 'Your next step starts here.'}
        </h2>
        <div className="mt-5 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-600"
            >
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-bold text-slate-950">{card.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{card.text}</p>
                <span className="mt-auto inline-flex min-h-11 items-center pt-3 text-sm font-bold text-brand-red-700">
                  {card.label} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
