'use client';

import { hero as heroTokens } from '@/lib/page-design-tokens';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, Users, MapPin, Award } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { TUITION_DOLLARS } from '@/lib/cosmetology/pricing';

interface Props {
  program: ProgramSchema;
  enrollmentCount?: number;
}

export default function CosmetologyApprenticeshipClient({ program: p, enrollmentCount = 0 }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero image — no text overlay per design standard */}
      <div className={`${heroTokens.imageWrap} w-full overflow-hidden`}>
        {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
        <img
          src="/images/pages/cosmetology-apprenticeship-hero.webp"
          alt="Cosmetology apprenticeship students working in a licensed Indiana salon"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hero content — below image, never overlaid */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/programs" className="hover:text-slate-700">Programs</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{p.title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{p.title}</h1>
          <p className="text-slate-600 mb-6 max-w-2xl">{p.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/contact?program=cosmetology-apprenticeship"
              className="inline-block px-8 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Request Information
            </Link>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{p.durationWeeks} weeks</div>
              <div className="text-xs text-slate-500">Duration</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">In-Person</div>
              <div className="text-xs text-slate-500">Licensed Indiana salons</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award aria-label="award" className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{p.credentials.length} credentials</div>
              <div className="text-xs text-slate-500">Earned on completion</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {enrollmentCount > 0 ? `${enrollmentCount} active` : 'Enrolling now'}
              </div>
              <div className="text-xs text-slate-500">Apprentices</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Tuition + program summary */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">${TUITION_DOLLARS.toLocaleString()}</div>
            <div className="text-slate-600 font-medium">Total Tuition</div>
            <div className="text-sm text-slate-500 mt-2">{p.fundingStatement}</div>
            <Link
              href="/programs/cosmetology-apprenticeship/payment/bnpl"
              className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline"
            >
              View payment plan options →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">{p.durationWeeks} wks</div>
            <div className="text-slate-600 font-medium">Program Duration</div>
            <div className="text-sm text-slate-500 mt-2">{p.schedule}</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">Indiana</div>
            <div className="text-slate-600 font-medium">DOL Registered</div>
            <div className="text-sm text-slate-500 mt-2">WIOA supportive services eligible</div>
          </div>
        </div>

        {/* How it works: Salon-based + RTI */}
        <div className="bg-slate-50 rounded-xl p-8 mb-12 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How Salon-Based Apprenticeship Works</h2>
          <p className="text-slate-700 mb-6">
            You earn your Indiana Cosmetology License through a <strong>2,000-hour apprenticeship</strong> combining hands-on salon work with classroom instruction (RTI).
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl font-bold text-brand-red-600 mb-2">1,600</div>
              <div className="font-semibold text-slate-900 mb-2">Hours of Hands-On Salon Training</div>
              <p className="text-sm text-slate-600">
                Work in a licensed salon under supervision of a licensed cosmetologist. Perform real services on live clients: haircuts, coloring, chemical treatments, and more.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl font-bold text-brand-red-600 mb-2">200</div>
              <div className="font-semibold text-slate-900 mb-2">Hours of Related Technical Instruction (RTI)</div>
              <p className="text-sm text-slate-600">
                Classroom learning on theory: anatomy, chemistry, infection control, Indiana Board rules, and business practices. Required by Indiana for licensure.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl font-bold text-brand-red-600 mb-2">100</div>
              <div className="font-semibold text-slate-900 mb-2">Hours of Exam Prep</div>
              <p className="text-sm text-slate-600">
                Practice theory and practical exams. Get familiar with the format and content before sitting for your state licensing exams.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl font-bold text-brand-red-600 mb-2">100</div>
              <div className="font-semibold text-slate-900 mb-2">Career Placement Support</div>
              <p className="text-sm text-slate-600">
                Job readiness training, resume building, and placement assistance to connect you with salons and employers after licensure.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-6 border-t border-slate-200 pt-6">
            <strong>Indiana Requirement:</strong> To qualify for a cosmetology license, you must complete at least 2,000 hours of training (salon work + RTI) and pass both the theory and practical exams.
          </p>
        </div>

        {/* Training phases accordion */}
        {p.trainingPhases && p.trainingPhases.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Training Phases</h2>
            <div className="space-y-4">
              {p.trainingPhases.map((phase) => {
                const id = `phase-${phase.phase}`;
                return (
                  <div key={id} className="border border-slate-200 rounded-lg">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
                    >
                      <div>
                        <span className="inline-block text-xs font-bold text-white bg-brand-red-600 rounded-full px-2 py-0.5 mr-2">
                          Phase {phase.phase}
                        </span>
                        <span className="font-semibold text-slate-900">{phase.title}</span>
                        <span className="ml-2 text-sm text-slate-500">— {phase.weeks}</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                          expandedSection === id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSection === id && (
                      <div className="border-t border-slate-200 p-4 bg-slate-50">
                        <p className="text-slate-600 mb-3">{phase.focus}</p>
                        {phase.labCompetencies && phase.labCompetencies.length > 0 && (
                          <ul className="space-y-1">
                            {phase.labCompetencies.map((comp) => (
                              <li key={comp} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                                {comp}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Curriculum areas */}
        {p.curriculum && p.curriculum.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Curriculum Areas</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {p.curriculum.map((area) => (
                <div key={area.title} className="border border-slate-200 rounded-lg p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">{area.title}</h3>
                  <ul className="space-y-1">
                    {area.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credentials earned */}
        {p.credentials.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Credentials You Earn</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {p.credentials.map((cred) => (
                <div key={cred.name} className="border border-slate-200 rounded-lg p-5">
                  <Award aria-label="award" className="w-6 h-6 text-brand-red-600 mb-3" />
                  <div className="font-semibold text-slate-900 mb-1">{cred.name}</div>
                  <div className="text-xs text-slate-500 mb-2">{cred.issuer}</div>
                  <div className="text-sm text-slate-600">{cred.description}</div>
                  {cred.validity && (
                    <div className="mt-2 text-xs text-brand-blue-600">Valid: {cred.validity}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-brand-blue-900 text-white rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Cosmetology Apprenticeship?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join our cohort and earn a competitive wage while building your skills toward your Indiana cosmetology license.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/contact?program=cosmetology-apprenticeship"
              className="inline-block px-8 py-3 border border-white/30 text-slate-900 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Request Information
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
