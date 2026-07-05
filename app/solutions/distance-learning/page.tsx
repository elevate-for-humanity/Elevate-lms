export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Monitor, Globe, Clock, CheckCircle, Wifi, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Distance Learning Solutions',
  description:
    'Fully online career training with industry credentials. Self-paced and cohort-based programs for remote learners, career changers, and working adults.',
};

const FEATURES = [
  {
    icon: Monitor,
    title: 'Fully online delivery',
    desc: 'Every program is available 100% online. No commute, no fixed classroom schedule. Learners access content from any device.',
  },
  {
    icon: Clock,
    title: 'Self-paced and cohort options',
    desc: 'Choose self-paced for maximum flexibility or join a cohort for structured accountability and peer learning.',
  },
  {
    icon: Wifi,
    title: 'Low-bandwidth optimized',
    desc: 'Content is optimized for learners with limited internet access. Video lessons are compressed without quality loss.',
  },
  {
    icon: Users,
    title: 'Live virtual office hours',
    desc: 'Instructors hold weekly live sessions for Q&A, lab walkthroughs, and career coaching. Recordings available after.',
  },
  {
    icon: Globe,
    title: 'Serve learners anywhere in Indiana',
    desc: 'Rural, suburban, or urban — Elevate reaches learners who cannot access traditional classroom training.',
  },
  {
    icon: Award,
    title: 'Same credentials, same employers',
    desc: 'Online completers earn the same industry credentials and access the same employer network as in-person graduates.',
  },
];

const PROGRAMS = [
  {
    name: 'HVAC Technician',
    credential: 'EPA 608',
    format: 'Self-paced',
    href: '/programs/hvac-technician',
  },
  {
    name: 'IT Help Desk',
    credential: 'CompTIA A+',
    format: 'Cohort / Self-paced',
    href: '/programs/it-help-desk',
  },
  {
    name: 'Medical Assistant',
    credential: 'NHA CCMA',
    format: 'Cohort',
    href: '/programs/medical-assistant',
  },
  {
    name: 'Bookkeeping & QuickBooks',
    credential: 'QuickBooks Certified',
    format: 'Self-paced',
    href: '/programs/bookkeeping',
  },
  {
    name: 'Cybersecurity Fundamentals',
    credential: 'CompTIA Security+',
    format: 'Cohort',
    href: '/programs/cybersecurity-analyst',
  },
  {
    name: 'Medical Billing & Coding',
    credential: 'AAPC CPC',
    format: 'Self-paced',
    href: '/programs/medical-billing',
  },
];

export default function DistanceLearningPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 to-teal-700 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-800 rounded-full px-4 py-2 text-teal-200 text-sm font-medium mb-6">
            <Monitor className="w-4 h-4" />
            Distance Learning
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">
            Career credentials,
            <br />
            delivered anywhere.
          </h1>
          <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
            Elevate's fully online programs reach working adults, rural learners, and career
            changers who can't access traditional classroom training — without sacrificing
            credential quality or employer connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="bg-white text-teal-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-50 transition-colors"
            >
              Browse Programs
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-800 transition-colors"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-teal-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '100%', label: 'Online Delivery' },
            { value: '6+', label: 'Programs Available' },
            { value: '24/7', label: 'Content Access' },
            { value: '$0', label: 'Tuition (WIOA)' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-black text-teal-700">{value}</p>
              <p className="text-slate-600 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Built for distance learners</h2>
          <p className="text-slate-600 mb-10">
            Every design decision in our platform prioritizes accessibility, flexibility, and
            completion rates for remote students.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">{title}</p>
                  <p className="text-slate-600 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Online programs</h2>
          <p className="text-slate-600 mb-10">
            All programs are available fully online. Some offer both self-paced and cohort formats.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PROGRAMS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group border border-slate-200 bg-white rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all"
              >
                <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {p.name}
                </p>
                <p className="text-sm text-slate-500 mt-1">{p.credential}</p>
                <span className="inline-block mt-3 text-xs font-medium bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
                  {p.format}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Who distance learning serves</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Working adults',
                desc: 'Study around your job. Access lessons at 6am or midnight — the platform is always on.',
              },
              {
                title: 'Rural learners',
                desc: 'No training center nearby? Elevate reaches every zip code in Indiana with the same quality curriculum.',
              },
              {
                title: 'Career changers',
                desc: 'Pivot to a new field in months, not years. Short-term credentials get you job-ready fast.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-teal-50 rounded-xl p-6">
                <p className="font-bold text-teal-900 mb-2">{title}</p>
                <p className="text-teal-800 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-900 text-white py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Globe className="w-12 h-12 text-teal-300 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4">Start learning from wherever you are.</h2>
          <p className="text-teal-200 mb-8">
            WIOA funding covers tuition for eligible learners. An advisor will help you determine
            eligibility and choose the right program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="bg-white text-teal-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-teal-50 transition-colors"
            >
              Browse Programs →
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-800 transition-colors"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
