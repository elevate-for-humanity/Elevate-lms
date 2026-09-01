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
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/programs/financial-literacy"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 font-extrabold text-white hover:bg-brand-red-700"
                  >
                    Explore the Financial Empowerment Program
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a
                    href="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:9e274365-f578-4d7e-a21e-29f0e3647862"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 px-6 py-3.5 font-extrabold text-slate-800 hover:border-slate-500"
                  >
                    View Financial Empowerment Program Document
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red-700">
                Program Resource
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Financial Literacy Program Flyer
              </h2>
            </div>
            <a
              href="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:9e274365-f578-4d7e-a21e-29f0e3647862"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-extrabold text-white hover:bg-slate-800"
            >
              Open Full Flyer <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <iframe
              src="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:9e274365-f578-4d7e-a21e-29f0e3647862"
              title="Financial Literacy Program flyer"
              className="h-[720px] w-full sm:h-[900px]"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
