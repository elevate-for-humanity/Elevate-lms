import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Award, Clock, FileText, BarChart3, BookOpen, CheckCircle, Shield, Users } from 'lucide-react';
import { WORKKEYS_STRIPE_PRICES } from '@/lib/testing/providers/workkeys-pricing';

export const metadata: Metadata = {
  title: 'ACT WorkKeys & NCRC Testing | Elevate for Humanity',
  description: 'Take ACT WorkKeys assessments at Elevate Testing Center in Indianapolis. Earn your NCRC credential recognized by 22,000+ employers nationwide.',
};

export default function WorkKeysPage() {
  const individualTests = [
    { key: 'appliedMath', ...WORKKEYS_STRIPE_PRICES.appliedMath, icon: BarChart3 },
    { key: 'graphicLiteracy', ...WORKKEYS_STRIPE_PRICES.graphicLiteracy, icon: BookOpen },
    { key: 'workplaceDocuments', ...WORKKEYS_STRIPE_PRICES.workplaceDocuments, icon: FileText },
  ];
  const bundle = WORKKEYS_STRIPE_PRICES.ncrcBundle;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image 
            src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-services-page-1.webp" 
            alt="WorkKeys testing" 
            fill 
            className="object-cover" 
            sizes="100vw" 
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'ACT WorkKeys / NCRC' }]} />
          
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
                <Award className="w-4 h-4" /> Authorized ACT Testing Center
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                ACT WorkKeys &amp; NCRC Assessments
              </h1>
              <p className="text-xl text-blue-200 mb-6 leading-relaxed">
                Prove your workplace skills with the National Career Readiness Certificate — recognized by 22,000+ employers nationwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://buy.stripe.com/00w5kD3YY6Z0a8j5RfgIo18" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition"
                >
                  <CalendarDays className="w-5 h-5" /> Book All 3 Tests — $165
                </a>
                <Link 
                  href="/testing/book?type=workkeys" 
                  className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-white/50 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Schedule Consultation
                </Link>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <h3 className="font-bold text-lg mb-4">Why Get Certified?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Required by many Indiana employers and workforce programs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Valid for 5 years — permanent credential on your resume</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Meets WIOA/WorkOne career readiness requirements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Proctored at our Indianapolis testing center</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Individual Tests */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Individual WorkKeys Assessments</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Each assessment measures a key workplace skill. Book individually or save with the full bundle.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {individualTests.map(({ key, icon: Icon, name, shortName, price, description, duration, questions, paymentLink }) => (
              <div key={key} className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-brand-blue-300 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-brand-red-100 transition-colors">
                    <Icon className="w-6 h-6 text-brand-blue-600 group-hover:text-brand-red-600 transition-colors" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{shortName}</span>
                    <h3 className="font-bold text-lg text-slate-900">{name}</h3>
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{description}</p>
                
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {questions} questions
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-3xl font-black text-slate-900">${price}</span>
                    <span className="text-sm text-slate-500 ml-1">/test</span>
                  </div>
                  <a 
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-lg transition text-sm"
                  >
                    Pay &amp; Schedule
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundle CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-50 to-orange-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-300 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">Best Value</span>
                    <h3 className="font-black text-xl text-white">Full NCRC Bundle</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-white">${bundle.price}</span>
                  <span className="block text-amber-100 text-sm line-through">$175</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 mb-4">{bundle.description}</p>
              
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-bold text-slate-900">Applied Math</p>
                  <p className="text-xs text-slate-500">33 questions · 55 min</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-bold text-slate-900">Graphic Literacy</p>
                  <p className="text-xs text-slate-500">38 questions · 55 min</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-bold text-slate-900">Workplace Docs</p>
                  <p className="text-xs text-slate-500">35 questions · 55 min</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Save $55 vs individual bookings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">All 3 tests in one session</p>
                    <p className="text-xs text-slate-500">{bundle.duration} total</p>
                  </div>
                  <a 
                    href={bundle.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-3 rounded-lg transition shadow-md"
                  >
                    Pay &amp; Schedule Bundle
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NCRC Levels */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">NCRC Credential Levels</h2>
            <p className="text-slate-600">Your certificate level is determined by your lowest score across all 3 tests.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { level: 'Bronze', score: 'Level 3-4', desc: 'Foundational workplace skills', color: 'from-amber-600 to-amber-700' },
              { level: 'Silver', score: 'Level 5', desc: 'Standard career readiness', color: 'from-gray-400 to-gray-500' },
              { level: 'Gold', score: 'Level 6', desc: 'Advanced workplace skills', color: 'from-yellow-400 to-yellow-500' },
              { level: 'Platinum', score: 'Level 7', desc: 'Exceptional skills', color: 'from-blue-400 to-blue-500' },
            ].map(({ level, score, desc, color }) => (
              <div key={level} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                  <span className="text-white font-black text-lg">{level[0]}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{level}</h3>
                <p className="text-2xl font-black text-slate-700 mb-1">{score}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">What&apos;s Included</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">ACT Official Voucher</h3>
                <p className="text-sm text-slate-600">Your $55 includes the official ACT voucher — no hidden fees at the testing center.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Proctored Session</h3>
                <p className="text-sm text-slate-600">Professional proctoring at our ADA-compliant testing center in Indianapolis.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Results in 3-5 Days</h3>
                <p className="text-sm text-slate-600">Official scores sent directly from ACT. NCRC issued upon passing all 3 tests.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Valid for 5 Years</h3>
                <p className="text-sm text-slate-600">Your NCRC credential stays on your resume for 5 years — no renewal fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-brand-blue-900 to-slate-900 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4">Ready to Get Certified?</h2>
          <p className="text-blue-200 mb-8">Book your WorkKeys assessment today. Payment includes everything — voucher, proctoring, and facilities.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="https://buy.stripe.com/00w5kD3YY6Z0a8j5RfgIo18" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition text-lg"
            >
              <CalendarDays className="w-5 h-5" /> Book Full NCRC Bundle — $165
            </a>
          </div>
          <p className="text-slate-400 text-sm mt-6">
            Questions? Call us at <span className="text-white font-semibold">(317) 936-4288</span>
          </p>
        </div>
      </section>
    </main>
  );
}
