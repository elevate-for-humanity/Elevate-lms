import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Clystjah Woodley | Our Team | Elevate for Humanity',
  description: 'Clystjah Woodley — Program Coordinator at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Clystjah Woodley' }]} />
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
                  src="/images/clystjah-woodley.jpg"
                  alt="Clystjah Woodley"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Clystjah Woodley</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Program Coordinator</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Clystjah supports program operations and student services at Elevate for Humanity, helping participants navigate enrollment and stay on track through their training programs.</p>
                <p>She coordinates scheduling, tracks student progress, manages documentation requirements, and serves as a point of contact for participants throughout their training journey.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
