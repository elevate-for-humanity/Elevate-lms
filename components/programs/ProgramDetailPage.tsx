'use client';

/**
 * ProgramDetailPage — Institutional Program Detail Template v1
 *
 * Renders all 10 required sections in fixed order.
 * Validates the program schema at render time in development.
 * HVAC Technician is the canonical reference implementation.
 */

import Image from 'next/image';
import Link from 'next/link';
import {
  Award, BookOpen, Briefcase, CheckCircle, Clock, DollarSign,
  GraduationCap, MapPin, Shield, TrendingUp, Users, ChevronRight,
  Phone, FileText, Wrench, Building2,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { validateProgram, getTotalHoursRange, getTotalHoursFromBreakdown } from '@/lib/programs/program-schema';

interface Props {
  program: ProgramSchema;
  children?: React.ReactNode;
}

export default function ProgramDetailPage({ program: p, children }: Props) {
  // Dev-time validation
  if (process.env.NODE_ENV === 'development') {
    const errors = validateProgram(p);
    if (errors.length > 0) {
      console.warn(`[ProgramDetailPage] Validation errors for "${p.slug}":`);
      errors.forEach((e) => console.warn(`  ${e.field}: ${e.message}`));
    }
  }

  const totalHours = getTotalHoursFromBreakdown(p);
  const hoursRange = getTotalHoursRange(p);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ A. PROGRAM HEADER SPEC PANEL ═══════════════════════════ */}
      <section className="relative">
        <div className="relative h-[280px] sm:h-[340px]">
          <Image
            src={p.heroImage}
            alt={p.heroImageAlt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10 pb-8">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
              {p.breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-brand-blue-600">{b.label}</Link>
                  ) : (
                    <span className="text-slate-900 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>

            {/* Title + Badge */}
            <div className="flex items-start gap-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{p.title}</h1>
              {p.badge && (
                <span className={`flex-shrink-0 text-xs font-bold text-white px-3 py-1 rounded-full ${
                  p.badgeColor === 'orange' ? 'bg-brand-orange-500' :
                  p.badgeColor === 'green' ? 'bg-brand-green-600' :
                  p.badgeColor === 'red' ? 'bg-brand-red-600' :
                  'bg-brand-blue-600'
                }`}>
                  {p.badge}
                </span>
              )}
            </div>
            <p className="text-slate-600 text-lg mb-6">{p.subtitle}</p>

            {/* Spec Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
              <SpecItem icon={Clock} label="Duration" value={`${p.durationWeeks} weeks`} />
              <SpecItem icon={BookOpen} label="Hours/Week" value={`${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs`} />
              <SpecItem icon={MapPin} label="Delivery" value={p.deliveryMode === 'hybrid' ? 'Hybrid' : p.deliveryMode === 'online' ? 'Online' : 'In-Person'} />
              <SpecItem icon={Award} label="Credentials" value={`${p.credentials.length} earned`} />
            </div>

            {/* Hours Breakdown */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <HoursBar label="Online Instruction" hours={p.hoursBreakdown.onlineInstruction} total={totalHours} />
              <HoursBar label="Hands-on / Lab" hours={p.hoursBreakdown.handsOnLab} total={totalHours} />
              <HoursBar label="Exam Prep" hours={p.hoursBreakdown.examPrep} total={totalHours} />
              <HoursBar label="Career Placement" hours={p.hoursBreakdown.careerPlacement} total={totalHours} />
            </div>
            <p className="text-xs text-slate-500 mt-2">Total engagement: {hoursRange}</p>

            {/* Quick Facts Row */}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span><strong>Schedule:</strong> {p.schedule}</span>
              <span><strong>Cohort:</strong> {p.cohortSize}</span>
              <span><strong>Funding:</strong> {p.fundingStatement}</span>
              <span><strong>Self-pay:</strong> {p.selfPayCost}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRAINING PHASES (in-program pathway) ═══════════════════ */}
      {p.trainingPhases && p.trainingPhases.length > 0 && (
        <section className="bg-slate-900 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-brand-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Training Pathway</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {p.trainingPhases.map((phase) => (
                <div key={phase.phase} className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{phase.phase}</span>
                    <span className="text-xs text-slate-400 font-medium uppercase">{phase.weeks}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{phase.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{phase.focus}</p>
                  {phase.labCompetencies.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-[10px] text-brand-blue-400 font-bold uppercase tracking-wider mb-1.5">Lab Competencies</p>
                      <ul className="space-y-1">
                        {phase.labCompetencies.map((lc, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                            <Wrench className="w-3 h-3 text-brand-blue-400 mt-0.5 flex-shrink-0" />
                            {lc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CREDENTIAL PIPELINE (training → cert → job) ═══════════ */}
      {p.credentialPipeline && p.credentialPipeline.length > 0 && (
        <section className="bg-brand-blue-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Credential Pipeline</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {p.credentialPipeline.map((cp, i) => (
                <div key={i} className="bg-white rounded-lg border border-brand-blue-200 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{cp.training}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <ChevronRight className="w-3 h-3 text-brand-blue-400" />
                      <span className="text-sm font-semibold text-brand-blue-700">{cp.certification}</span>
                      <span className="text-[10px] text-slate-400">({cp.certBody})</span>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <ChevronRight className="w-3 h-3 text-brand-green-500" />
                      <span className="text-sm font-medium text-brand-green-700">{cp.jobRole}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ B. CREDENTIALS EARNED ══════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeader icon={Award} title="Credentials Earned" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {p.credentials.map((c, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-5 hover:border-brand-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-brand-blue-600 font-medium mt-0.5">Issued by {c.issuer}</p>
                  <p className="text-sm text-slate-600 mt-1">{c.description}</p>
                  {c.validity && <p className="text-xs text-slate-400 mt-1">Valid: {c.validity}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ C. PROGRAM OUTCOMES ════════════════════════════════════ */}
      <section className="bg-slate-50 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader icon={CheckCircle} title="Measurable Outcomes" />
          <p className="text-slate-600 mt-2 mb-6">Graduates demonstrate these competencies through practical assessment.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {p.outcomes.map((o, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{o.statement}</p>
                  {o.assessedAt && <p className="text-xs text-slate-500 mt-0.5">Assessed: {o.assessedAt}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ D. CAREER PATHWAY ══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeader icon={TrendingUp} title="Career Pathway" />
        <div className="mt-6 relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 hidden sm:block" />
          <div className="space-y-6">
            {p.careerPathway.map((step, i) => (
              <div key={i} className="flex items-start gap-4 sm:ml-0">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 relative z-10">
                  {i + 1}
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-600">
                    <span>{step.timeframe}</span>
                    <span className="text-brand-green-700 font-medium">{step.salaryRange}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{step.requirements}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ E. WEEKLY SCHEDULE ═════════════════════════════════════ */}
      <section className="bg-slate-50 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader icon={Clock} title={`${p.durationWeeks}-Week Training Schedule`} />
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {p.weeklySchedule.map((w, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-brand-blue-600 uppercase">{w.week}</div>
                <h3 className="font-semibold text-slate-900 mt-1">{w.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{w.competencyMilestone}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ F. COURSE MODULES ══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeader icon={BookOpen} title="Course Modules" />
        <div className="mt-6 space-y-4">
          {p.curriculum.map((mod, i) => (
            <details key={i} className="group border border-slate-200 rounded-lg overflow-hidden">
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="text-xs font-bold text-slate-400 w-8">M{i + 1}</span>
                <span className="font-semibold text-slate-900 flex-1">{mod.title}</span>
                <span className="text-xs text-slate-500">{mod.topics.length} topics</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-5 py-3 border-t border-slate-100">
                <ul className="space-y-1.5">
                  {mod.topics.map((t, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-slate-300 mt-1">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ G. STANDARDS & COMPLIANCE ══════════════════════════════ */}
      <section className="bg-brand-blue-50 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader icon={Shield} title="Standards & Compliance Alignment" />
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {p.complianceAlignment.map((c, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-brand-blue-100">
                <h3 className="font-semibold text-slate-900 text-sm">{c.standard}</h3>
                <p className="text-sm text-slate-600 mt-1">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ H. CAREER OUTCOMES / LABOR MARKET ═════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeader icon={Briefcase} title="Career Outcomes" />
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
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
          <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-lg font-bold text-slate-900 mt-2">{p.laborMarket.salaryRange}</div>
            <div className="text-sm text-slate-600">Salary Range ({p.laborMarket.region})</div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Source: {p.laborMarket.source}, {p.laborMarket.sourceYear}</p>

        {/* Career titles */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {p.careers.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <span className="font-medium text-slate-900 text-sm">{c.title}</span>
              <span className="text-sm text-brand-green-700 font-medium">{c.salary}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INDUSTRY & EMPLOYER PARTNERS ══════════════════════════ */}
      {p.employerPartners.length > 0 && (
        <section className="bg-white py-10 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeader icon={Building2} title="Industry & Employer Partners" />
            <p className="text-sm text-slate-600 mt-2 max-w-3xl">
              Our curriculum is shaped by employer input. Graduates enter a hiring pipeline with these organizations.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {p.employerPartners.map((partner, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-brand-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">{partner}</span>
                </div>
              ))}
            </div>
            {p.credentialPipeline && p.credentialPipeline.length > 0 && (
              <div className="mt-6 bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-brand-green-800 mb-2">Where Graduates Work</p>
                <div className="flex flex-wrap gap-2">
                  {p.credentialPipeline.map((cp, i) => (
                    <span key={i} className="text-xs bg-white border border-brand-green-300 text-brand-green-700 px-3 py-1 rounded-full font-medium">
                      {cp.jobRole}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ FAQ ════════════════════════════════════════════════════ */}
      {p.faqs.length > 0 && (
        <section className="bg-slate-50 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeader icon={FileText} title="Frequently Asked Questions" />
            <div className="mt-6 space-y-3">
              {p.faqs.map((faq, i) => (
                <details key={i} className="group bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <summary className="px-5 py-4 cursor-pointer font-medium text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    {faq.question}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ I. CTA BLOCK ══════════════════════════════════════════ */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to Start Your {p.title} Career?</h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto">{p.fundingStatement}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <Link
              href={p.cta.applyHref}
              className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href={p.cta.advisorHref || '/contact'}
              className="border border-slate-500 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:border-white transition-colors"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ J. INSTITUTIONAL FOOTER + DISCLAIMERS ═════════════════ */}
      <section className="bg-slate-50 border-t py-8">
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
              {p.bilingualSupport && (
                <p className="mt-3 text-xs text-slate-500">{p.bilingualSupport}</p>
              )}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400 space-y-1">
            <p>Modality: {p.modality}</p>
            <p>Facility: {p.facilityInfo}</p>
            <p>Equipment: {p.equipmentIncluded}</p>
            <p>Payment: {p.paymentTerms}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
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

function HoursBar({ label, hours, total }: { label: string; hours: number; total: number }) {
  const pct = total > 0 ? Math.round((hours / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{hours} hrs</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
