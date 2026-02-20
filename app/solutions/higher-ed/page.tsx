import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, BookOpen, BarChart3, Shield, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/solutions/higher-ed' },
  title: 'Higher Education Solutions | Elevate For Humanity',
  description: 'LMS and workforce training solutions for colleges, universities, and continuing education programs.',
};

const FEATURES = [
  { title: 'LMS Integration', desc: 'Deploy our learning management system alongside your existing curriculum. Supports SCORM, xAPI, and custom content.', icon: BookOpen },
  { title: 'Student Tracking', desc: 'Monitor enrollment, attendance, completion rates, and credential attainment across all programs.', icon: BarChart3 },
  { title: 'Credential Management', desc: 'Issue, verify, and track industry certifications and micro-credentials for your students.', icon: Award },
  { title: 'FERPA Compliant', desc: 'Built with FERPA, WIOA, and ADA compliance from the ground up. SOC 2 security controls.', icon: Shield },
  { title: 'Workforce Partnerships', desc: 'Connect your graduates directly with employer partners through our integrated job placement pipeline.', icon: Users },
  { title: 'Continuing Education', desc: 'Manage non-credit workforce programs, CEU tracking, and professional development courses.', icon: GraduationCap },
];

export default function HigherEdPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Solutions', href: '/solutions' }, { label: 'Higher Education' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/programs-hq/training-classroom.jpg" alt="Higher education training solutions" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Higher Education Solutions</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Workforce training infrastructure for colleges, universities, and continuing education programs.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Platform Capabilities</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Purpose-built for institutions that deliver workforce development, career training, and continuing education.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Built for Your Institution</h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Community Colleges</strong> — Manage non-credit workforce programs alongside credit offerings.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                  <span><strong>Universities</strong> — Add career services, employer pipelines, and credential tracking to your student experience.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Trade Schools</strong> — Track apprenticeship hours, competency assessments, and industry certifications.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                  <span><strong>Continuing Education</strong> — Deliver CEU programs with automated tracking and certificate generation.</span>
                </li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/gallery/image6.jpg"
                alt="Students in higher education program"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Modernize Your Workforce Programs?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            Schedule a demo to see how Elevate integrates with your institution.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
            >
              Request a Demo
            </Link>
            <Link
              href="/store/licenses"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
            >
              View Licensing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
