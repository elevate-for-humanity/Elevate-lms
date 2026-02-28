import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Alina Smith, PMHNP | Our Team | Elevate for Humanity',
  description: 'Alina Smith, PMHNP — Psychiatric Mental Health Nurse Practitioner at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Alina Smith, PMHNP' }]} />
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
                  src="/images/alina-smith.jpg"
                  alt="Alina Smith, PMHNP"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Alina Smith, PMHNP</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Psychiatric Mental Health Nurse Practitioner</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Alina is a board-certified Psychiatric Mental Health Nurse Practitioner (PMHNP) from Purdue University. She provides mental health assessments, interventions, and medication management for program participants at Elevate for Humanity.</p>
                <p>Her clinical expertise enables Elevate to address mental health barriers that often prevent individuals from completing training programs and maintaining employment. Alina's trauma-informed approach supports participants dealing with anxiety, depression, PTSD, and substance use recovery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
