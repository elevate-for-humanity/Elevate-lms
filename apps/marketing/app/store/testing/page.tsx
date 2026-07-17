export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Clock, Award, CheckCircle, Calendar, Users, CreditCard, ArrowRight, ShoppingCart, TrendingUp } from 'lucide-react';
import { SimpleAddToCartButton } from '@/components/store/SimpleAddToCartButton';
import { StudentQuickNav } from '@/components/store/StudentQuickNav';
import { CERTIPORT_EXAMS } from '@/lib/testing/providers/certiport-pricing';
import { WORKKEYS_PRICING } from '@/lib/testing/providers/workkeys-pricing';
import { EPA608_PRICING } from '@/lib/testing/providers/epa608-pricing';
import { CAREERSAFE_PRICING } from '@/lib/testing/providers/careersafe-pricing';
import { NRF_RISEUP_PRICING } from '@/lib/testing/providers/nrf-riseup';

export const metadata: Metadata = {
  title: 'Testing Center | Elevate Store',
  description: 'Schedule certification exams, manage proctors, track scores, and issue credentials. ACT WorkKeys, Certiport, EPA, CPR, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/testing',
  },
};

const exams = [
  { id: 'certiport-mos', name: 'Microsoft Office Specialist (MOS)', desc: 'Word, Excel, PowerPoint, Outlook certification', price: CERTIPORT_EXAMS.mos.price, originalPrice: Math.round(CERTIPORT_EXAMS.mos.price * 1.3), provider: 'Certiport', color: 'red', examCount: CERTIPORT_EXAMS.mos.exams.length },
  { id: 'workkeys-ncrc', name: 'ACT WorkKeys NCRC', desc: 'Applied Math, Graphic Literacy, Workplace Documents', price: WORKKEYS_PRICING.ncrc.price, originalPrice: Math.round(WORKKEYS_PRICING.ncrc.price * 1.3), provider: 'ACT WorkKeys', color: 'emerald', examCount: 3 },
  { id: 'epa608-universal', name: 'EPA 608 Universal', desc: 'Core, Type I, II, III certification', price: EPA608_PRICING.universal.price, originalPrice: Math.round(EPA608_PRICING.universal.price * 1.3), provider: 'EPA/ESCO', color: 'amber', examCount: 4 },
  { id: 'careersafe-osha10', name: 'OSHA 10-Hour Safety', desc: 'General Industry safety certification', price: CAREERSAFE_PRICING.osha10.price, originalPrice: Math.round(CAREERSAFE_PRICING.osha10.price * 1.3), provider: 'CareerSafe', color: 'orange', examCount: 1 },
  { id: 'nrf-riseup', name: 'NRF Rise Up Retail', desc: 'Customer Service & Sales certification', price: NRF_RISEUP_PRICING.customerServiceSales.price, originalPrice: Math.round(NRF_RISEUP_PRICING.customerServiceSales.price * 1.3), provider: 'NRF Foundation', color: 'purple', examCount: 3 },
  { id: 'cna-exam', name: 'CNA State Exam Prep', desc: 'Practice tests + skills prep', price: 139, originalPrice: 179, provider: 'CNA Prep', color: 'blue', examCount: 2 },
];

const features = [
  { icon: Calendar, title: 'Online Scheduling', desc: 'Students book exams 24/7' },
  { icon: Users, title: 'Proctor Management', desc: 'Remote and in-person proctors' },
  { icon: Award, title: 'Credential Issuance', desc: 'Digital certificates auto-issued' },
  { icon: Shield, title: 'Secure Testing', desc: 'Remote proctoring with AI monitoring' },
  { icon: CreditCard, title: 'Integrated Payments', desc: 'Stripe checkout included' },
  { icon: CheckCircle, title: 'Score Tracking', desc: 'Real-time results dashboard' },
];

const practiceTests = [
  { name: 'MOS Word Practice Test', price: 29, savings: 20 },
  { name: 'MOS Excel Practice Test', price: 29, savings: 20 },
  { name: 'WorkKeys Math Practice', price: 19, savings: 15 },
  { name: 'EPA 608 Practice Exam', price: 39, savings: 25 },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case 'red': return 'from-red-500 to-orange-500';
    case 'emerald': return 'from-emerald-500 to-teal-500';
    case 'amber': return 'from-amber-500 to-orange-500';
    case 'orange': return 'from-orange-500 to-red-500';
    case 'purple': return 'from-purple-500 to-pink-500';
    case 'blue': return 'from-blue-500 to-cyan-500';
    default: return 'from-slate-500 to-slate-600';
  }
};

