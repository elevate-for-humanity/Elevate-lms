'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, BookOpen, FileText, PenLine, Lock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { InstitutionalLegalNotice } from '@/components/marketing/InstitutionalLegalNotice';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu';

interface PartnerPageClientProps {
  isApproved?: boolean;
}

export default function PartnerPageClient({ isApproved = false }: PartnerPageClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Barber Host Shop' }]} />
      </div>

      {/* Hero image — no overlay, no text on image per design standard */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(280px, 45vw, 560px)' }}
      >
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/barber-client-consult.webp"
          alt="Licensed barber consulting with a client during a haircut"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw" placeholder="empty"
        />
      </div>

      {/* Hero content — below image, never overlaid */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <span className="inline-block bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            DOL Registered Apprenticeship
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
            Indiana Barber Host Shop
          </h1>
          <p className="text-slate-600 text-lg max-w-xl">
            Host an apprentice. Grow your shop. Build the next generation of licensed barbers.
          </p>
        </div>
      </div>

      <section className="bg-white py-10">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
          {[
            {
              src: '/images/pages/barber-station-mirror.webp',
              alt: 'Clean barbershop stations prepared for apprentice training',
              label: 'Licensed shop environment',
            },
            {
              src: '/images/pages/barber-apprentice-learning.webp',
              alt: 'Barber apprentice learning clipper control from an instructor',
              label: 'Hands-on apprentice coaching',
            },
            {
              src: '/images/pages/barber-tools-closeup.webp',
              alt: 'Professional barber tools arranged for client service',
              label: 'Tools, sanitation, and service skills',
            },
          ].map((photo) => (
            <figure key={photo.src} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative aspect-[4/3]">
                <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" placeholder="empty" />
              </div>
              <figcaption className="px-4 py-3 text-sm font-semibold text-slate-800">{photo.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA Section below hero */}
      <section className="py-16 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4">Barbershop Partner Program</h2>
          <p className="text-xl font-medium text-black mb-8 max-w-2xl mx-auto">
            Host apprentices in your shop. Develop talent. Grow your team through Indiana&apos;s
            USDOL Registered Barber Apprenticeship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/barber-host-shop/apply"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-red-600 text-white rounded-xl font-extrabold text-lg hover:bg-brand-red-700 transition-colors"
            >
              Apply as a Partner Shop <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-brand-blue-600 text-brand-blue-600 rounded-xl font-extrabold text-lg hover:bg-brand-blue-50 transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">How the Program Works</h2>
          <p className="text-lg font-medium text-black text-center mb-12 max-w-2xl mx-auto">
            The Indiana Barber Apprenticeship is a USDOL Registered Apprenticeship. Your shop hosts
            apprentices who train under your licensed barbers while earning a wage.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Apply &amp; Get Approved</h3>
              <p className="text-sm font-medium text-black">Submit your application, complete a Zoom site visit, and sign the MOU. Approval takes about 1 week.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Host an Apprentice</h3>
              <p className="text-sm font-medium text-black">We match qualified apprentices to your shop. They complete 2,000 hours of on-the-job training under your supervision.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Grow Your Team</h3>
              <p className="text-sm font-medium text-black">Apprentices complete theory through Elevate LMS, then sit for the Indiana State Board exam. You get a trained, licensed barber.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Need to Know */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">What Partner Shops Need to Know</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Workers' Compensation", desc: "Partner shops must carry workers' comp insurance for apprentices. If you don't have it yet, we can help you understand your options." },
              { title: 'Pay Structure', desc: 'Apprentices must be paid at least minimum wage ($7.25/hr). You choose the model — hourly, commission, or hybrid.' },
              { title: 'Supervising Barber', desc: 'Designate a licensed barber in your shop to supervise apprentices and verify hours and competencies.' },
              { title: 'State Board & Licensing', desc: 'Your shop must hold a valid Indiana shop license and be in good standing with the IPLA.' },
              { title: 'Tools & Kit', desc: 'Apprentices are responsible for their own barber kit. Elevate provides a recommended list and can help connect them with funding.' },
              { title: 'ITIN Accepted', desc: 'Apprentices may use an ITIN (Individual Taxpayer Identification Number) in place of an SSN for enrollment.' },
              { title: 'Video Site Visit', desc: 'Before final approval, we conduct a short Zoom site visit (~15 minutes) to see your shop and confirm it meets requirements.' },
              { title: 'DOL Listing', desc: 'Approved shops are listed on the U.S. Department of Labor RAPIDS system as registered apprenticeship worksites.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm font-medium text-black">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Approval Timeline</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Submit Application', time: 'Day 1', desc: 'Complete the online partner application form.' },
              { step: '2', title: 'Verification', time: 'Days 1-3', desc: 'We verify your shop license and supervisor credentials with IPLA.' },
              { step: '3', title: 'Video Site Visit', time: 'Days 3-5', desc: 'A 15-minute Zoom call to walk through your shop.' },
              { step: '4', title: 'MOU Signing', time: 'Days 5-6', desc: 'Review and sign the Memorandum of Understanding.' },
              { step: '5', title: 'Approved', time: '~1 Week', desc: 'Your shop is approved and listed as a registered worksite.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold">{item.step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <span className="text-xs bg-white text-black px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                  <p className="text-sm font-medium text-black">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'How much does it cost to become a partner shop?', a: 'There is no fee to become a partner shop. You pay the apprentice a wage, and Elevate handles program administration, theory training, and DOL compliance.' },
              { q: 'Do I need workers\' comp insurance?', a: 'Yes. Workers\' compensation insurance is required for all apprentices. If you don\'t currently carry it, we can help you understand your options and connect you with providers.' },
              { q: 'How are apprentices paid?', a: 'Apprentices must be paid at least minimum wage ($7.25/hr). You choose the compensation model — hourly, commission, or a hybrid. Many shops start with hourly and transition to commission as the apprentice develops skills.' },
              { q: 'What does the supervising barber need to do?', a: 'The supervisor verifies apprentice hours and competencies, provides hands-on training guidance, and signs off on progress reports. They must hold a valid Indiana barber license.' },
              { q: 'What is the video site visit?', a: 'A 15-minute Zoom call where we walk through your shop to confirm it meets program requirements. We look at workstations, sanitation setup, and general shop conditions.' },
              { q: 'How long does the apprenticeship last?', a: 'Apprentices complete 2,000 hours of on-the-job training. At full-time (40 hrs/week), that\'s about 1 year. Part-time schedules take longer.' },
              { q: 'Can apprentices use an ITIN instead of SSN?', a: 'Yes. We accept ITIN (Individual Taxpayer Identification Number) for enrollment in place of a Social Security Number.' },
              { q: 'What happens after the apprentice finishes?', a: 'They are eligible to sit for the Indiana State Board barber license exam. Many shops hire their apprentices as licensed barbers after completion.' },
              { q: 'Will my shop be listed publicly?', a: 'Yes. Approved partner shops are listed on the U.S. Department of Labor RAPIDS system as registered apprenticeship worksites.' },
              { q: 'What do I need to provide for my application?', a: 'Your shop license number, supervising barber\'s license info, your shop logo, and photos of the inside and outside of your shop.' },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden group">
                <summary className="px-6 py-4 cursor-pointer font-bold text-black hover:bg-white transition-colors">
                  {item.q}
                </summary>
                <div className="px-6 pb-4 text-sm font-medium text-black">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* Apply CTA */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Partner With Us?</h2>
          <p className="text-lg font-medium text-white mb-8">
            Join the Indiana Barber Apprenticeship program and start developing talent for your shop.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/barber-host-shop/apply"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-red-600 text-white rounded-xl font-extrabold text-lg hover:bg-brand-red-700 transition-colors"
            >
              Start Your Application <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-slate-900 rounded-xl font-extrabold text-lg hover:bg-white/10 transition-colors"
            >
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
          <Link
            href="/partners/requirements"
            className="inline-block mt-6 text-sm text-black underline hover:text-white transition-colors"
          >
            View full partner site requirements including insurance
          </Link>
        </div>
      </section>

      {/* Onboarding — shown after application section as next steps */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-6 h-6 rounded-full bg-brand-green-600 inline-block flex-shrink-0" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900">After Your Application Is Approved</h2>
          </div>
          <p className="text-sm font-medium text-black mb-6">
            Once your partner application is reviewed and approved, complete these four steps to receive your first apprentice placement.
          </p>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {isApproved
                ? 'Your partner account is approved. Log in to complete onboarding and receive apprentice placements.'
                : 'These steps require an approved partner account. You will be prompted to log in.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/partners/barber-host-shop/handbook"
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-400 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-lg group-hover:bg-brand-blue-600 group-hover:text-white transition">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-brand-blue-600" />
                  <h3 className="font-bold text-slate-900">Read the Partner Handbook</h3>
                </div>
                <p className="text-sm text-black">Covers your responsibilities, supervision requirements, hour tracking, and compensation rules.</p>
              </div>
            </Link>

            <Link
              href="/partners/barber-host-shop/policy-acknowledgment"
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-400 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-lg group-hover:bg-brand-blue-600 group-hover:text-white transition">
                2
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-4 h-4 text-brand-blue-600" />
                  <h3 className="font-bold text-slate-900">Acknowledge Policies</h3>
                </div>
                <p className="text-sm text-black">Review and acknowledge the program policies, wage requirements, and supervision standards.</p>
              </div>
            </Link>

            <Link
              href="/partners/barber-host-shop/forms"
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-400 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-lg group-hover:bg-brand-blue-600 group-hover:text-white transition">
                3
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-brand-blue-600" />
                  <h3 className="font-bold text-slate-900">Complete Required Forms</h3>
                </div>
                <p className="text-sm text-black">Submit your shop license, insurance certificate, and barber-on-file documentation.</p>
              </div>
            </Link>

            <Link
              href="/partners/barber-host-shop/sign-mou"
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-400 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-lg group-hover:bg-brand-blue-600 group-hover:text-white transition">
                4
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <PenLine className="w-4 h-4 text-brand-blue-600" />
                  <h3 className="font-bold text-slate-900">Sign the MOU</h3>
                </div>
                <p className="text-sm text-black">Sign the Memorandum of Understanding to formalize the partnership and receive your first apprentice.</p>
              </div>
            </Link>

            <Link
              href="/partners/barber-host-shop/documents"
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-400 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-lg group-hover:bg-brand-blue-600 group-hover:text-white transition">
                5
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-brand-blue-600" />
                  <h3 className="font-bold text-slate-900">Upload Required Documents</h3>
                </div>
                <p className="text-sm text-black">Upload your shop license, workers' comp insurance certificate, and supervising barber license. Keep these current as required by the DOL.</p>
              </div>
            </Link>
          </div>

          <p className="mt-6 text-xs text-black text-center">
            Already approved? <Link href="/login?redirect=/partners/barber-host-shop/forms" className="underline text-brand-blue-600">Log in to your partner account</Link> to access these steps. Questions? Call <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="underline">{PLATFORM_DEFAULTS.supportPhone}</a>.
          </p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <InstitutionalLegalNotice />
      </div>
    </div>
  );
}
