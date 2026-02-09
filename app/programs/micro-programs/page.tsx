// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { programs } from '@/app/data/programs';
import { Zap, Clock, Target, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title:
    'Micro-Credentials & Short Programs | Quick Certifications | Elevate for Humanity',
  description:
    'Fast-track certifications in 2-8 weeks. CPR, Workforce Readiness, Peer Recovery Coach, and more. Get certified, get hired.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/micro-programs',
  },
};

const microProgramSlugs = [
  'cpr-certification',
  'workforce-readiness',
  'peer-recovery-coach',
  'drug-collector',
  'emergency-health-safety-tech',
];

export default async function MicroProgramsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch micro programs
  const { data: dbMicroPrograms } = await supabase
    .from('programs')
    .select('*')
    .eq('type', 'micro');

  const microPrograms = programs.filter((p) =>
    microProgramSlugs.includes(p.slug)
  );

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Micro Programs' },
        ]}
      />
      {/* Hero */}
      <section className="relative bg-purple-800 text-white px-6 sm:px-10 lg:px-12 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-semibold">Micro Programs</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Get Certified Fast
          </h1>

          <p className="text-xl sm:text-2xl text-blue-100 leading-relaxed max-w-3xl mx-auto">
            Short-term certifications you can complete in days or weeks. Perfect
            for adding credentials, meeting job requirements, or starting a new
            career path quickly.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-black text-center leading-tight mb-12">
            Why Micro Programs Matter
          </h2>

          <div className="space-y-6 text-lg text-black leading-relaxed">
            <p>
              Not every career path requires years of training. Sometimes you
              just need a specific certification to qualify for a job, meet a
              requirement, or add a valuable skill to your resume.
            </p>

            <p>
              <span className="font-bold text-black">
                Micro programs get you there fast.
              </span>{' '}
              These short-term certifications are designed to be completed in
              days or weeks, not months or years. You learn exactly what you
              need, get certified, and move forward.
            </p>

            <p>
              Many employers require certifications like CPR, workforce
              readiness, or specialized safety training. These micro programs
              check those boxes quickly and affordably—often at no cost to you.
            </p>

            <p className="text-xl font-bold text-black">
              Small credentials can open big doors. Start here.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Micro Program Benefits
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Fast Completion</h3>
              <p className="text-black">
                Finish in days or weeks, not months
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-brand-blue-600 mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Focused Training</h3>
              <p className="text-black">
                Learn exactly what you need, nothing extra
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-600 mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Career Boost</h3>
              <p className="text-black">
                Add credentials to your resume quickly
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-brand-orange-600 mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Low Cost</h3>
              <p className="text-black">Affordable or free with funding</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Available Micro Programs
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {microPrograms.map((program: any) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-48 w-full overflow-hidden bg-white">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-16 h-16 text-blue-600" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black mb-2">
                    {program.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-2 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {program.duration}
                    </span>
                    <span className="px-3 py-2 bg-brand-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Quick Start
                    </span>
                  </div>
                  <span className="inline-flex items-center font-semibold text-blue-600 group-hover:underline text-sm">
                    Learn More →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            When to Choose a Micro Program
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h3 className="font-bold text-black mb-2">
                You need a specific certification
              </h3>
              <p className="text-black">
                Many jobs require CPR, safety training, or other specific
                credentials. Get certified quickly.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h3 className="font-bold text-black mb-2">
                You're exploring career options
              </h3>
              <p className="text-black">
                Try a short program to see if a field interests you before
                committing to longer training.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h3 className="font-bold text-black mb-2">
                You want to add skills fast
              </h3>
              <p className="text-black">
                Boost your resume with additional certifications that make you
                more competitive.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h3 className="font-bold text-black mb-2">
                You need workforce readiness
              </h3>
              <p className="text-black">
                Prepare for employment with essential workplace skills and
                professional development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Micro Programs"
            partnerCertifications={[
              'CPR/AED/First Aid Certification (issued by American Heart Association or HSI)',
              'OSHA 10/30-Hour Safety Certification',
              'Forklift Operator Certification',
              'Food Handler Certification',
            ]}
            employmentOutcomes={[
              'Enhanced employability with stackable credentials',
              'Workplace safety compliance',
              'Career advancement opportunities',
              'Foundation for longer-term programs',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-6">
            Get Credentialed This Month
          </h2>
          <p className="text-xl text-black mb-8">
            Start a micro program and complete your training in weeks.
          </p>
          <Link
            href="/apply"
            className="inline-flex px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-lg"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
