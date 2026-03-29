'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import {
  Award, Clock, ChevronRight, MapPin, BookOpen,
  Briefcase, TrendingUp, DollarSign, AlertTriangle,
  Building2, FileText, Users, Scissors, ClipboardList,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { BarberEnrollment } from './sections/BarberEnrollment';

interface Props { program: ProgramSchema; }

export default function BarberApprenticeshipClient({ program: p }: Props) {
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistType, setWaitlistType] = useState<'apprentice' | 'shop'>('apprentice');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ HERO ═══ */}
      {(() => {
        const b = heroBanners['barber-apprenticeship'];
        return (
          <HeroVideo
            videoSrcDesktop={b.videoSrcDesktop}
            posterImage={b.posterImage}
            voiceoverSrc={b.voiceoverSrc}
            microLabel={b.microLabel}
            analyticsName={b.analyticsName}
          />
        );
      })()}

      {/* ═══ PROGRAM IDENTITY CARD (below video) ═══ */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/programs" className="hover:text-brand-blue-600">Programs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Barber Apprenticeship</span>
          </nav>
          <div className="flex items-start gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Barber Apprenticeship</h1>
            <span className="flex-shrink-0 text-xs font-bold text-white px-3 py-1 rounded-full bg-brand-blue-600">DOL Registered</span>
          </div>
          <p className="text-slate-600 text-lg mb-6">{p.subtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
            <SpecItem icon={Clock} label="Duration" value="52 weeks" />
            <SpecItem icon={BookOpen} label="Hours/Week" value="15–20 hrs" />
            <SpecItem icon={MapPin} label="Delivery" value="Hybrid" />
            <SpecItem icon={Award} label="Credentials" value={`${p.credentials.length} earned`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span><strong>Schedule:</strong> {p.schedule}</span>
            <span><strong>Cohort:</strong> {p.cohortSize}</span>
            <span><strong>Tuition:</strong> $4,980. Payment plans available.</span>
          </div>
        </div>
      </section>

      {/* ═══ DISCLOSURE BANNER ═══ */}
      <section className="bg-amber-50 border-y border-amber-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">New Program — Now Enrolling</p>
            <p className="text-sm text-amber-800 mt-1">
              This is a new DOL Registered Apprenticeship program currently rolling out in the Indianapolis metro area.
              We are actively seeking licensed barbershops to partner as host training sites. Apprentice spots are limited —
              there is a waiting list. Sign up below to reserve your place or{' '}
              <Link href="/programs/barber-apprenticeship/apply?type=partner_shop" className="underline font-medium">apply as a partner barbershop</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CAREER PATHWAY (condensed paragraph) ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Career Pathway</h2>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Start as a <strong>Barber Apprentice</strong> earning $24,000–$30,000 while you train under a licensed barber at a host shop.
              After completing 2,000 hours and passing the Indiana state exam, you become a <strong>Licensed Barber</strong> ($30,000–$45,000).
              With 3–5 years of experience and an established clientele, you advance to <strong>Senior Barber</strong> ($45,000–$65,000).
              Many graduates go on to open their own shop as a <strong>Shop Owner / Master Barber</strong> ($65,000–$100,000+).
            </p>
          </div>
          <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
            <Image src="/images/pages/barber-fade-cut.jpg" alt="Barber performing a precision fade cut" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* ═══ MEASURABLE OUTCOMES (condensed paragraph) ═══ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-72 rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <Image src="/images/pages/barber-straight-razor.jpg" alt="Barber performing a straight razor shave" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Measurable Outcomes</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                By program completion, apprentices perform six standard haircut styles — fade, taper, buzz, scissor-over-comb,
                flat top, and shape-up — to client satisfaction. You will execute straight razor shaves following Indiana
                sanitation protocols, identify and treat common scalp conditions, and demonstrate proper disinfection procedures
                per Indiana Board standards. Each apprentice completes 1,500 hours of on-the-job training at a licensed shop,
                builds a client portfolio of 50+ documented services, and passes the Indiana Barber License written and practical exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CREDENTIALS EARNED (image blocks, no OSHA 10) ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Credentials Earned</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { img: '/images/pages/barber-tools-closeup.jpg', alt: 'Barber tools and clippers', cred: p.credentials[0] },
            { img: '/images/pages/barber-client-consult.jpg', alt: 'Barber consulting with client', cred: p.credentials[1] },
            { img: '/images/pages/barber-shop-wide.jpg', alt: 'Professional barbershop interior', cred: p.credentials[2] },
          ].filter(item => item.cred).map((item, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden hover:border-brand-blue-300 transition-colors">
              <div className="relative h-44">
                <Image src={item.img} alt={item.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{item.cred.name}</h3>
                <p className="text-xs text-brand-blue-600 font-medium mt-1">Issued by {item.cred.issuer}</p>
                <p className="text-sm text-slate-600 mt-2">{item.cred.description}</p>
                {item.cred.validity && <p className="text-xs text-slate-500 mt-2">Valid: {item.cred.validity}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA: INQUIRY & ENROLLMENT ═══ */}
      <section className="py-12 border-t">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">Ready to Start?</h2>
          <p className="text-slate-500 text-center max-w-2xl mx-auto mb-8">
            Choose the right path for where you are in the process.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Inquiry Application */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Inquiry Application</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Not sure if this program is right for you? Submit an inquiry and a career advisor will
                contact you to discuss eligibility, funding options, and next steps. No commitment required.
                {' '}<Link href="/forms/barber-apprenticeship-inquiry" className="underline font-medium text-brand-blue-600">Use the inquiry form →</Link>
              </p>
              <Link
                href="/contact?program=barber-apprenticeship"
                className="inline-block bg-brand-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-blue-700 transition-colors"
              >
                Submit Inquiry
              </Link>
            </div>
            {/* Enrollment Application */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enrollment Application</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Ready to enroll? Complete the full application to begin the admissions process.
                Includes funding eligibility check, background information, and program agreement.
                BNPL payment plans available.
              </p>
              <Link
                href="/programs/barber-apprenticeship/apply"
                className="inline-block bg-brand-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-red-700 transition-colors"
              >
                Apply to Enroll
              </Link>
            </div>
          </div>
          {/* Indiana Career Connect */}
          <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 max-w-4xl mx-auto">
            <p className="text-brand-blue-900 font-semibold text-sm mb-1">Indiana Career Connect</p>
            <p className="text-brand-blue-800 text-sm leading-relaxed mb-3">
              For WIOA-eligible and apprenticeship pathway applicants, the next step may require Indiana Career Connect.
            </p>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Go to Indiana Career Connect
            </a>
          </div>

        </div>
      </section>

      <BarberEnrollment />



      {/* ═══ CAREER OUTCOMES / LABOR MARKET ═══ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Career Outcomes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-brand-green-50 rounded-lg p-6 text-center border border-brand-green-100">
              <DollarSign className="w-8 h-8 text-brand-green-600 mx-auto" />
              <div className="text-3xl font-bold text-slate-900 mt-2">${p.laborMarket.medianSalary.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Median Annual Salary</div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-6 text-center border border-brand-blue-100">
              <TrendingUp className="w-8 h-8 text-brand-blue-600 mx-auto" />
              <div className="text-3xl font-bold text-slate-900 mt-2">{p.laborMarket.growthRate}</div>
              <div className="text-sm text-slate-600">Job Growth (10-year)</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-lg font-bold text-slate-900 mt-2">{p.laborMarket.salaryRange}</div>
              <div className="text-sm text-slate-600">Salary Range ({p.laborMarket.region})</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {p.careers.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-slate-200">
                <span className="font-medium text-slate-900 text-sm">{c.title}</span>
                <span className="text-sm text-brand-green-700 font-medium">{c.salary}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Source: {p.laborMarket.source}, {p.laborMarket.sourceYear}</p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {p.faqs.map((faq, i) => (
            <details key={i} className="group bg-white border border-slate-200 rounded-lg overflow-hidden">
              <summary className="px-5 py-4 cursor-pointer font-medium text-slate-900 hover:bg-white transition-colors flex items-center justify-between">
                {faq.question}
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ WAITLIST SIGNUP ═══ */}
      <section className="bg-brand-blue-50 py-10" id="waitlist">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-blue-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Join the Waiting List</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">
                Apprentice spots are limited and fill quickly. Join the waiting list to be notified when the next
                cohort opens. Barbershop owners can also sign up to be considered as a host training site.
              </p>
              <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '3/2' }}>
                <Image src="/images/pages/barber-styling-hair.jpg" alt="Barber styling a client's hair" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-brand-blue-200 p-6">
              {waitlistSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scissors className="w-8 h-8 text-brand-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">You&apos;re on the list!</h3>
                  <p className="text-sm text-slate-600">We&apos;ll contact you when the next cohort opens or when a host shop spot becomes available.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setWaitlistSubmitted(true); }} className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Waiting List Signup</h3>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setWaitlistType('apprentice')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${waitlistType === 'apprentice' ? 'bg-brand-blue-600 text-white border-brand-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}>
                      I want to be an Apprentice
                    </button>
                    <button type="button" onClick={() => setWaitlistType('shop')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${waitlistType === 'shop' ? 'bg-brand-orange-600 text-white border-brand-orange-600' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}>
                      I own a Barbershop
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" required value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input type="tel" value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <button type="submit"
                    className={`w-full py-3 rounded-lg font-semibold text-sm text-white transition-colors ${waitlistType === 'shop' ? 'bg-brand-orange-600 hover:bg-brand-orange-700' : 'bg-brand-blue-600 hover:bg-brand-blue-700'}`}>
                    {waitlistType === 'shop' ? 'Sign Up as Partner Shop' : 'Join Apprentice Waiting List'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INSTITUTIONAL FOOTER ═══ */}
      <section className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-slate-600">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase mb-2">Admission Requirements</h3>
              <ul className="space-y-1">
                {p.admissionRequirements.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase mb-2">What&apos;s Included</h3>
              <ul className="space-y-1">
                {p.pricingIncludes.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase mb-2">Employer Partners</h3>
              <ul className="space-y-1">
                {p.employerPartners.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
              {p.bilingualSupport && <p className="mt-3 text-xs text-slate-500">{p.bilingualSupport}</p>}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400 space-y-1">
            <p>Modality: {p.modality}</p>
            <p>Facility: {p.facilityInfo}</p>
            <p>Equipment: {p.equipmentIncluded}</p>
            <p>Tuition: $4,980. Payment plans available.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="w-5 h-5 text-brand-blue-600 mx-auto mb-1" />
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="font-semibold text-slate-900 text-sm">{value}</div>
    </div>
  );
}
