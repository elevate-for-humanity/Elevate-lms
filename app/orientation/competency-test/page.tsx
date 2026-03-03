import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ClipboardCheck, Clock, BookOpen, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/orientation/competency-test' },
  title: 'Competency Assessment | Orientation | Elevate For Humanity',
  description: 'Information about the competency assessment taken during orientation. Covers reading, math, and career readiness skills.',
};

const SECTIONS_COVERED = [
  'Reading comprehension and vocabulary',
  'Basic math and applied mathematics',
  'Locating and interpreting information',
  'Career readiness and workplace skills',
];

const WHAT_TO_KNOW = [
  { title: 'Duration', desc: 'The assessment takes approximately 45-60 minutes to complete.', icon: Clock },
  { title: 'Format', desc: 'Multiple choice questions administered on a computer. No prior preparation required.', icon: ClipboardCheck },
  { title: 'Purpose', desc: 'Helps us place you in the right program and identify any additional support you may need.', icon: BookOpen },
  { title: 'No Pass/Fail', desc: 'This is not a pass/fail test. Results are used for placement, not eligibility.', icon: HelpCircle },
];

export default function CompetencyTestPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Orientation', href: '/orientation' }, { label: 'Competency Assessment' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image src="/images/gallery/image8.jpg" alt="Competency assessment" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Competency Assessment</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">A brief skills assessment to help us place you in the right training program.</p>
          </div>
        </div>
      </section>

      {/* What to Know */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-6">
            {WHAT_TO_KNOW.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <Icon className="w-7 h-7 text-brand-blue-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Covered */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What the Assessment Covers</h2>
          <ul className="space-y-4">
            {SECTIONS_COVERED.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">The competency assessment is administered during your orientation session.</p>
          <Link href="/orientation/schedule" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">View Orientation Schedule</Link>
        </div>
      </section>
    </div>
  );
}
