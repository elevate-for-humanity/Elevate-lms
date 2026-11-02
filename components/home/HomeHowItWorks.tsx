import HomeSectionNarration from './HomeSectionNarration';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  {
    n: '1',
    label: 'Choose your program',
    detail: 'Compare training, tuition, and the credential you can earn.',
    href: '/programs',
    action: 'Explore programs',
    image: '/images/programs/refresh-20261101/beauty.webp',
    alt: 'Illustration of beauty career training',
  },
  {
    n: '2',
    label: 'Check funding options',
    detail: 'See eligibility requirements and ways to pay for training.',
    href: '/check-eligibility',
    action: 'Check eligibility',
    image: '/images/programs/refresh-20261101/business.webp',
    alt: 'Illustration of professionals reviewing a plan together',
  },
  {
    n: '3',
    label: 'Apply and get started',
    detail: 'Tell us your program interest so we can guide your enrollment.',
    href: '/apply',
    action: 'Start your application',
    image: '/images/programs/refresh-20261101/home.webp',
    alt: 'Illustration of the Elevate training institute',
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section
      data-home-enrollment-steps
      className="bg-white px-4 py-6"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 max-w-2xl">
          <h2 id="how-it-works-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Start here. Three simple steps.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Find your training, review funding, then apply.
          </p>
        </div>
        <HomeSectionNarration section="journey" />
        <ol className="grid list-none gap-3 p-0 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="m-0">
              <Link
                href={step.href}
                className="group flex h-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-950 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-800"
              >
                <Image
                  src={step.image}
                  alt={step.alt}
                  width={80}
                  height={88}
                  sizes="80px"
                  className="h-[88px] w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-5 text-slate-950">
                    {step.n}. {step.label}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{step.detail}</p>
                  <span className="mt-2 inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-slate-950">
                    {step.action}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
