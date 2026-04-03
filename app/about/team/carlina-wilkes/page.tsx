import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dr. Carlina Wilkes | Our Team | Elevate for Humanity',
  description: 'Dr. Carlina Wilkes — Executive Director of Financial Operations & Organizational Compliance at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Dr. Carlina Wilkes' }]} />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/about/team" className="inline-flex items-center text-sm text-black hover:text-brand-red-600 mb-8">
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
              <p className="text-brand-red-600 font-bold text-lg mb-6">Executive Director of Financial Operations & Organizational Compliance</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Dr. Wilkes brings over 24 years of federal experience with the Defense Finance and Accounting Service (DFAS), holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.</p>
                <p>Her extensive background in federal financial management, audit readiness, and regulatory compliance ensures that Elevate maintains the highest standards of fiscal accountability across all funded programs including WIOA, WRG, and Job Ready Indy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
