export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Dr. Carlina Wilkes | Our Team',
  description: `Dr. Carlina Wilkes is an executive leader and business-program instructor overseeing financial operations and organizational compliance at ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute.`,
};

const programPortfolio = [
  'Financial Empowerment',
  'Bookkeeping',
  'Business Management',
  'Business Start-Up',
  'Tax Preparation',
];

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Team', href: '/about/team' }, { label: 'Dr. Carlina Wilkes' }]}
        />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/about/team"
            className="inline-flex items-center text-sm text-slate-500 hover:text-brand-red-600 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
          </Link>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/carlina-wilkes.jpg"
                  alt="Dr. Carlina Wilkes"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Dr. Carlina Wilkes</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-1">
                Executive Director of Financial Operations &amp; Organizational Compliance
              </p>
              <p className="text-slate-600 font-bold text-base mb-6">
                Executive Leadership &amp; Business Programs Instructor
              </p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>
                  Dr. Wilkes brings over 24 years of federal experience with the Defense Finance and
                  Accounting Service (DFAS) and holds DoD Financial Management Certification Level
                  II. She oversees financial operations and organizational compliance at{' '}
                  {PLATFORM_DEFAULTS.orgName}.
                </p>
                <p>
                  Her extensive background includes federal financial management, cost accounting,
                  budget development and monitoring, audit readiness, regulatory compliance,
                  financial reporting, and long-term financial planning. Her leadership helps
                  Elevate maintain strong fiscal accountability across its programs and operations.
                </p>
                <p>
                  Dr. Wilkes is part of Elevate&apos;s executive leadership and supports instruction
                  across a broad business-program portfolio. She helps participants connect sound
                  financial practice, compliant operations, business planning, bookkeeping, and tax
                  fundamentals to practical career and enterprise goals.
                </p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Programs under her leadership
                  </h2>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {programPortfolio.map((program) => (
                      <li
                        key={program}
                        className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm"
                      >
                        {program}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-brand-red-200 bg-brand-red-50 p-5">
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Experience and credentials
                  </h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-800">
                    <li>More than 24 years of federal financial management experience with DFAS</li>
                    <li>DoD Financial Management Certification Level II</li>
                    <li>
                      Federal cost accounting, budgeting, audit readiness, and regulatory compliance
                    </li>
                    <li>
                      Financial reporting, organizational controls, and long-term financial planning
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
