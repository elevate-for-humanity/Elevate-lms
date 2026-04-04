import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Jesse J. Wilkerson | Our Team | Elevate for Humanity',
  description: 'Jesse J. Wilkerson — Principal — Architecture & Design-Build at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Jesse J. Wilkerson' }]} />
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
                  src="/images/team/jesse-wilkerson.jpg"
                  alt="Jesse J. Wilkerson"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Jesse J. Wilkerson</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Principal — Architecture & Design-Build</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Jesse J. Wilkerson is the Principal of Jesse J. Wilkerson & Associates S-Corp, an architectural and design firm specializing in construction trade integration, architectural planning, and built environment solutions.</p>
                <p>With a strong focus on architecture aligned with real-world construction and workforce development, Jesse leads projects that bridge architectural design, site operations, and trade execution across commercial, industrial, and institutional environments. His work emphasizes practical design, structural coordination, compliance, and efficient construction workflows, ensuring that architectural planning supports both skilled trades and modern infrastructure needs.</p>
                <p>As an architectural leader in the construction trade space, Jesse contributes to projects that connect design, safety standards, site logistics, and building technician pathways to support sustainable construction and workforce-aligned development. His portfolio of successfully completed projects includes industrial (Anderson Flagship / Purdue University Industrial Development), multi-family residential, commercial, retail, health (Jane Pauley), religious, and educational (K-12 / Purdue Polytechnic).</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
