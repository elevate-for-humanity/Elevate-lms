import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sharon Douglass | Our Team | Elevate for Humanity',
  description: 'Sharon Douglass — Respiratory Therapy & Health Informatics Specialist at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Sharon Douglass' }]} />
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
                  src="/images/sharon-douglas.jpg"
                  alt="Sharon Douglass"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Sharon Douglass</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Respiratory Therapy & Health Informatics Specialist</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Sharon brings over 30 years of experience as a Respiratory Therapist with a Master's degree in Health Informatics. She supports healthcare training programs and workforce readiness initiatives at Elevate for Humanity.</p>
                <p>Her three decades of clinical experience combined with graduate-level expertise in health informatics provides credibility and depth to Elevate's healthcare program offerings, including CNA, medical assistant, and phlebotomy training.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
