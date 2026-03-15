import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen, Award, CheckCircle, Shield, ArrowRight, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'EPA Section 608 Certification Prep | Elevate for Humanity',
  description:
    'Complete 15-week EPA 608 Universal certification preparation. Covers Core, Type I, II, and III with study kits, practice exams, and proctored exam access through EPA-approved certifying organizations.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/epa-608',
  },
};

const weeks = [
  { week: 1, title: 'Ozone Depletion & Environmental Regulations', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 2, title: 'Refrigerant Types, Properties & Safety', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 3, title: 'Pressure-Temperature Relationships & the Refrigeration Cycle', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 4, title: 'Recovery, Recycling & Reclamation', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 5, title: 'Leak Detection, Repair & Evacuation', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 6, title: 'Shipping, Labeling & Recordkeeping', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 7, title: 'Core Review & Practice Exam', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
  { week: 8, title: 'Small Appliance Systems & Recovery', section: 'Type I', color: 'bg-emerald-100 text-emerald-700' },
  { week: 9, title: 'Type I Recovery Procedures & High-Pressure Systems Intro', section: 'Type I / II', color: 'bg-emerald-100 text-emerald-700' },
  { week: 10, title: 'High-Pressure Systems & Equipment', section: 'Type II', color: 'bg-amber-100 text-amber-700' },
  { week: 11, title: 'Type II Leak Rates, Repair, Evacuation & Review', section: 'Type II', color: 'bg-amber-100 text-amber-700' },
  { week: 12, title: 'Low-Pressure Systems & Chillers', section: 'Type III', color: 'bg-purple-100 text-purple-700' },
  { week: 13, title: 'Type III Recovery, Leak Detection & Water Tubes', section: 'Type III', color: 'bg-purple-100 text-purple-700' },
  { week: 14, title: 'Type III Review & Practice Exam', section: 'Type III', color: 'bg-purple-100 text-purple-700' },
  { week: 15, title: 'Universal Review & Proctored Certification Exam', section: 'Exam', color: 'bg-brand-red-100 text-brand-red-700' },
];

export default function EPA608CoursePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Courses', href: '/courses' },
              { label: 'EPA 608 Certification Prep' },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/courses-page-4.jpg"
          alt="HVAC technician working with refrigerant gauges"
          fill
          quality={90}
          className="object-cover"
        />
      </section>

      {/* What's Included */}
      <section className="py-14 bg-white border-b">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            What&apos;s Included
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: '15-Week Structured Curriculum', desc: 'Industry-aligned certification prep curriculum covering all four EPA 608 exam sections with structured weekly progression.' },
              { icon: CheckCircle, title: 'Study Kits Provided Free', desc: 'Every student receives a study kit at no cost — reference materials, practice questions, and exam prep guides.' },
              { icon: Shield, title: 'Full Practice Test Bank', desc: 'Practice exams for Core, Type I, Type II, and Type III sections. Take them as many times as needed.' },
              { icon: Award, title: 'Proctored Exam Access', desc: 'Certification exam administered on-site through EPA-approved certifying organizations (ESCO Institute and Mainstream Engineering).' },
              { icon: Users, title: 'Retesting Available', desc: 'Exam fees and retesting policies vary by certifying organization.' },
              { icon: Clock, title: 'Certification Does Not Expire', desc: 'Once you pass, your EPA 608 certification is valid for life. No renewal required.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-white/50">
                <item.icon className="w-6 h-6 text-brand-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 15-Week Schedule */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 text-center">
            15-Week Course Schedule
          </h2>
          <p className="text-center text-slate-600 mb-4 max-w-2xl mx-auto">
            Structured progression from Core fundamentals through all three specialty types, ending with a proctored Universal certification exam.
          </p>
          <div className="flex justify-center gap-3 mb-10">
            <span className="text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-full">Standard: 15 Weeks</span>
            <span className="text-xs font-bold bg-brand-red-100 text-brand-red-700 px-3 py-1 rounded-full">Accelerated: 6 Weeks (Workforce Cohorts)</span>
          </div>

          <div className="space-y-3">
            {weeks.map((w) => (
              <div
                key={w.week}
                className="flex items-center gap-4 bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
              >
                <span className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {w.week}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{w.title}</h3>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${w.color}`}>
                  {w.section}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Details */}
      <section className="py-14 bg-white border-t">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            About the EPA 608 Exam
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Exam Structure</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> <strong>Core</strong> — 25 questions (must score 70%+)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> <strong>Type I</strong> — 25 questions (must score 70%+)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> <strong>Type II</strong> — 25 questions (must score 70%+)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> <strong>Type III</strong> — 25 questions (must score 70%+)</li>
              </ul>
              <p className="text-sm text-slate-600 mt-3">Pass all four sections to earn your <strong>Universal</strong> certification.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">What You Should Know</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> Exams proctored on-site through ESCO Institute and Mainstream Engineering</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> Available online — no travel to a testing center required</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> Exam fees and retesting policies vary by certifying organization</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> Certification does not expire</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" /> Recognized nationwide by all HVAC employers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            Ready to Get Certified?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Apply in 5 minutes. If you qualify for WIOA funding, the course and exam are fully covered.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/start"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors"
            >
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link
              href="/funding"
              className="border-2 border-white text-white font-bold px-10 py-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              Check Funding Eligibility
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
