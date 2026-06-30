export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Users, Award, Building2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import HostShopSyllabusRequirement from '@/components/programs/beauty/HostShopSyllabusRequirement';

export const metadata: Metadata = {
  title: 'Become a Host Salon | Cosmetology Apprenticeship',
  description:
    `Partner with ${PLATFORM_DEFAULTS.orgName} as a host salon for our USDOL Registered Cosmetology Apprenticeship program. Train the next generation of licensed cosmetologists.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship/host-shops',
  },
};

export default function CosmetologyHostSalonsPage() {
  return (
    <main className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
          { label: 'Host Salons' },
        ]}
      />

      {/* Hero */}
      <section className="relative h-[38vh] min-h-[220px] max-h-[420px] w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/cosmetology-hero.webp"
          alt="Professional salon interior with stylist stations"
          fill
          sizes="100vw"
          className="object-cover"
          priority placeholder="empty"
        />
      </section>

      {/* Why Partner */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-black">Why Partner With Us?</h2>
          <p className="text-xl text-black text-center mb-16 max-w-3xl mx-auto">
            Host salons gain trained talent, zero paperwork burden, and the satisfaction of building the
            next generation of licensed cosmetologists.
          </p>

          {/* Benefit 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw"
                src="/images/pages/cosmetology-apprenticeship-hero.webp"
                alt="Cosmetology apprentice learning from licensed stylist"
                fill
                className="object-cover" placeholder="empty"
              />
            </div>
            <div>
              <div className="w-16 h-16 bg-brand-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-brand-green-700" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Get Trained, Motivated Help</h3>
              <p className="text-lg text-black mb-4">
                Apprentices come to you ready to learn. They handle shampoos, blow-outs, station prep,
                color mixing, and basic services under your supervision &mdash; freeing you to focus on
                paying clients.
              </p>
              <ul className="space-y-2 text-black">
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600 font-bold">&bull;</span> Extra hands during peak hours
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600 font-bold">&bull;</span> Pre-screened, committed learners
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600 font-bold">&bull;</span> Potential future stylists on your team
                </li>
              </ul>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-brand-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Zero Paperwork for You</h3>
              <p className="text-lg text-black mb-4">
                We handle the administrative burden. Hour tracking, IPLA compliance documentation, Milady
                curriculum delivery, and completion records &mdash; that&apos;s our job, not yours.
              </p>
              <ul className="space-y-2 text-black">
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue-600 font-bold">&bull;</span> Digital hour tracking system
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue-600 font-bold">&bull;</span> IPLA state board compliance handled
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue-600 font-bold">&bull;</span> Simple attendance verification
                </li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl order-1 md:order-2">
              <Image sizes="100vw"
                src="/images/pages/cosmetology.webp"
                alt="Professional cosmetology salon"
                fill
                className="object-cover" placeholder="empty"
              />
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw"
                src="/images/pages/barber-styling-hair.webp"
                alt="Stylist working with client"
                fill
                className="object-cover" placeholder="empty"
              />
            </div>
            <div>
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Award aria-label="award" className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Build Your Legacy</h3>
              <p className="text-lg text-black mb-4">
                Every master stylist learned from someone. By hosting apprentices, you pass on your
                technique and strengthen the profession. Many host salons hire their best apprentices
                after completion.
              </p>
              <ul className="space-y-2 text-black">
                <li className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">&bull;</span> Train cosmetologists your way
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">&bull;</span> First pick of new talent
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">&bull;</span> Recognition as a training salon
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-black">Host Salon Qualifications</h2>
          <p className="text-black text-center mb-12">
            To participate as a host salon, your shop must meet these requirements:
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-black">
            <ul className="space-y-4">
              {[
                'Hold an active Indiana cosmetology salon license in good standing',
                'Employ at least one IPLA-licensed cosmetologist capable of supervising apprentices',
                'Maintain a safe, sanitary, professional training environment',
                'Agree to verify apprentice attendance and progress',
                'Follow program guidelines and Indiana cosmetology training requirements',
                'Carry appropriate business and liability insurance',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-brand-green-600 font-bold text-xl">&bull;</span>
                  <span className="text-black text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Host Salon Responsibilities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border-2 border-black shadow-lg">
              <h3 className="font-bold text-xl mb-6 text-black">What You Provide</h3>
              <ul className="space-y-4 text-black">
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">&rarr;</span>
                  <span className="text-lg">Supervised on-the-job training</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">&rarr;</span>
                  <span className="text-lg">Workspace, station, and product access</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">&rarr;</span>
                  <span className="text-lg">Attendance verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">&rarr;</span>
                  <span className="text-lg">Professional mentorship</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
              <h3 className="font-bold text-xl mb-6 text-slate-900">What We Handle</h3>
              <ul className="space-y-4 text-slate-900">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">&bull;</span>
                  <span className="text-lg">DOL apprenticeship sponsorship &amp; framework</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">&bull;</span>
                  <span className="text-lg">Related instruction (Milady curriculum)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">&bull;</span>
                  <span className="text-lg">Documentation &amp; IPLA compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">&bull;</span>
                  <span className="text-lg">Completion verification &amp; license-eligibility tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HostShopSyllabusRequirement programSlug="cosmetology-apprenticeship" />

      {/* Approval Process */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Approval Process</h2>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Submit Application',
                description:
                  'Complete the host salon enrollment form with your salon details and IPLA license information.',
              },
              {
                step: 2,
                title: 'License Verification',
                description: 'We verify your salon license and supervising cosmetologist credentials.',
              },
              {
                step: 3,
                title: 'Agreement Review',
                description: 'Review and accept the Host Salon Agreement (MOU).',
              },
              {
                step: 4,
                title: 'Approval & Placement',
                description:
                  'Once approved, you can begin hosting apprentices based on availability.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 shadow-lg border border-black">
                  <h3 className="font-bold text-black text-lg mb-2">{item.title}</h3>
                  <p className="text-black">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-brand-green-50 border-2 border-brand-green-600 rounded-xl p-6 text-center">
            <p className="text-black font-medium text-lg">
              Host salons must be approved before they can host apprentices. Enrollment includes intake
              and Host Salon Agreement acceptance.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <Building2 className="w-16 h-16 mx-auto mb-6 text-slate-900" />
          <h2 className="text-3xl font-bold mb-4">Ready to Train the Next Generation?</h2>
          <p className="text-slate-600 mb-8">
            Join our network of approved host salons and help shape future cosmetologists.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/forms/host-shop-inquiry?program=cosmetology-apprenticeship"
              className="bg-white text-slate-900 border-2 border-slate-900 px-8 py-4 rounded-lg font-bold transition hover:bg-slate-50"
            >
              General Inquiry
            </Link>
            <Link
              href="/partners/cosmetology-host-shop"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold transition"
            >
              Enroll as a Host Salon
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
