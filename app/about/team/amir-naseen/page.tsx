import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Amir Naseen | Our Team | Elevate for Humanity',
  description: 'Amir Naseen — Credit Repair Specialist at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Amir Naseen' }]} />
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
                  src="/images/team/amir-naseen.jpg"
                  alt="Amir Naseen"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Amir Naseen</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Credit Repair Specialist</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Amir Naseen serves as a Credit Repair Specialist supporting financial readiness and workforce advancement initiatives. He specializes in credit education, credit profile analysis, and strategic dispute processes that help individuals improve financial stability and access employment, housing, and training opportunities.</p>
                <p>Amir works closely with clients to review credit reports, identify inaccuracies, develop corrective action plans, and provide guidance on responsible credit management aligned with long-term financial growth. His approach focuses on compliance, documentation accuracy, and ethical credit restoration practices that support career development, workforce participation, and economic empowerment within structured training and support programs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