export default function TestingCenterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Testing Center" }]} />
      </div>

      {/* Hero - Bright with Image */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden bg-slate-100">
        {/* Full-Width Real Image */}
        <div className="absolute inset-0">
          <Image 
            src="/images/pages/testing-page-1.webp" 
            alt="Testing Center" 
            fill 
            className="object-cover object-top"
            priority
          />
        </div>

        {/* White Content Box at Bottom */}
        <div className="relative z-10 w-full bg-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="grid lg:grid-cols-2 gap-8 items-end">
              {/* Left - Content */}
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-4">
                  <Shield className="w-4 h-4" />
                  Testing Center
                </span>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
                  Certification Testing <span className="text-brand-red-600">Made Simple</span>
                </h1>
                
                <p className="text-lg text-slate-600 mb-6 max-w-xl">
                  Schedule exams, manage proctors, track scores, and issue credentials. 
                  Everything you need for a professional testing center.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/admin/testing" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-red-700 transition-colors text-center">
                    Open Testing Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="#exams" className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors text-center">
                    View Exam Options
                  </Link>
                </div>
              </div>

              {/* Right - Stats Card */}
              <div className="bg-slate-50 rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-bold text-slate-900">Live Testing Dashboard</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-700">Today Exams</span>
                    </div>
                    <span className="font-bold text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-700">Scheduled</span>
                    </div>
                    <span className="font-bold text-slate-900">47</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-slate-700">Passed Today</span>
                    </div>
                    <span className="font-bold text-emerald-600">9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Quick Nav */}
      <StudentQuickNav />

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600">Complete testing center management in one platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <Icon className="w-8 h-8 text-brand-red-600 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exams with Pricing */}
      <section id="exams" className="py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Certification Exams</h2>
            <p className="text-lg text-slate-600">Dynamic pricing with BNPL options available</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
                {/* Header with color gradient */}
                <div className={`w-full h-28 rounded-lg mb-4 bg-gradient-to-br ${getColorClasses(exam.color)} flex items-center justify-center`}>
                  <Shield className="w-12 h-12 text-white/80" />
                </div>
                
                {/* Provider badge */}
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded mb-2">
                  {exam.provider}
                </span>

                <h3 className="font-bold text-lg text-slate-900 mb-1">{exam.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{exam.desc}</p>

                {/* Pricing breakdown */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-500">Exam Fee:</span>
                    <span className="text-sm text-slate-900 font-medium">${exam.originalPrice}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-500">BNPL from:</span>
                    <span className="text-sm text-brand-blue-600 font-semibold">${Math.round(exam.price / 3)}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-600">You Save:</span>
                    <span className="text-sm font-bold text-emerald-600">${exam.originalPrice - exam.price}</span>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-900">${exam.price}</span>
                    <span className="text-sm text-slate-400 line-through ml-1">${exam.originalPrice}</span>
                  </div>
                  <SimpleAddToCartButton
                    productId={exam.id}
                    productName={exam.name}
                    price={exam.price}
                    className="px-4 py-2 bg-brand-red-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
                  />
                </div>

                {/* Exam count */}
                <p className="text-xs text-slate-400 mt-3">{exam.examCount} exam{exam.examCount > 1 ? 's' : ''} included</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Tests Upsell */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Practice Tests</h2>
              <p className="text-slate-400">Boost your pass rate with our exam prep bundles</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {practiceTests.map(test => (
              <div key={test.name} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <h4 className="font-semibold text-white text-sm mb-2">{test.name}</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-white">${test.price}</span>
                    <span className="text-xs text-emerald-400 ml-1">Save ${test.savings}</span>
                  </div>
                  <SimpleAddToCartButton
                    productId={`practice-${test.name.toLowerCase().replace(/\s+/g, '-')}`}
                    productName={test.name}
                    price={test.price}
                    className="px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/store/practice-tests" className="inline-flex items-center gap-2 text-white font-semibold hover:text-yellow-400 transition-colors">
              View All Practice Tests
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to set up your testing center?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Start your 14-day trial and get full access to the testing center.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/trial" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact?subject=Testing+Center" className="inline-flex items-center justify-center gap-2 border border-slate-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
