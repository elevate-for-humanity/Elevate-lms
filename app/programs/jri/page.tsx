// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import PageAvatar from '@/components/PageAvatar';
import {
  Heart,
  CheckCircle,
  ArrowRight,
  Play,
  Users,
  Briefcase,
  Home,
  Shield,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'JRI Programs | Justice Reinvestment Initiative | Elevate for Humanity',
  description:
    'Second chance career training for justice-involved individuals. Free programs through Indiana JRI funding.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/jri',
  },
};

export default function JRIProgramsPage() {
  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'JRI Programs' },
        ]}
      />
      {/* Hero */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/heroes-hq/jri-hero.jpg"
            alt="JRI Programs"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-white font-semibold text-sm">Justice Reinvestment Initiative</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Everyone Deserves
              <span className="block text-indigo-300">A Second Chance</span>
            </h1>

            <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
              Funded career training and wraparound support for justice-involved 
              individuals in Indiana. Your past doesn&apos;t define your future.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/apply?program=jri"
                className="inline-flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all"
              >
                Apply Now - It&apos;s Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/lms/courses?category=jri"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                <Play className="w-5 h-5" />
                Access JRI Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/orientation-guide.mp4" title="JRI Programs Guide" />

      {/* What is JRI */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6">
                What is the Justice Reinvestment Initiative?
              </h2>
              <div className="space-y-4 text-lg text-slate-600">
                <p>
                  The Justice Reinvestment Initiative (JRI) is an Indiana state-funded program 
                  designed to reduce recidivism by providing free career training and support 
                  services to individuals who have been involved in the criminal justice system.
                </p>
                <p>
                  JRI recognizes that stable employment is one of the most important factors 
                  in preventing re-offense. By investing in job training, education, and 
                  wraparound support, JRI helps participants build sustainable careers and 
                  become contributing members of their communities.
                </p>
                <p>
                  Elevate for Humanity is a proud JRI-approved training provider, offering 
                  a range of career programs specifically designed for justice-involved 
                  individuals.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">JRI at a Glance</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">State-Funded</h4>
                    <p className="text-slate-600 text-sm">Funded training for eligible participants</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Job-Focused</h4>
                    <p className="text-slate-600 text-sm">Training leads directly to employment opportunities</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Support Services</h4>
                    <p className="text-slate-600 text-sm">Case management, housing help, and mental health support</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Reentry Focus</h4>
                    <p className="text-slate-600 text-sm">Designed for successful community reintegration</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Who Qualifies for JRI?</h2>
            <p className="text-lg text-slate-600">JRI programs are available to Indiana residents who meet the following criteria</p>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-8">
            <ul className="space-y-4">
              {[
                'Currently on probation, parole, or community corrections supervision',
                'Recently released from incarceration (typically within 3 years)',
                'Referred by a probation officer, parole officer, or reentry program',
                'Indiana resident with valid identification',
                'Committed to completing training and obtaining employment',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Access Courses CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Play className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Access JRI Training Courses
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Already enrolled? Access your JRI courses through our Learning Management System.
          </p>
          <Link
            href="/lms/courses?category=jri"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all"
          >
            <Play className="w-5 h-5" />
            Go to JRI Courses
          </Link>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-12 h-12 text-white mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            Ready for Your Second Chance?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Apply today. Training is Funded for eligible participants.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply?program=jri"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-800 transition-all"
            >
              Talk to Someone
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
