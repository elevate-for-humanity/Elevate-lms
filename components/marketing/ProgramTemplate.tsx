// components/marketing/ProgramTemplate.tsx
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  Award,
  Briefcase,
  GraduationCap,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface ProgramData {
  name: string;
  slug: string;
  description: string;
  duration: string;
  salaryRange: string;
  heroImage: string;
  skills: Array<{ title: string; description: string }>;
  jobTitles: Array<{ title: string; setting: string }>;
  outcomes: {
    jobPlacement: number;
    certificationPass: number;
    satisfaction: number;
  };
  certification: string;
  schedule: string[];
  requirements: string[];
  support: string[];
}

interface ProgramTemplateProps {
  program: ProgramData;
}

export function ProgramTemplate({ program }: ProgramTemplateProps) {
  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: program.name }]} />
        </div>
      </div>

      {/* TOP BANNER */}
      <section className="   py-3 sticky top-0 z-50 shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-brand-orange-500 px-3 py-2 text-xs font-bold text-white animate-pulse">
                🔥 NOW ENROLLING
              </span>
              <p className="text-slate-900 font-semibold text-sm sm:text-base">
                Free Career Training - 100% Government Funded • Start in 2 Weeks
              </p>
            </div>
            <Link
              href={`/apply?program=${program.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-bold text-brand-orange-600 hover:bg-brand-orange-50 transition-all shadow-lg hover:scale-105 whitespace-nowrap"
            >
              Apply Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative h-[700px] overflow-hidden">
        <Image
          src={program.heroImage}
          alt={`${program.name} in training`}
          fill
          className="object-cover"
          priority
          quality={100}
        />

        <div className="relative h-full flex items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white mb-6">
                <Award size={16} />
                <span>No-Cost Training for Eligible Students</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-6 leading-tight">
                {program.name}
              </h1>

              <p className="text-xl md:text-2xl text-slate-200 font-light mb-8 leading-relaxed">
                {program.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
                <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/40">
                  <Clock size={24} className="text-white" />
                  <div>
                    <div className="text-sm text-white">Duration</div>
                    <div className="font-bold text-white">
                      {program.duration}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/40">
                  <DollarSign size={24} className="text-white" />
                  <div>
                    <div className="text-sm text-white">Salary Range</div>
                    <div className="font-bold text-white">
                      {program.salaryRange}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/apply?program=${program.slug}`}
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 text-white font-semibold rounded hover:bg-brand-orange-600 transition-colors shadow-lg"
                >
                  Apply Now
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded border-2 border-white hover:bg-slate-50 transition-colors shadow-lg"
                >
                  All Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GOVERNMENT PARTNERS BAR */}
      <section className="border-y border-slate-200 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Approved Workforce Development Partner
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="text-center">
              <p className="font-semibold text-black">EmployIndy</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">WorkOne</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">Indiana DWD</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">US Dept of Labor</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              What You'll Learn
            </h2>
            <p className="text-lg text-black max-w-3xl mx-auto">
              Our comprehensive curriculum covers all the skills you need to
              excel as a {program.name}.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {program.skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-red-100 flex items-center justify-center">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">
                    {skill.title}
                  </h3>
                  <p className="text-sm text-black">{skill.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Outcomes Section */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Career Opportunities
              </h2>
              <p className="text-lg text-black mb-8">
                {program.name}s are in high demand across healthcare settings.
                Upon completion, you'll be qualified for positions including:
              </p>

              <div className="space-y-4">
                {program.jobTitles.map((job, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200"
                  >
                    <Briefcase
                      size={20}
                      className="text-brand-orange-600 flex-shrink-0"
                    />
                    <div>
                      <div className="font-bold text-black">
                        {job.title}
                      </div>
                      <div className="text-sm text-black">
                        {job.setting}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
              <h3 className="text-2xl font-bold text-black mb-6">
                Program Outcomes
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-black">Job Placement Rate</span>
                    <span className="text-2xl font-bold text-brand-orange-600">
                      {program.outcomes.jobPlacement}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-brand-orange-600 h-3 rounded-full"
                      style={{ width: `${program.outcomes.jobPlacement}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-black">
                      Certification Pass Rate
                    </span>
                    <span className="text-2xl font-bold text-brand-blue-600">
                      {program.outcomes.certificationPass}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-white h-3 rounded-full"
                      style={{
                        width: `${program.outcomes.certificationPass}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-black">Student Satisfaction</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {program.outcomes.satisfaction}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-white h-3 rounded-full"
                      style={{ width: `${program.outcomes.satisfaction}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-brand-red-50 rounded-xl border border-brand-red-200">
                <div className="flex items-center gap-3 mb-2">
                  <Award size={20} className="text-brand-orange-600" />
                  <span className="font-bold text-black">
                    Certification Included
                  </span>
                </div>
                <p className="text-sm text-black">
                  {program.certification}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Program Details
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-brand-red-100 flex items-center justify-center mb-4">
                <Clock size={24} className="text-brand-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Schedule
              </h3>
              <p className="text-black mb-4">
                Flexible options to fit your life:
              </p>
              <ul className="space-y-2 text-sm text-black">
                {program.schedule.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-brand-blue-100 flex items-center justify-center mb-4">
                <GraduationCap size={24} className="text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Requirements
              </h3>
              <p className="text-black mb-4">Minimal prerequisites:</p>
              <ul className="space-y-2 text-sm text-black">
                {program.requirements.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Users size={24} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Support Services
              </h3>
              <p className="text-black mb-4">
                We're here to help you succeed:
              </p>
              <ul className="space-y-2 text-sm text-black">
                {program.support.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* CTA WITH IMAGE */}
      <section className="py-16   ">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/images/pages/comp-program-template.jpg"
                alt="Start your training today"
                fill
                className="object-cover"
                quality={100}
              />
            </div>
            <div className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your {program.name} Career?
              </h2>
              <p className="text-xl mb-8 text-brand-orange-50">
                Join our next cohort and begin your journey. 100% funded
                training with no cost to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/apply?program=${program.slug}`}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-orange-600 font-bold rounded-lg hover:bg-brand-orange-50 transition-colors shadow-lg"
                >
                  Apply Now
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-700 text-white font-semibold rounded-lg hover:bg-brand-orange-800 transition-colors shadow-lg"
                >
                  View Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
