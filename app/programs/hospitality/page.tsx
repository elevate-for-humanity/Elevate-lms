import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { SERVSAFE_PROGRAMS, SERVSAFE_FEATURED } from '@/lib/testing/servsafe-programs';
import { getRetailPrice, getStartingPrice } from '@/lib/testing/servsafe-pricing';

export const metadata: Metadata = {
  title: 'Hospitality & Food Safety Certifications | Elevate for Humanity',
  description:
    'ServSafe Food Handler, ServSafe Manager, Guest Service Gold, START, and ServSuccess certifications. Start with Food Handler at $29 and advance your hospitality career.',
  alternates: { canonical: '/programs/hospitality' },
};

// Enrollment routes per program key
const ENROLL_HREF: Record<string, string> = {
  food_handler:      '/apply?program=servsafe-food-handler',
  servsafe_manager:  '/apply?program=servsafe-manager',
  guest_service_gold:'/apply?program=guest-service-gold',
  start_program:     '/apply?program=start-hospitality',
  servsuccess:       '/apply?program=servsuccess',
};

const SHORT_DESC: Record<string, string> = {
  food_handler:      'Basic food safety training required for all food service workers. Fast, online, and nationally recognized.',
  servsafe_manager:  'Required certification for food service managers. Covers HACCP, food safety law, and manager responsibilities.',
  guest_service_gold:'Customer service excellence certification for hospitality and tourism workers.',
  start_program:     'Entry-level hospitality workforce training — front desk, housekeeping, food & beverage, and more.',
  servsuccess:       'Career advancement for restaurant professionals. Five-course suite plus certification exam.',
};

export default function HospitalityPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
            Hospitality &amp; Food Safety
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Get Certified. Get Hired.
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            ServSafe and AHLEI certifications for food service and hospitality careers.
            Start with Food Handler at $29 and advance from there.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={ENROLL_HREF.food_handler}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-3.5 rounded-full transition-colors"
            >
              Start with Food Handler — $29
            </Link>
            <Link
              href="#all-programs"
              className="border border-slate-600 text-white hover:bg-slate-800 font-semibold px-8 py-3.5 rounded-full transition-colors"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Featured programs — Food Handler + Manager */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Featured Programs</h2>
          <p className="text-slate-500 text-sm mb-8">
            Start with Food Handler. Advance to Manager. Both are nationally recognized.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {SERVSAFE_FEATURED.map((program, i) => {
              const startingPrice = getStartingPrice(program.products);
              const primaryProduct = program.products[0];
              const isEntry = program.key === 'food_handler';
              return (
                <div
                  key={program.key}
                  className={`rounded-2xl border overflow-hidden flex flex-col shadow-sm ${
                    isEntry ? 'border-amber-400' : 'border-slate-200'
                  }`}
                >
                  <div className={`px-6 py-5 ${isEntry ? 'bg-amber-500' : 'bg-slate-800'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-extrabold text-xl ${isEntry ? 'text-slate-900' : 'text-white'}`}>
                        {program.label}
                      </h3>
                      {isEntry && (
                        <span className="bg-slate-900 text-amber-400 text-xs font-bold px-2 py-1 rounded-full">
                          Start Here
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isEntry ? 'text-slate-700' : 'text-slate-300'}`}>
                      {program.category === 'servsafe' ? 'National Restaurant Association' : 'AHLEI'}
                    </p>
                  </div>
                  <div className="px-6 py-5 flex-1 flex flex-col bg-white">
                    <p className="text-slate-600 text-sm mb-4">{SHORT_DESC[program.key]}</p>
                    <p className="text-3xl font-extrabold text-slate-900 mb-1">
                      ${startingPrice}
                    </p>
                    <p className="text-slate-500 text-xs mb-5">{primaryProduct.label}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[
                        'Nationally recognized certification',
                        'Online delivery',
                        'Includes exam prep and learner support',
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={ENROLL_HREF[program.key] ?? '/apply'}
                      className={`flex items-center justify-center gap-2 w-full font-bold px-4 py-3.5 rounded-xl transition-colors text-sm ${
                        isEntry
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                          : 'bg-slate-800 hover:bg-slate-900 text-white'
                      }`}
                    >
                      Enroll Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* All programs */}
      <section id="all-programs" className="py-14 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">All Programs</h2>
          <p className="text-slate-500 text-sm mb-8">
            AHLEI hospitality certifications for workforce development and career advancement.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVSAFE_PROGRAMS.filter(p => !p.featured).map(program => {
              const startingPrice = getStartingPrice(program.products);
              return (
                <div
                  key={program.key}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="bg-slate-700 px-5 py-4">
                    <h3 className="font-bold text-white text-base">{program.label}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">AHLEI</p>
                  </div>
                  <div className="px-5 py-4 flex-1 flex flex-col">
                    <p className="text-slate-600 text-sm mb-3 flex-1">{SHORT_DESC[program.key]}</p>
                    <p className="text-2xl font-extrabold text-slate-900 mb-1">
                      Starting at ${startingPrice}
                    </p>
                    {/* Product breakdown */}
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden mb-4 mt-2">
                      {program.products.map(product => (
                        <div key={product.key} className="flex items-center justify-between px-3 py-2">
                          <span className="text-slate-600 text-xs">{product.label}</span>
                          <span className="font-semibold text-slate-800 text-xs">${getRetailPrice(product)}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={ENROLL_HREF[program.key] ?? '/apply'}
                      className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm"
                    >
                      Enroll Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-amber-500 py-14 px-6 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
          Start Your Hospitality Career Today
        </h2>
        <p className="text-slate-800 mb-8 max-w-xl mx-auto text-sm">
          Food Handler certification is the fastest path in. Most employers require it.
          Get certified online in a few hours.
        </p>
        <Link
          href={ENROLL_HREF.food_handler}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-full transition-colors"
        >
          Get Started — $29 <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </main>
  );
}
