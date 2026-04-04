import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delores Reynolds | Our Team | Elevate for Humanity',
  description: 'Delores Reynolds — Social Media & Digital Engagement Coordinator at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Delores Reynolds' }]} />
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
                  src="/images/delores-reynolds.jpg"
                  alt="Delores Reynolds"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Delores Reynolds</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Social Media & Digital Engagement Coordinator</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Delores manages digital communications for Elevate for Humanity, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.</p>
                <p>She develops content strategies across social media platforms, manages the organization's digital presence, and creates compelling narratives that connect prospective students with training opportunities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
