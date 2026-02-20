export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, BookOpen, Users, BarChart3, FileText, Settings } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageAvatar from '@/components/PageAvatar';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate For Humanity',
  description: 'Manage your training programs, track student progress, and access program management tools.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder',
  },
};

const features = [
  {
    icon: BookOpen,
    title: 'Program Management',
    description: 'Create and manage training programs, curricula, and course content.',
  },
  {
    icon: Users,
    title: 'Student Tracking',
    description: 'Monitor student enrollment, progress, and completion rates.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'View detailed reports on program performance and outcomes.',
  },
  {
    icon: FileText,
    title: 'Compliance Reports',
    description: 'Generate WIOA compliance and funding reports automatically.',
  },
  {
    icon: Building2,
    title: 'Partner Network',
    description: 'Connect with employers and workforce agencies.',
  },
  {
    icon: Settings,
    title: 'Program Settings',
    description: 'Configure program requirements, schedules, and pricing.',
  },
];

export default async function ProgramHolderLanding() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('program_holders').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Program Holder' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden bg-teal-800">
        <Image
          src="/images/heroes/training-provider-2.jpg"
          alt="Program Holder Portal"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Program Holder Portal</h1>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Manage your training programs, track outcomes, and grow your workforce development impact.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/login?redirect=/program-holder/dashboard" className="px-8 py-4 bg-white text-teal-800 font-bold rounded-lg hover:bg-teal-50">
              Sign In
            </Link>
            <Link href="/onboarding/partner" className="px-8 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 border border-teal-400">
              Become a Program Holder
            </Link>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/orientation-guide.mp4" 
        title="Program Holder Welcome" 
      />

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border">
                <feature.icon className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Expand Your Training Programs?</h2>
          <p className="text-teal-100 mb-8">
            Join our network of training providers and access WIOA-funded students.
          </p>
          <Link href="/partners" className="px-8 py-4 bg-white text-teal-800 font-bold rounded-lg hover:bg-teal-50 inline-block">
            Learn About Partnership
          </Link>
        </div>
      </section>
    </div>
  );
}
