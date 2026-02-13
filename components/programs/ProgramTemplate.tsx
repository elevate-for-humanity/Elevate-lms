import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import type { Program } from '@/app/data/programs';
import { ProgramPaymentButton } from './ProgramPaymentButton';
import { PricingTiers } from './PricingTiers';
import { CareerServicesHook } from './CareerServicesHook';
import VideoHeroBanner from '@/components/home/VideoHeroBanner';
import { EligibilityNotice } from '@/components/EligibilityNotice';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WhatYouWillLearn } from '@/components/WhatYouWillLearn';
import ProgramPaymentOptions from '@/components/ProgramPaymentOptions';

// Apprenticeship programs hide pricing until after application
const APPRENTICESHIP_SLUGS = ['barber', 'barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'];

export function ProgramTemplate({ program }: { program: Program }) {
  const isApprenticeship = APPRENTICESHIP_SLUGS.includes(program.slug) || 
    program.name?.toLowerCase().includes('apprenticeship') ||
    program.category?.toLowerCase().includes('apprenticeship');

  return (
    <main className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: program.heroTitle || program.name || 'Program' }]} />
        </div>
      </div>

      {/* Eligibility Notice Banner */}
      <EligibilityNotice variant="banner" className="mx-4 mt-4 max-w-6xl lg:mx-auto" />

      {/* HERO SECTION - Video or Text */}
      {program.heroVideo ? (
        <VideoHeroBanner
          videoSrc={program.heroVideo}
          voiceoverSrc={program.voiceoverSrc}
          withAudio={!!program.voiceoverSrc}
        />
      ) : (
        <section className="bg-zinc-900 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {program.heroTitle}
              </h1>
              <p className="text-xl text-white/90 mb-6">
                {program.heroSubtitle}
              </p>

              {/* Format chips - hide pricing for apprenticeships */}
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                  {program.duration}
                </span>
                <span className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                  {program.delivery}
                </span>
                {!isApprenticeship && (
                  <span className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                    {program.price ? `$${program.price}` : '$0 with funding'}
                  </span>
                )}
                {isApprenticeship && (
                  <span className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                    Apply to see funding options
                  </span>
                )}
              </div>

              {/* Single CTA - Check Eligibility */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg"
                >
                  Check Eligibility
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AT-A-GLANCE CARDS */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className={`grid gap-6 ${program.clockHours ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <Card title="Duration" value={program.duration} />
          {program.clockHours && (
            <Card title="Clock Hours" value={`${program.clockHours} hrs`} highlight />
          )}
          <Card title="Format" value={program.delivery} />
          <Card title="Schedule" value={program.schedule} />
          <Card title="Credential" value={program.credential} />
        </div>
      </section>

      {/* PROGRAM OVERVIEW */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left: Overview + Outcomes */}
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold mb-6 text-black">
              Program Overview
            </h2>
            <p className="text-lg text-black mb-8 leading-relaxed">
              {program.shortDescription}
            </p>

            <h3 className="text-xl font-bold mb-4 text-black">
              What You'll Achieve
            </h3>
            <ul className="space-y-3">
              {program.outcomes
                .filter((outcome) => outcome && outcome.trim())
                .map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-xl">✓</span>
                    <span className="text-black">{outcome}</span>
                  </li>
                ))}
            </ul>

            {/* What You'll Learn */}
            {program.whatYouLearn && program.whatYouLearn.length > 0 && (
              <div className="mt-8">
                <WhatYouWillLearn items={program.whatYouLearn} title="What You'll Learn" />
              </div>
            )}

            {/* Payment Options */}
            {!isApprenticeship && (
              <div className="mt-8">
                <ProgramPaymentOptions programName={program.name} programSlug={program.slug} price={program.price || 0} duration={program.duration || '8-12 weeks'} />
              </div>
            )}

            {/* Credentials & Outcomes Box */}
            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                <span className="text-2xl">🎓</span> Credentials You'll Earn
              </h3>
              
              {/* Certificate of Completion */}
              <div className="mb-4 bg-white rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">📜</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Certificate of Completion</h4>
                    <p className="text-sm text-gray-600">
                      Issued by Elevate for Humanity upon successful program completion
                    </p>
                  </div>
                </div>
              </div>

              {/* Third-Party Certifications */}
              {program.credential && (
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold">✅</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Industry Certification</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {program.credential}
                      </p>
                      <p className="text-xs text-gray-500">
                        Third-party certification recognized by employers nationwide
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Post-Completion Pathway */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">What Happens After Completion?</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">→</span>
                    Career services support and job placement assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">→</span>
                    Access to employer partner network
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">→</span>
                    Pathway to advanced certifications and career growth
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Middle: What You'll Learn */}
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold mb-6 text-black">
              What You'll Learn
            </h2>

            {/* Show specializations for programs with multiple tracks */}
            {program.slug === 'drug-alcohol-specimen-collector' && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-black">
                  Program Specializations:
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-bold text-orange-900 mb-2">
                      DOT Urine Drug Testing
                    </h4>
                    <p className="text-sm text-black">
                      Department of Transportation certified collection
                      procedures
                    </p>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-bold text-orange-900 mb-2">
                      DOT Breath Alcohol Testing
                    </h4>
                    <p className="text-sm text-black">
                      Breath Alcohol Technician (BAT) certification
                    </p>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-bold text-orange-900 mb-2">
                      Non-DOT Testing
                    </h4>
                    <p className="text-sm text-black">
                      Workplace and employer-mandated testing programs
                    </p>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-bold text-orange-900 mb-2">
                      Oral Fluid Testing
                    </h4>
                    <p className="text-sm text-black">
                      Saliva-based drug testing procedures
                    </p>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-xl font-bold mb-4 text-black">
              Training Curriculum:
            </h3>
            <div className="space-y-4">
              {program.whatYouLearn.map((item, i) => (
                <div
                  key={i}
                  className="bg-blue-50 border border-blue-100 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">{i + 1}.</span>
                    <span className="text-black">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Payment/Enrollment - hidden for apprenticeships */}
          {program.price && !isApprenticeship && (
            <div>
              <ProgramPaymentButton
                programSlug={program.slug}
                programName={program.name}
                price={program.price}
                etplProgramId={program.etplProgramId}
                partnerUrl={program.partnerUrl}
              />
            </div>
          )}
        </div>
      </section>

      {/* PROGRAM HIGHLIGHTS */}
      {program.highlights && program.highlights.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-black text-center">
              Why This Program
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {program.highlights.map((highlight, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⭐</span>
                    <p className="text-black">{highlight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRICING OPTIONS - hidden for apprenticeships (payment after application) */}
      {!isApprenticeship && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <PricingTiers
            programSlug={program.slug}
            programName={program.name}
            tiers={program.pricingTiers}
            basePrice={program.price || 0}
            examVoucherPrice={program.examVoucherPrice || 0}
            retakeVoucherPrice={program.retakeVoucherPrice || 0}
            fundingAvailable={program.fundingOptions && program.fundingOptions.length > 0}
          />
        </section>
      )}

      {/* WHAT UNLOCKS AFTER ENROLLMENT - apprenticeships only */}
      {isApprenticeship && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">What Unlocks After Enrollment</h2>
            <p className="text-slate-600 mb-6">
              Payment secures your enrollment. Training access unlocks after approval and shop assignment.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-slate-700">Application submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-slate-700">Payment received (if self-pay)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⏳</span>
                <span className="text-slate-700">Shop assignment</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⏳</span>
                <span className="text-slate-700">Compliance approval</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm">🔒</span>
                <span className="text-slate-500">Training access (unlocks after approval)</span>
              </div>
            </div>
            <div className="mt-8">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Start Application
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* HOW TO ENROLL */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-black text-center">
          How to Enroll
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Step
            n={1}
            title="Apply Online"
            desc="Submit the short application so we can match you to the right path."
          />
          <Step
            n={2}
            title="Advisor Outreach"
            desc="We contact you to confirm goals, eligibility, and next steps."
          />
          <Step
            n={3}
            title="WorkOne Appointment"
            desc="We guide you to schedule and prepare for the funding appointment (if applicable)."
          />
          <Step
            n={4}
            title="Onboarding"
            desc="Upload required documents and complete orientation."
          />
          <Step
            n={5}
            title="Start Training"
            desc="Begin class and track progress through your dashboard."
          />
        </div>
      </section>

      {/* REQUIREMENTS */}
      {program.requirements && program.requirements.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-black">
              Who This Is For
            </h2>
            <ul className="space-y-3">
              {program.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-black">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FUNDING OPTIONS */}
      {program.fundingOptions && program.fundingOptions.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-6 text-black">
            Funding Options
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <ul className="space-y-3">
              {program.fundingOptions.map((option, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">$</span>
                  <span className="text-black">{option}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CAREER SERVICES HOOK */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <CareerServicesHook programName={program.name} programSlug={program.slug} />
      </section>

      {/* POST-COMPLETION PATHWAY */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-white text-center">
            What Happens After Completion?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Career Services</h3>
              <p className="text-white/80">
                Resume review, interview prep, and job search assistance from our career services team.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Employer Connections</h3>
              <p className="text-white/80">
                Direct introductions to hiring employers in our partner network actively seeking graduates.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Career Advancement</h3>
              <p className="text-white/80">
                Pathways to advanced certifications, specializations, and leadership roles in your field.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/career-services"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition"
            >
              Learn About Career Services →
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-zinc-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Apply now and we'll guide you step-by-step through the enrollment
            process.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href={program.ctaPrimary.href}
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-50 px-10 py-5 rounded-xl font-bold text-lg transition shadow-2xl"
            >
              {program.ctaPrimary.label}
            </Link>
            <a
              href="/support"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg transition"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
            <a
              href="mailto:info@www.elevateforhumanity.org"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg transition"
            >
              <Mail className="w-5 h-5" />
              Email Us
            </a>
          </div>

          <div className="pt-8 border-t border-white/20">
            <p className="text-sm text-white/70">
              Questions? Call us at Get Help Online or email
              info@www.elevateforhumanity.org
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-6 shadow-sm ${
      highlight 
        ? 'bg-blue-50 border-2 border-blue-200' 
        : 'bg-white border border-gray-200'
    }`}>
      <div className={`text-sm mb-2 ${highlight ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{title}</div>
      <div className={`text-base font-semibold ${highlight ? 'text-blue-900' : 'text-black'}`}>{value}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
          {n}
        </div>
        <div className="font-bold text-black mb-2">{title}</div>
        <div className="text-sm text-black">{desc}</div>
      </div>
    </div>
  );
}
