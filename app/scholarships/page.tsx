export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { 
  Clock, DollarSign, Award, ArrowRight, 
  GraduationCap, Users, FileText, Calendar, Heart, Star
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Scholarships & Financial Aid | Free Training Funding | Elevate',
  description: 'Explore scholarships, grants, and funding options for career training. WIOA funding, employer sponsorships, and need-based scholarships available.',
  alternates: { canonical: `${SITE_URL}/scholarships` },
  keywords: [
    'career training scholarships Indianapolis',
    'free job training funding Indiana',
    'WIOA funding eligibility',
    'workforce development grants',
    'trade school scholarships',
    'vocational training financial aid',
    'CNA training payment plans',
    'free CDL training scholarships',
    'adult education grants Indiana',
    'second chance scholarships',
    'reentry program funding',
    'low income training assistance',
    'WorkOne funding Indiana',
    'career change scholarships',
  ],
  openGraph: {
    title: 'Scholarships & Financial Aid | Free Training Funding',
    description: 'Explore scholarships, grants, and funding options for career training.',
    url: `${SITE_URL}/scholarships`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/hero-new/hero-7.jpg`, width: 1200, height: 630, alt: 'Scholarships and Financial Aid' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scholarships & Financial Aid | Free Training Funding',
    description: 'Explore scholarships, grants, and funding options for career training.',
    images: [`${SITE_URL}/images/heroes-hq/success-hero.jpg`],
  },
};



const steps = [
  { num: 1, title: 'Apply to Program', desc: 'Complete your program application first' },
  { num: 2, title: 'Check WIOA Eligibility', desc: 'Most students qualify for full funding' },
  { num: 3, title: 'Submit Documents', desc: 'Provide required verification documents' },
  { num: 4, title: 'Get Approved', desc: 'Receive funding confirmation and start training' },
];

export default async function ScholarshipsPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('scholarships').select('*').limit(50);
const fundingOptions = (dbRows as any[]) || [];
const scholarshipTypes = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Scholarships & Financial Aid' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image 
          src="/images/heroes-hq/success-hero.jpg" 
          alt="Scholarships and Financial Aid" 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <GraduationCap className="w-4 h-4" /> Funding Available
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              Scholarships & Financial Aid
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              Don&apos;t let cost stop you. Most students pay $0 for training through WIOA funding, scholarships, and employer sponsorships.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
                Check Eligibility <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/apply" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/40">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-8 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-green-400">85%</div>
              <div className="text-slate-400 text-sm">Students Pay $0</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-blue-400">$5M+</div>
              <div className="text-slate-400 text-sm">Funding Awarded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">1,000+</div>
              <div className="text-slate-400 text-sm">Students Funded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-blue-400">10+</div>
              <div className="text-slate-400 text-sm">Funding Sources</div>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Funding Options</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Multiple ways to fund your training. Our team helps you find the best option.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {fundingOptions.map((option, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center">
                      <option.icon className="w-6 h-6 text-brand-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">{option.title}</h3>
                      <p className="text-brand-green-600 font-semibold">{option.amount} covered</p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">{option.desc}</p>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Eligibility:</p>
                  <ul className="space-y-1">
                    {option.eligibility.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={option.link} className="mt-4 inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700">
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WIOA Section */}
      <section className="py-16 bg-brand-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">WIOA: Your Best Option</h2>
              <p className="text-lg text-slate-600 mb-6">
                The Workforce Innovation and Opportunity Act (WIOA) is federal funding that pays for 
                career training for eligible adults. Most of our students qualify.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-bold text-slate-900">Covers Everything</h3>
                    <p className="text-slate-600">Tuition, books, supplies, uniforms, certification exams</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-bold text-slate-900">Support Services</h3>
                    <p className="text-slate-600">Transportation, childcare, work clothes assistance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-bold text-slate-900">No Repayment</h3>
                    <p className="text-slate-600">This is a grant, not a loan. Nothing to pay back.</p>
                  </div>
                </div>
              </div>
              <Link href="/wioa-eligibility" className="mt-8 inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
                Check WIOA Eligibility <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Who Qualifies for WIOA?</h3>
              <p className="text-slate-600 mb-4">You may qualify if you meet ANY of these:</p>
              <ul className="space-y-3">
                {[
                  'Low income (below 70% of median income)',
                  'Receiving public assistance (SNAP, TANF, SSI)',
                  'Unemployed or underemployed',
                  'Veteran or spouse of veteran',
                  'Person with a disability',
                  'Ex-offender or justice-involved',
                  'Homeless or at risk of homelessness',
                  'Aged out of foster care',
                  'Single parent',
                  'Lack of high school diploma',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="w-6 h-6 bg-brand-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Elevate Scholarships */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Elevate Scholarships</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            For students who don&apos;t qualify for WIOA, we offer need-based scholarships.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scholarshipTypes.map((scholarship, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
                <Award className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">{scholarship.name}</h3>
                <div className="text-2xl font-bold text-brand-green-600 mb-2">{scholarship.amount}</div>
                <div className="text-sm text-slate-500 mb-4">Deadline: {scholarship.deadline}</div>
                <p className="text-sm text-slate-600">{scholarship.criteria}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How to Get Funded</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">Common Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'Do I have to pay anything back?',
                a: 'No. WIOA funding and Elevate scholarships are grants, not loans. There is nothing to repay.',
              },
              {
                q: 'How long does funding approval take?',
                a: 'WIOA approval typically takes 1-2 weeks after submitting all required documents.',
              },
              {
                q: 'What if I don\'t qualify for WIOA?',
                a: 'We have other options including employer sponsorships, payment plans, and need-based scholarships.',
              },
              {
                q: 'Can I use funding for any program?',
                a: 'WIOA funding can be used for programs on the state\'s Eligible Training Provider List (ETPL). Most of our programs qualify.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Don&apos;t Let Cost Stop You
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            85% of our students pay $0 for training. Let us help you find funding.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Check Eligibility <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/apply" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              Apply Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
