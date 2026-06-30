export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Users, Award, Building2, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import HostShopSyllabusRequirement from '@/components/programs/beauty/HostShopSyllabusRequirement';
import { getApprovedShops, PROGRAM_LABELS } from '@/lib/programs/host-shops';

export const metadata: Metadata = {
  title: 'Become a Host Barbershop | Barber Apprenticeship',
  description: `Partner with ${PLATFORM_DEFAULTS.orgName} as a host barbershop for our USDOL Registered Barber Apprenticeship program. Train the next generation of barbers.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/host-shops',
  },
};

export default async function HostShopsPage() {
  const approvedShops = await getApprovedShops('barber');

  return (
    <main className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
          { label: 'Host Shops' },
        ]}
      />
      {/* Hero */}
      <section className="relative h-[38vh] min-h-[220px] max-h-[420px] w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/barber-gallery-1.webp"
          alt="Professional barbershop interior"
          fill sizes="100vw"
          className="object-cover"
          priority placeholder="empty"
        />
      </section>

      {/* Why Partner - Visual Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-black">Why Partner With Us?</h2>
          <p className="text-xl text-black text-center mb-16 max-w-3xl mx-auto">
            Host shops gain trained talent, zero paperwork burden, and the satisfaction of building the next generation.
          </p>
          
          {/* Benefit 1 - Image Left */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw"
                src="/images/pages/barber-training.webp"
                alt="Barber training apprentice"
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
                Apprentices come to you ready to learn. They handle shampoos, sweeping, prep work, and basic services under your supervision - freeing you to focus on paying clients.
              </p>
              <ul className="space-y-2 text-black">
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600 font-bold">•</span> Extra hands during busy hours
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600 font-bold">•</span> Pre-screened, committed learners
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600 font-bold">•</span> Potential future employees
                </li>
              </ul>
            </div>
          </div>

          {/* Benefit 2 - Image Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-brand-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Zero Paperwork for You</h3>
              <p className="text-lg text-black mb-4">
                We handle all the administrative burden. Hour tracking, state compliance, curriculum delivery, and completion documentation - that's our job, not yours.
              </p>
              <ul className="space-y-2 text-black">
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span> Digital hour tracking system
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span> State board compliance handled
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span> Simple attendance verification
                </li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl order-1 md:order-2">
              <Image sizes="100vw"
                src="/images/pages/barber-gallery-2.webp"
                alt="Professional barbershop"
                fill
                className="object-cover" placeholder="empty"
              />
            </div>
          </div>

          {/* Benefit 3 - Image Left */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw"
                src="/images/pages/barber-gallery-3.webp"
                alt="Barber with client"
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
                Every master barber learned from someone. By hosting apprentices, you pass on your skills and strengthen the profession. Many host shops hire their best apprentices after completion.
              </p>
              <ul className="space-y-2 text-black">
                <li className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">•</span> Train barbers your way
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">•</span> First pick of new talent
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">•</span> Recognition as a training shop
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-black">Host Shop Qualifications</h2>
          <p className="text-black text-center mb-12">
            To participate as a host barbershop, your shop must meet these requirements:
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-black">
            <ul className="space-y-4">
              {[
                'Hold an active Indiana barbershop license in good standing',
                'Employ at least one licensed barber capable of supervising apprentices',
                'Maintain a safe, professional training environment',
                'Agree to verify apprentice attendance and progress',
                'Follow program guidelines and documentation requirements',
                'Use the published program syllabus so floor coaching matches the apprentice’s daily LMS theory module',
                'Carry appropriate business insurance',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-brand-green-600 font-bold text-xl">•</span>
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
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Host Shop Responsibilities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border-2 border-black shadow-lg">
              <h3 className="font-bold text-xl mb-6 text-black">What You Provide</h3>
              <ul className="space-y-4 text-black">
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">→</span>
                  <span className="text-lg">Supervised on-the-job training</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">→</span>
                  <span className="text-lg">Workspace and tools access</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">→</span>
                  <span className="text-lg">Attendance verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-orange-600 font-bold text-xl">→</span>
                  <span className="text-lg">Professional mentorship</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="font-bold text-xl mb-6 text-slate-900">What We Handle</h3>
              <ul className="space-y-4 text-slate-900">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">•</span>
                  <span className="text-lg">Apprenticeship structure & framework</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">•</span>
                  <span className="text-lg">Related instruction (Prestige Elevation Barber Curriculum)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">•</span>
                  <span className="text-lg">Documentation & compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl">•</span>
                  <span className="text-lg">Completion verification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HostShopSyllabusRequirement programSlug="barber-apprenticeship" />

      {/* Approved host shops */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-slate-900">Approved Host Shops</h2>
          <p className="text-center text-slate-700 mb-10 max-w-2xl mx-auto">
            These partner barbershops are approved to host DOL-registered barber apprentices in the
            Indianapolis metro area. Apprentices may be placed based on availability.
          </p>
          {approvedShops.length === 0 ? (
            <p className="text-center text-slate-600">
              Approved host shop list is loading. Contact us for current placement partners.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {approvedShops.map((shop) => (
                <li
                  key={shop.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-red-600" aria-hidden />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{shop.name}</h3>
                      <p className="mt-1 text-sm text-slate-700">
                        {[shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ')}
                      </p>
                      {shop.supervisor ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Supervisor: {shop.supervisor}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-green-700">
                        Approved host shop
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {shop.programs
                          .map((slug) => PROGRAM_LABELS[slug] ?? slug)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Approval Process */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Approval Process</h2>
          <div className="space-y-6">
            {[
              { step: 1, title: 'Submit Application', description: 'Complete the host shop enrollment form with your shop details and license information.' },
              { step: 2, title: 'License Verification', description: 'We verify your barbershop license and supervisor credentials.' },
              { step: 3, title: 'Agreement Review', description: 'Review and accept the Host Shop Agreement (MOU).' },
              { step: 4, title: 'Approval & Placement', description: 'Once approved, you can begin hosting apprentices based on availability.' },
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
              Host shops must be approved before they can host apprentices. Enrollment includes intake and Host Shop Agreement acceptance.
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
            Join our network of approved host barbershops and help shape future barbers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/forms/host-shop-inquiry"
              className="bg-white text-slate-900 px-8 py-4 rounded-lg font-bold transition hover:bg-white"
            >
              General Inquiry
            </Link>
            <Link
              href="/partners/barber-host-shop/apply"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold transition"
            >
              Enroll as a Host Shop
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-blue-800">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2 text-black">{title}</h3>
      <p className="text-black">{description}</p>
    </div>
  );
}
