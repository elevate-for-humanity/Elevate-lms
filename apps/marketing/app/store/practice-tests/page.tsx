import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, CheckCircle, ArrowRight, TrendingUp, Award, Target } from 'lucide-react';
import { SimpleAddToCartButton } from '@/components/store/SimpleAddToCartButton';

export const metadata: Metadata = {
  title: 'Practice Tests',
  description: 'Boost your certification exam pass rate with our comprehensive practice tests and exam prep materials.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/practice-tests',
  },
};

const practiceTests = [
  { id: 'mos-word-practice', name: 'MOS Word Practice Test', exams: 'Microsoft Office Specialist Word', price: 29, originalPrice: 49, questions: 50, time: '45 min', passRate: '+23%' },
  { id: 'mos-excel-practice', name: 'MOS Excel Practice Test', exams: 'Microsoft Office Specialist Excel', price: 29, originalPrice: 49, questions: 50, time: '60 min', passRate: '+27%' },
  { id: 'mos-powerpoint-practice', name: 'MOS PowerPoint Practice Test', exams: 'Microsoft Office Specialist PowerPoint', price: 29, originalPrice: 49, questions: 40, time: '35 min', passRate: '+21%' },
  { id: 'workkeys-math-practice', name: 'WorkKeys Applied Math Practice', exams: 'ACT WorkKeys Applied Math', price: 19, originalPrice: 35, questions: 45, time: '40 min', passRate: '+18%' },
  { id: 'workkeys-reading-practice', name: 'WorkKeys Graphic Literacy Practice', exams: 'ACT WorkKeys Graphic Literacy', price: 19, originalPrice: 35, questions: 35, time: '35 min', passRate: '+19%' },
  { id: 'epa608-practice', name: 'EPA 608 Practice Exam', exams: 'EPA Section 608 Universal', price: 39, originalPrice: 65, questions: 100, time: '90 min', passRate: '+31%' },
  { id: 'osha10-practice', name: 'OSHA 10-Hour Practice Test', exams: 'CareerSafe OSHA 10', price: 24, originalPrice: 45, questions: 75, time: '60 min', passRate: '+25%' },
  { id: 'cna-practice', name: 'CNA Certification Practice Test', exams: 'CNA State Exam', price: 34, originalPrice: 59, questions: 100, time: '120 min', passRate: '+28%' },
];

const bundles = [
  {
    id: 'mos-complete-bundle',
    name: 'MOS Complete Bundle',
    desc: 'All 5 MOS practice tests + study guide',
    tests: ['Word', 'Excel', 'PowerPoint', 'Outlook', 'Access'],
    price: 99,
    originalPrice: 245,
    savings: 146,
  },
  {
    id: 'workkeys-complete-bundle',
    name: 'WorkKeys NCRC Bundle',
    desc: 'All 3 WorkKeys practice tests',
    tests: ['Applied Math', 'Graphic Literacy', 'Workplace Documents'],
    price: 49,
    originalPrice: 105,
    savings: 56,
  },
  {
    id: 'safety-bundle',
    name: 'Safety Certification Bundle',
    desc: 'OSHA 10 + EPA 608 + First Aid practice tests',
    tests: ['OSHA 10', 'EPA 608', 'First Aid/CPR'],
    price: 79,
    originalPrice: 159,
    savings: 80,
  },
];

const benefits = [
  { icon: Target, title: 'Real Exam Format', desc: 'Questions mirror the actual certification exam structure and difficulty' },
  { icon: TrendingUp, title: 'Score Tracking', desc: 'Track your progress and identify weak areas before test day' },
  { icon: Clock, title: 'Timed Practice', desc: 'Simulate real exam conditions with time-limited practice sessions' },
  { icon: CheckCircle, title: 'Detailed Explanations', desc: 'Every answer includes a thorough explanation of why it\'s correct' },
];

export default function PracticeTestsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Practice Tests" }]} />
      </div>

      {/* Hero - Bright & Clean */}
      <section className="relative h-[38vh] min-h-[320px] max-h-[520px] flex items-end overflow-hidden bg-slate-100">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src="/images/instructors/lisa-martinez.webp" 
            alt="Practice Tests" 
            fill 
            className="object-cover object-top"
            priority
          />
        </div>

        {/* White Content Box */}
        <div className="relative z-10 w-full bg-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
                <BookOpen className="w-4 h-4" />
                Practice Tests & Exam Prep
              </span>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
                Pass Your Exam{' '}
                <span className="text-brand-red-600">
                  The First Time
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                Comprehensive practice tests with real exam questions, detailed explanations,
                and performance tracking to boost your pass rate.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-slate-600">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-red-600" />
                  <span>94% Pass Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-red-600" />
                  <span>50+ Practice Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-red-600" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Practice Tests Work</h2>
            <p className="text-lg text-slate-600">Research shows that practice testing is one of the most effective study methods</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map(b => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                  <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-slate-600 text-sm">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Individual Practice Tests */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-red-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Individual Practice Tests</h2>
              <p className="text-slate-600">One exam at a time, instant access</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {practiceTests.map(test => (
              <div key={test.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg hover:border-brand-red-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">{test.exams}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    +{test.passRate} Pass Rate
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 mb-2">{test.name}</h3>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span>{test.questions} questions</span>
                  <span>•</span>
                  <span>{test.time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-slate-900">${test.price}</span>
                    <span className="text-sm text-slate-400 line-through ml-1">${test.originalPrice}</span>
                  </div>
                  <SimpleAddToCartButton
                    productId={test.id}
                    productName={test.name}
                    price={test.price}
                    className="px-3 py-1.5 bg-brand-red-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundle Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Exam Prep Bundles</h2>
              <p className="text-slate-400">Save up to 60% with our bundled packages</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {bundles.map(bundle => (
              <div key={bundle.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full mb-2">
                    SAVE ${bundle.savings}
                  </span>
                  <h3 className="font-bold text-white text-lg">{bundle.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{bundle.desc}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {bundle.tests.map(test => (
                    <span key={test} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                      {test}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">${bundle.price}</span>
                    <span className="text-sm text-slate-400 line-through ml-1">${bundle.originalPrice}</span>
                  </div>
                  <SimpleAddToCartButton
                    productId={bundle.id}
                    productName={bundle.name}
                    price={bundle.price}
                    className="px-4 py-2 bg-yellow-400 text-slate-900 text-sm font-bold rounded-lg hover:bg-yellow-300 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to boost your confidence?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Start practicing today and walk into your exam with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/testing" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all">
              View All Exams
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/store" className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-200 transition-all">
              Browse Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
