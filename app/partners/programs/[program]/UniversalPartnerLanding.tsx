'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { ProgramConfig } from '@/lib/partners/program-config';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu/30min';

export default function UniversalPartnerLanding({ config }: { config: ProgramConfig }) {
  const Cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: config.shortName }]} />
      </div>

      {/* Hero */}
      <section className="relative bg-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image src={config.heroImage} alt={`${config.shortName} training`} fill className="object-cover" priority />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.shortName} Partner Program</h1>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">{config.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/partners/programs/${config.slug}/apply`}
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors"
            >
              Apply as a Partner {Cap(config.siteLabel)} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-slate-900 transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">How the Program Works</h2>
          {config.registeredApprenticeship && (
            <p className="text-center text-orange-600 font-semibold mb-4">USDOL Registered Apprenticeship</p>
          )}
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Your {config.siteLabel} hosts {config.traineeLabelPlural} who complete {config.trainingHours.toLocaleString()} hours of
            on-the-job training under a {config.supervisorTitle.toLowerCase()}.
            {config.theoryProvider && ` ${Cap(config.traineeLabelPlural)} also complete theory coursework through ${config.theoryProvider}.`}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Apply &amp; Get Approved</h3>
              <p className="text-gray-600 text-sm">
                Submit your application{config.siteVisitRequired ? ', complete a Zoom site visit,' : ''} and sign the MOU.
                Approval takes about {config.approvalTimeline}.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Host {Cap(config.traineeLabelPlural)}</h3>
              <p className="text-gray-600 text-sm">
                We match qualified {config.traineeLabelPlural} to your {config.siteLabel}. They complete {config.trainingHours.toLocaleString()} hours
                of training under your {config.supervisorTitle.toLowerCase()}.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Grow Your Team</h3>
              <p className="text-gray-600 text-sm">
                {config.licensingExam
                  ? `${Cap(config.traineeLabelPlural)} sit for the ${config.licensingExam}. You get a trained, credentialed professional.`
                  : `${Cap(config.traineeLabelPlural)} complete the program ready to contribute to your team.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">What Partner {Cap(config.siteLabelPlural)} Need to Know</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {config.requirements.map((req) => (
              <div key={req.title} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">{req.title}</h3>
                <p className="text-gray-600 text-sm">{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Approval Timeline</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Submit Application', time: 'Day 1', desc: 'Complete the online partner application form.' },
              { step: '2', title: 'Verification', time: 'Days 1-3', desc: 'We verify your credentials and licensing.' },
              ...(config.siteVisitRequired ? [{ step: '3', title: 'Video Site Visit', time: 'Days 3-5', desc: `A 15-minute Zoom call to walk through your ${config.siteLabel}.` }] : []),
              { step: config.siteVisitRequired ? '4' : '3', title: 'MOU Signing', time: config.siteVisitRequired ? 'Days 5-6' : 'Days 3-5', desc: 'Review and sign the Memorandum of Understanding.' },
              { step: config.siteVisitRequired ? '5' : '4', title: 'Approved', time: `~${config.approvalTimeline}`, desc: `Your ${config.siteLabel} is approved and listed as a registered worksite.` },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold">{item.step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {config.faq.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  {item.question}
                </summary>
                <div className="px-6 pb-4 text-gray-600 text-sm">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-orange-500 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Partner With Us?</h2>
          <p className="text-lg text-orange-100 mb-8">
            Join the {config.name} program and start developing talent for your {config.siteLabel}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/partners/programs/${config.slug}/apply`}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 rounded-lg font-bold text-lg hover:bg-orange-50 transition-colors"
            >
              Start Your Application <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href="tel:+13173143757"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors"
            >
              <Phone className="w-5 h-5 mr-2" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
