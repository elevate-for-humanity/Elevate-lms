export const dynamic = 'force-dynamic';

import PageVideoHero from '@/components/ui/PageVideoHero';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import {
  Users,
  Building2,
  GraduationCap,
  ArrowRight,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/onboarding',
  },
  title: 'Welcome & Onboarding | Elevate For Humanity',
  description: 'Get started with your training journey.',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data }: any = await db
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    profile = data;
    if (profile?.role === 'student') redirect('/onboarding/learner');
    else if (profile?.role === 'program_holder')
      redirect('/program-holder/onboarding');
    else if (profile?.role === 'admin' || profile?.role === 'super_admin')
      redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[400px] sm:h-[500px] w-full overflow-hidden bg-white">
        <Image
          src="/images/pages/onboarding-page-2.jpg"
          alt="Welcome to Elevate for Humanity"
          fill
          className="object-cover"
          priority
          quality={95}
          sizes="100vw"
        />
      </section>
      <section className="py-12 sm:py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-4">
            Welcome to Elevate for Humanity
          </h1>
          <p className="text-base md:text-lg sm:text-base md:text-lg text-black mb-6">
            Choose your path to get started with our platform and access free
            workforce training.
          </p>
        </div>
      </section>
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            Choose Your Path
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Link
              href="/onboarding/learner"
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative h-40 overflow-hidden">
                <Image src="/images/pages/onboarding-page-2.jpg" alt="Student" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-8">
              <h3 className="text-lg md:text-lg font-bold text-black mb-3 text-center">
                I'm a Student
              </h3>
              <p className="text-black mb-6 text-center">
                Start your free training, access courses, and earn
                certifications.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Access 30+ training programs</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Free for eligible participants</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Earn industry certifications</span>
                </li>
              </ul>
              <div className="text-center">
                <span className="inline-flex items-center text-brand-blue-700 font-semibold">
                  Get Started <ArrowRight className="ml-2" size={20} />
                </span>
              </div>
              </div>
            </Link>
            <Link
              href="/program-holder/onboarding"
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative h-40 overflow-hidden">
                <Image src="/images/pages/prog-hero-main-2.jpg" alt="Program Holder" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-8">
              <h3 className="text-lg md:text-lg font-bold text-black mb-3 text-center">
                I'm a Program Holder
              </h3>
              <p className="text-black mb-6 text-center">
                Manage students, track progress, and access reports.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Enroll and manage students</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Track student progress</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Generate compliance reports</span>
                </li>
              </ul>
              <div className="text-center">
                <span className="inline-flex items-center text-brand-blue-700 font-semibold">
                  Learn More <ArrowRight className="ml-2" size={20} />
                </span>
              </div>
              </div>
            </Link>
            <Link
              href="/onboarding/partner"
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative h-40 overflow-hidden">
                <Image src="/images/pages/onboarding-page-2.jpg" alt="Partner/Employer" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-8">
              <h3 className="text-lg md:text-lg font-bold text-black mb-3 text-center">
                I'm a Partner/Employer
              </h3>
              <p className="text-black mb-6 text-center">
                Partner with us to train your workforce or hire our graduates.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Access trained candidates</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Custom training programs</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Workforce development</span>
                </li>
              </ul>
              <div className="text-center">
                <span className="inline-flex items-center text-brand-orange-700 font-semibold">
                  Partner With Us <ArrowRight className="ml-2" size={20} />
                </span>
              </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg text-brand-blue-100 mb-8">
            Create your account and start your career training journey today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
            >
              Sign Up Now
            </Link>
            <Link
              href="/programs"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
