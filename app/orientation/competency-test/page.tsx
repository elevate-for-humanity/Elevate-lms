import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ClipboardCheck, Clock, BookOpen, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/orientation/competency-test' },
  title: 'Competency Assessment | Orientation | Elevate For Humanity',
  description: 'Learn about the competency assessment administered during orientation. Covers reading, math, and career readiness. Not a pass/fail test — used for program placement.',
};

const WHAT_TO_KNOW = [
  {
    title: 'Duration',
    desc: 'Approximately 45–60 minutes to complete at your own pace.',
    icon: Clock,
  },
  {
    title: 'Format',
    desc: 'Multiple-choice questions on a computer or tablet. No prior preparation required.',
    icon: ClipboardCheck,
  },
  {
    title: 'Purpose',
    desc: 'Helps us place you in the right program and identify any additional support you may need.',
    icon: BookOpen,
  },
  {
    title: 'No Pass/Fail',
    desc: 'Results are used for placement only — not to determine eligibility. Everyone is welcome.',
    icon: HelpCircle,
  },
];

const SECTIONS_COVERED = [
  'Reading comprehension and vocabulary',
  'Basic math and applied mathematics',
  'Locating and interpreting information',
  'Career readiness and workplace skills',
];

export default function CompetencyTestPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Orientation', href: '/orientation' }, { label: 'Competency Assessment' }]} />
      </div>

      {/* Hero — image only, title below */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src="/images/pages/orientation-page-1.jpg"
            alt="Competency assessment"
            fill className="object-cover" priority sizes="100vw"
          />
        </div>
        <div className="bg-white border-t py-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-black text-black mb-3">Competency Assessment</h1>
          <p className="text-black text-lg max-w-2xl mx-auto">
            A brief skills assessment administered during orientation to help us place you in the right program.
            It is not a pass/fail test — everyone is welcome regardless of results.
          </p>
        </div>
      </section>

      {/* What to Know */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-black mb-8 text-center">What to Know</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {WHAT_TO_KNOW.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">{item.title}</h3>
                  <p className="text-black text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Covered */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-black text-black mb-6">What the Assessment Covers</h2>
              <ul className="space-y-3">
                {SECTIONS_COVERED.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-black">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-black text-sm mt-6 leading-relaxed">
                Results are shared with your enrollment advisor and used only to match you with the right
                program track and identify any tutoring or support services that may help you succeed.
              </p>
            </div>
            <div className="relative h-72 rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/orientation-page-2.jpg"
                alt="Student completing assessment"
                fill className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white text-lg mb-8">
            The competency assessment is administered during your orientation session.
            Schedule your orientation to get started.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/orientation/schedule"
              className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              Schedule Orientation <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/apply/student"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Apply Now
            </Link>
          </div>
          <p className="text-white text-sm mt-6">
            Questions? Call <a href="tel:3173143757" className="text-white font-bold underline hover:text-slate-300">(317) 314-3757</a>
          </p>
        </div>
      </section>
    </div>
  );
}
