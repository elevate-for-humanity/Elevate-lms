export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Dr. Carlina Wilkes | Our Team',
  description: `Dr. Carlina Wilkes leads financial operations, organizational compliance, and the Financial Empowerment Program at ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute.`,
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Dr. Carlina Wilkes' }]} />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/about/team" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-red-600 mb-8">
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
              <p className="text-brand-red-600 font-bold text-lg mb-1">Executive Director of Financial Operations &amp; Organizational Compliance</p>
              <p className="text-slate-600 font-bold text-base mb-6">Financial Empowerment Program Instructor</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Dr. Wilkes brings over 24 years of federal experience with the Defense Finance and Accounting Service (DFAS) and holds DoD Financial Management Certification Level II. She oversees financial operations and organizational compliance at {PLATFORM_DEFAULTS.orgName}.</p>
                <p>Her extensive background includes federal financial management, cost accounting, budget development and monitoring, audit readiness, regulatory compliance, financial reporting, and long-term financial planning. Her leadership helps Elevate maintain strong fiscal accountability across its programs and operations.</p>
                <p>Dr. Wilkes also leads the Elevate Financial Empowerment Program. As the program instructor, she helps participants understand their financial position, establish meaningful goals, and apply practical strategies for budgeting, banking, saving, credit, debt management, consumer protection, taxes, insurance, investing, and long-term wealth building.</p>
                <div className="pt-4">
                  <Link
                    href="/programs/financial-literacy"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 font-extrabold text-white hover:bg-brand-red-700"
                  >
                    Explore the Financial Empowerment Program
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
