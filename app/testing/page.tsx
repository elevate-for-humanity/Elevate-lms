import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, DollarSign, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ACTIVE_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

export const metadata: Metadata = {
  title: 'Testing & Credential Exams | Elevate for Humanity',
  description:
    'Workforce credential exams and proctor-supervised certification testing. Certiport, EPA 608, ACT WorkKeys/NCRC, NHA, and NRF Rise Up exams available through authorized testing partnerships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/testing',
  },
};

const PROVIDER_IMAGES: Record<string, string> = {
  esco: '/images/pages/hvac-technician.jpg',
  nrf: '/images/pages/apply-employer-hero.jpg',
  certiport: '/images/pages/testing-page-1.jpg',
  nha: '/images/pages/medical-assistant.jpg',
  workkeys: '/images/pages/career-services-page-4.jpg',
  servsafe: '/images/pages/career-services-page-3.jpg',
};

const CAPABILITY_LABELS: Record<string, string> = {
  IN_PERSON_ONLY: 'In-person only',
  IN_PERSON_OR_PROVIDER_REMOTE: 'In-person or remote',
  CENTER_REMOTE_ALLOWED: 'In-person or live online',
};

export default function TestingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Testing & Credential Exams' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/career-services-page-1.jpg"
          alt="Workforce credential testing"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Hero text — below image, never overlaid */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Testing &amp; Credential Exams</h1>
          <p className="text-gray-600 text-lg">Authorized testing center for workforce certifications</p>
        </div>
      </section>

      {/* DISCLAIMER BANNER */}
      <section className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed space-y-2">
              <p>
                <strong>Important Notice:</strong> Elevate for Humanity is an authorized testing and proctoring site — we do not issue credentials. All certifications and credentials are issued solely by the respective credentialing authority (NHA, ACT, Certiport, EPA/ESCO, NRF, etc.) upon passing their exam.
              </p>
              <p>
                Exam fees listed are candidate-pay rates and are subject to change without notice. Fees are collected at time of booking and are <strong>non-refundable</strong> unless the exam is canceled by Elevate. Workforce-funded candidates (WIOA, WorkOne) may have fees covered — contact us before booking.
              </p>
              <p>
                Passing an exam does not guarantee employment. Credential requirements vary by employer and state. Some credentials require additional state licensure.{' '}
                <Link href="/compliance" className="underline font-medium hover:text-amber-700">View full compliance disclosure →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROVIDER CARDS — driven from CERT_PROVIDERS config */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Available Credential Exams</h2>
          <p className="text-slate-500 mb-10 text-sm">All exams are proctor-supervised. Government-issued photo ID required. By appointment only.</p>

          <div className="space-y-10">
            {ACTIVE_PROVIDERS.map((provider) => (
              <div key={provider.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid lg:grid-cols-3">
                  <div className="relative h-52 lg:h-auto overflow-hidden">
                    <Image
                      src={PROVIDER_IMAGES[provider.key] || '/images/pages/career-services-page-1.jpg'}
                      alt={provider.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="lg:col-span-2 p-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{provider.name}</h3>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                        {CAPABILITY_LABELS[provider.capability]}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-5 leading-relaxed">{provider.description}</p>

                    {/* Exams */}
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Exams Available</p>
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {provider.exams.map((exam) => (
                          <div key={exam} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                            {exam}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fees */}
                    {provider.fees && provider.fees.length > 0 ? (
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Exam Fees</p>
                        <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 border border-slate-100">
                          {provider.fees.map((fee) => (
                            <div key={fee.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{fee.label}</p>
                                {fee.note && <p className="text-xs text-slate-400 mt-0.5">{fee.note}</p>}
                              </div>
                              <span className="text-brand-red-600 font-black text-lg shrink-0">${fee.amount}</span>
                            </div>
                          ))}
                        </div>
                        {provider.groupDiscount && (
                          <div className="flex items-start gap-2 mt-2 bg-brand-blue-50 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-brand-blue-700">{provider.groupDiscount}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic mb-4">Contact us for pricing.</p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {provider.status === 'active' && (
                        <Link
                          href={`/testing/book?exam=${provider.key}`}
                          className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
                        >
                          <CalendarDays className="w-4 h-4" />
                          Book a Seat
                        </Link>
                      )}
                      {provider.verifyUrl && (
                        <a
                          href={provider.verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 hover:border-slate-400 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                        >
                          Provider Site →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEE SUMMARY TABLE */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-7 h-7 text-brand-red-600" />
            <h2 className="text-3xl font-black text-slate-900">Fee Summary</h2>
          </div>
          <p className="text-slate-500 mb-8 text-sm max-w-2xl">
            All fees include the exam and proctoring. Workforce-funded candidates may have fees covered — contact us before booking.
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Provider</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Exam</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-700">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACTIVE_PROVIDERS
                  .filter(p => p.fees && p.fees.length > 0)
                  .flatMap(p =>
                    p.fees!.map((fee, i) => (
                      <tr key={`${p.key}-${i}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-400 text-xs align-top pt-3.5">{i === 0 ? p.name : ''}</td>
                        <td className="px-5 py-3 text-slate-800 font-medium">
                          {fee.label}
                          {fee.note && <span className="block text-xs text-slate-400 font-normal">{fee.note}</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-black text-brand-red-600 text-base">${fee.amount}</td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">How Testing Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Book Your Seat', desc: 'Select your exam and preferred date. Pay the exam fee at booking. No walk-ins accepted.' },
              { step: '2', title: 'Bring Valid ID', desc: 'Government-issued photo ID required. No ID, no exam — no exceptions.' },
              { step: '3', title: 'Take the Exam', desc: 'Proctor-supervised on-site. No phones or outside materials unless permitted by the provider.' },
              { step: '4', title: 'Receive Your Credential', desc: 'Results and credentials issued directly by the certifying body. Elevate records your outcome.' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="w-8 h-8 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">{s.step}</div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{s.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to Get Certified?</h2>
          <p className="text-slate-600 mb-8">Book your exam seat online or call us to schedule. All testing is by appointment only.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/testing/book"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
            >
              <CalendarDays className="w-5 h-5" />
              Book a Testing Session
            </Link>
            <a
              href="tel:3173143757"
              className="inline-flex items-center gap-2 border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-4 rounded-full font-bold text-lg transition-colors"
            >
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
