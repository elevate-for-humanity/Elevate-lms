import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DollarSign, Users, Building2, ArrowRight, Shield, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grants & Scholarships | Get Your Training Paid For | Elevate For Humanity',
  description: 'Indiana residents can get Funded career training through federal and state grants. No loans, no debt. See if you qualify for WIOA, Workforce Ready Grant, or other funding.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/grants' },
};

export default function GrantsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Grants & Scholarships' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes/hero-federal-funding.jpg"
          alt="Students celebrating graduation"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block bg-brand-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            No Loans — No Repayment
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Get Your Training Paid For
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mb-8">
            You shouldn&apos;t have to go into debt to start a new career. Federal and state grants cover your entire training — tuition, books, supplies, and even certification exams.
          </p>
          <Link
            href="/wioa-eligibility"
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            See If You Qualify <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* What This Means For You */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            What This Means For You
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: DollarSign, title: '$0 Out of Pocket', desc: 'Grants cover everything. You pay nothing upfront or later.' },
              { icon: GraduationCap, title: 'Real Certifications', desc: 'Earn industry credentials that employers actually want.' },
              { icon: Users, title: 'Support Services', desc: 'Many grants include help with transportation and childcare.' },
              { icon: Shield, title: 'No Risk', desc: 'Unlike loans, grants never need to be paid back. Ever.' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <item.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grant Programs Explained */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Grants Available to Indiana Residents
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-3xl mx-auto">
            There are several programs that can pay for your training. Here&apos;s what each one offers and who qualifies.
          </p>

          <div className="space-y-8">
            {/* WIOA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-brand-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">WIOA (Workforce Innovation and Opportunity Act)</h3>
                  <p className="text-slate-600 mb-4">
                    This is the main federal program that pays for career training. It&apos;s designed for adults who need new skills to get a good job. WIOA covers your tuition, books, supplies, certification exams, and can even help with transportation and childcare.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">You likely qualify if you:</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {[
                        'Are 18 or older',
                        'Can legally work in the US',
                        'Have low-to-moderate income',
                        'Receive SNAP, TANF, or SSI',
                        'Are a veteran or military spouse',
                        'Were recently laid off',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                          <span className="text-slate-400 flex-shrink-0">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/wioa-eligibility" className="text-brand-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                    Check WIOA Eligibility <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Workforce Ready Grant */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-16 h-16 bg-brand-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-brand-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Workforce Ready Grant (Indiana)</h3>
                  <p className="text-slate-600 mb-4">
                    This is Indiana&apos;s state grant for high-demand careers. It&apos;s specifically for programs that lead to jobs employers are hiring for right now — like healthcare, IT, and skilled trades.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Requirements:</h4>
                    <ul className="space-y-2">
                      {[
                        'Be an Indiana resident',
                        'Have a high school diploma or GED',
                        'Enroll in an eligible high-demand program',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                          <span className="text-slate-400 flex-shrink-0">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* SNAP E&T */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-16 h-16 bg-brand-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-brand-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">SNAP Employment & Training</h3>
                  <p className="text-slate-600 mb-4">
                    If you receive SNAP benefits (food stamps), you can get free job training plus extra support like transportation money and help finding childcare. This program is designed to help you become self-sufficient.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">You qualify if you:</h4>
                    <ul className="space-y-2">
                      {[
                        'Currently receive SNAP benefits',
                        'Are able and willing to work',
                        'Want to gain skills for a better job',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                          <span className="text-slate-400 flex-shrink-0">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/snap-et-partner" className="text-brand-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                    Learn About SNAP E&T <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* JRI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-8 h-8 text-brand-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">JRI (Justice Reinvestment Initiative)</h3>
                  <p className="text-slate-600 mb-4">
                    Everyone deserves a second chance. JRI funding helps justice-involved individuals get career training and support services to build a stable future. We believe in your potential.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">This program is for you if:</h4>
                    <ul className="space-y-2">
                      {[
                        'You have justice system involvement',
                        'You\'re committed to building a new career',
                        'You\'re ready to take the next step',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                          <span className="text-slate-400 flex-shrink-0">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/jri" className="text-brand-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                    Learn About JRI Programs <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            How to Get Started
          </h2>
          <p className="text-xl text-brand-blue-100 text-center mb-12">
            We make the process simple. Here&apos;s what happens:
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Check Eligibility', desc: 'Take our quick quiz to see which grants you qualify for.' },
              { num: '2', title: 'Meet With Us', desc: 'We\'ll help you understand your options and choose a program.' },
              { num: '3', title: 'Apply for Funding', desc: 'We guide you through the paperwork — it\'s easier than you think.' },
              { num: '4', title: 'Start Training', desc: 'Begin your program with everything paid for.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-white text-brand-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-brand-blue-100 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Check Your Eligibility Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Have Questions?</h3>
          <p className="text-slate-600 mb-4">
            We&apos;re here to help you figure out your funding options.
          </p>
          <p className="text-slate-700">
            Contact us at{' '}
            <a href="/support" className="font-semibold text-brand-blue-600 hover:underline">
              Get Help Online
            </a>{' '}
            or email{' '}
            <a href="mailto:info@elevateforhumanity.org" className="font-semibold text-brand-blue-600 hover:underline">
              info@elevateforhumanity.org
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
