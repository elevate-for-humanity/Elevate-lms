import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, GraduationCap, Briefcase, DollarSign, Users, Monitor, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Features | Elevate for Humanity',
  description: 'Self-service enrollment, funding verification, career services, and employer connections — all online. No phone calls needed.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/features' },
};

const features = [
  {
    icon: GraduationCap,
    title: 'Online Enrollment',
    desc: 'Apply for programs, upload documents, and track your application status — all from your phone or computer. No office visit required.',
    color: 'bg-brand-blue-50 text-brand-blue-600',
  },
  {
    icon: DollarSign,
    title: 'Funding Verification',
    desc: 'Check your eligibility for WIOA, WRG, and JRI funding online. See which programs are covered before you apply.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Monitor,
    title: 'Learning Management System',
    desc: 'Access course materials, complete assignments, track progress, and earn certifications through our online LMS.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Briefcase,
    title: 'Career Services Portal',
    desc: 'Build your resume, practice interviews, search job listings, and connect with employer partners — all self-service.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Users,
    title: 'Employer Connections',
    desc: 'Employers post jobs and browse certified graduates. Students get matched with employers hiring in their field.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Shield,
    title: 'Secure Document Portal',
    desc: 'Upload IDs, transcripts, and certifications securely. Download completion certificates and credential verification letters.',
    color: 'bg-slate-100 text-slate-600',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Features' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image src="/images/gallery/image8.jpg" alt="Platform features" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 w-full pb-10 sm:pb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">Platform Features</h1>
            <p className="text-lg text-white/90 max-w-2xl">Everything you need to enroll, train, and get hired — online, self-service, no phone calls needed.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Self-Service Highlight */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/heroes/programs-overview.jpg" alt="Self-service platform" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Built for Self-Service</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Our platform is designed to eliminate phone calls and office visits. Students can apply, check funding eligibility, upload documents, track progress, and connect with employers — all online, 24/7.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Employers can post jobs, browse certified candidates, and manage apprenticeship placements through the employer portal.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                  Student Application <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/employer" className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:border-slate-400 transition">
                  Employer Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-10">Apply online in minutes. No appointment needed.</p>
          <Link href="/apply/student" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-xl transition hover:scale-105 shadow-lg">
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
