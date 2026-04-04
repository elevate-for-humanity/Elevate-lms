import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leslie Wafford | Our Team | Elevate for Humanity',
  description: 'Leslie Wafford — Director of Community Services at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Leslie Wafford' }]} />
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
                  src="/images/leslie-wafford.jpg"
                  alt="Leslie Wafford"
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Leslie Wafford</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Director of Community Services</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.</p>
                <p>As Director of Community Services, Leslie addresses one of the most significant barriers to employment — housing instability. She connects program participants with transitional housing resources, eviction prevention services, and community support networks that enable them to focus on their training and career development.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
