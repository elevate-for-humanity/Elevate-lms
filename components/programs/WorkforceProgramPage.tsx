import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowRight, Clock, DollarSign, Award, Users, BookOpen,
  ClipboardCheck, Building, Briefcase, Shield, BarChart3,
  GraduationCap, CheckCircle, Phone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─── Data contract ─── */

export interface ProgramCredential {
  name: string;
  type: 'Industry-Recognized Certification' | 'Licensure' | 'Certificate' | 'Apprenticeship Certificate';
  issuer: string;
}

export interface CareerPathway {
  title: string;
  salary: string;
  demand?: string;
}

export interface CurriculumModule {
  icon?: LucideIcon;
  title: string;
  description: string;
}

export interface EnrollmentStep {
  title: string;
  description: string;
}

export interface WorkforceProgramData {
  /* Identity */
  title: string;
  slug: string;
  programId: string;            // INTraining ID e.g. "#10004322"
  providerName: string;         // "2Exclusive LLC-S" on INTraining
  locationName: string;         // "Elevate for Humanity Training Center"
  category: string;
  categoryHref: string;
  heroImage: string;
  secondaryImage?: string;
  accentColor: 'red' | 'blue' | 'green' | 'rose' | 'amber';

  /* Section 1 — Program Overview */
  overview: string;             // Institutional description paragraph

  /* Section 2 — Delivery Model */
  deliveryModel: {
    rtiDescription: string;     // How RTI is delivered
    ojtDescription?: string;    // How OJT is delivered (if apprenticeship)
    progressTracking: string;   // How progress is tracked
    oversight: string;          // Who provides oversight
  };

  /* Section 3 — Program Structure */
  structure: {
    totalDuration: string;      // "20 weeks"
    totalHours?: string;        // "400+"
    rtiHours?: string;          // "160"
    ojtHours?: string;          // "1,500+"
    totalCost: string;          // "$5,000"
    fundingNote: string;        // "WIOA funding available" or "Workforce Ready Grant eligible"
  };

  /* Section 4 — Competencies */
  competencies: string[];

  /* Section 5 — Credential Pathway */
  credentials: ProgramCredential[];
  credentialStatement: string;  // Institutional wording about credential issuance

  /* Section 6 — Curriculum / What You'll Learn */
  curriculum: CurriculumModule[];

  /* Section 7 — Career Pathways */
  careers: CareerPathway[];
  employers?: string[];

  /* Section 8 — Enrollment Steps */
  enrollmentSteps: EnrollmentStep[];

  /* Eligibility */
  eligibility: string[];

  /* CTA */
  applyHref: string;
  fundingHref?: string;
  contactHref?: string;

  /* Optional apprenticeship section */
  apprenticeship?: {
    description: string;
    supervisorRequirement: string;
    evaluationCadence: string;
    hourLogging: string;
  };
}

/* ─── Color map ─── */

const COLORS = {
  red:   { bg: 'bg-brand-red-600', hover: 'hover:bg-brand-red-700', light: 'bg-brand-red-50', text: 'text-brand-red-600', accent: 'bg-brand-red-100', dot: 'bg-brand-red-600' },
  blue:  { bg: 'bg-brand-blue-600', hover: 'hover:bg-brand-blue-700', light: 'bg-brand-blue-50', text: 'text-brand-blue-600', accent: 'bg-brand-blue-100', dot: 'bg-brand-blue-600' },
  green: { bg: 'bg-brand-green-600', hover: 'hover:bg-brand-green-700', light: 'bg-brand-green-50', text: 'text-brand-green-600', accent: 'bg-brand-green-100', dot: 'bg-brand-green-600' },
  rose:  { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50', text: 'text-rose-600', accent: 'bg-rose-100', dot: 'bg-rose-600' },
  amber: { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', light: 'bg-amber-50', text: 'text-amber-600', accent: 'bg-amber-100', dot: 'bg-amber-600' },
} as const;

/* ─── Component ─── */

export function WorkforceProgramPage({ program }: { program: WorkforceProgramData }) {
  const c = COLORS[program.accentColor];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: program.category, href: program.categoryHref },
            { label: program.title },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src={program.heroImage}
          alt={`${program.title} training program`}
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className={`inline-flex items-center gap-2 ${c.bg} text-white px-4 py-2 rounded-full text-sm font-bold mb-4`}>
              <Award className="w-4 h-4" /> {program.structure.fundingNote}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">
              {program.title}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mb-6">
              {program.overview.slice(0, 200)}{program.overview.length > 200 ? '...' : ''}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={program.applyHref} className={`inline-flex items-center gap-2 ${c.bg} ${c.hover} text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105`}>
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/40">
                Register at Indiana Career Connect
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-6 bg-white border-t">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Clock className="w-7 h-7 text-brand-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{program.structure.totalDuration}</div>
              <div className="text-slate-400 text-sm">Program Duration</div>
            </div>
            {program.structure.totalHours && (
              <div>
                <BookOpen className="w-7 h-7 text-brand-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{program.structure.totalHours}</div>
                <div className="text-slate-400 text-sm">Training Hours</div>
              </div>
            )}
            <div>
              <DollarSign className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{program.structure.totalCost}</div>
              <div className="text-slate-400 text-sm">Total Program Cost</div>
            </div>
            <div>
              <Award className="w-7 h-7 text-brand-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{program.credentials.length}</div>
              <div className="text-slate-400 text-sm">Credentials Earned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1 — Program Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Program Overview</h2>
              <p className="text-slate-700 leading-relaxed text-lg mb-6">{program.overview}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  INTraining Program ID: {program.programId} &middot; Provider: {program.providerName} &middot; Location: {program.locationName}, Indianapolis, Indiana (Marion County)
                </p>
              </div>
            </div>
            {program.secondaryImage && (
              <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={program.secondaryImage}
                  alt={`${program.title} training`}
                  fill sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2 — Training Delivery Model */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Training Delivery Model</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Programs are delivered through a structured workforce training model that includes licensed credential partners for instruction, employer-based hands-on training where applicable, mapped competencies, and LMS-tracked progress under centralized program oversight.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className={`w-12 h-12 ${c.accent} rounded-xl flex items-center justify-center mb-4`}>
                <BookOpen className={`w-6 h-6 ${c.text}`} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Related Technical Instruction (RTI)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{program.deliveryModel.rtiDescription}</p>
            </div>
            {program.deliveryModel.ojtDescription && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className={`w-12 h-12 ${c.accent} rounded-xl flex items-center justify-center mb-4`}>
                  <Building className={`w-6 h-6 ${c.text}`} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">On-the-Job Training (OJT)</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{program.deliveryModel.ojtDescription}</p>
              </div>
            )}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className={`w-12 h-12 ${c.accent} rounded-xl flex items-center justify-center mb-4`}>
                <BarChart3 className={`w-6 h-6 ${c.text}`} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Progress Tracking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{program.deliveryModel.progressTracking}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className={`w-12 h-12 ${c.accent} rounded-xl flex items-center justify-center mb-4`}>
                <Shield className={`w-6 h-6 ${c.text}`} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Program Oversight</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{program.deliveryModel.oversight}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Program Structure (Mapped Hours) */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8">Program Structure</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">{program.structure.totalDuration}</div>
              <div className="text-slate-500 text-sm">Total Duration</div>
            </div>
            {program.structure.rtiHours && (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">{program.structure.rtiHours}</div>
                <div className="text-slate-500 text-sm">RTI Hours</div>
              </div>
            )}
            {program.structure.ojtHours && (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">{program.structure.ojtHours}</div>
                <div className="text-slate-500 text-sm">OJT Hours (Employer-Based)</div>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">{program.structure.totalCost}</div>
              <div className="text-slate-500 text-sm">Total Training Cost</div>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            {program.structure.fundingNote}. Funding eligibility is determined through your local WorkOne office or by completing our intake form.
          </p>
        </div>
      </section>

      {/* Section 4 — Core Competencies */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Core Competencies</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Participants demonstrate mastery of the following competencies through structured assessments, rubric evaluations, and documented skill verification.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {program.competencies.map((comp, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <CheckCircle className={`w-5 h-5 ${c.text} flex-shrink-0 mt-0.5`} />
                <span className="text-slate-700">{comp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Credential Pathway */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Credential Pathway</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">{program.credentialStatement}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {program.credentials.map((cred, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className={`w-5 h-5 ${c.text}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{cred.type}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{cred.name}</h3>
                <p className="text-slate-500 text-sm">Issued by: {cred.issuer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — What You'll Learn (Curriculum) */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">What You&apos;ll Learn</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Hands-on, competency-based training covering the skills employers require.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {program.curriculum.map((mod, i) => {
              const Icon = mod.icon || BookOpen;
              return (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 ${c.accent} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6.5 — Apprenticeship / Employer Training (conditional) */}
      {program.apprenticeship && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Workplace Training Component</h2>
            <p className="text-slate-600 mb-8 max-w-3xl">{program.apprenticeship.description}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Supervised Training</h3>
                <p className="text-slate-600 text-sm">{program.apprenticeship.supervisorRequirement}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Performance Evaluations</h3>
                <p className="text-slate-600 text-sm">{program.apprenticeship.evaluationCadence}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 sm:col-span-2">
                <h3 className="font-bold text-slate-900 mb-2">OJT Hour Logging</h3>
                <p className="text-slate-600 text-sm">{program.apprenticeship.hourLogging}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 7 — Career Pathways */}
      <section className={`py-16 ${c.bg}`}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Career Pathways</h2>
              <p className="text-slate-600 mb-8">
                Graduates enter the workforce with industry-recognized credentials and documented competencies.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {program.careers.map((career, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900">{career.title}</h3>
                    <p className="text-slate-600 text-sm">{career.salary}/year</p>
                    {career.demand && <p className="text-slate-500 text-xs mt-1">{career.demand}</p>}
                  </div>
                ))}
              </div>
            </div>
            {program.employers && program.employers.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Industry Employers</h3>
                <div className="grid grid-cols-2 gap-3">
                  {program.employers.map((emp, i) => (
                    <div key={i} className="bg-white/20 rounded-lg px-4 py-3 text-white font-medium text-sm">
                      {emp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 7.5 — Progress Tracking & Reporting */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Progress Tracking &amp; Reporting</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            All participant progress is documented and available to workforce partners upon request.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'LMS module completion tracking',
              'RTI attendance documentation',
              'OJT performance evaluations',
              'Competency rubric assessments',
              'Cohort progress reporting available to partners',
              'Credential attainment records',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <ClipboardCheck className={`w-5 h-5 ${c.text} flex-shrink-0 mt-0.5`} />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 — Eligibility & Enrollment */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-4">Eligibility &amp; Enrollment</h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Many adults qualify for funded training through WIOA, JRI, or the Workforce Ready Grant.
          </p>

          {/* Eligibility */}
          <div className="max-w-2xl mx-auto mb-10 bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Eligibility Requirements</h3>
            <div className="space-y-2">
              {program.eligibility.map((req, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 ${c.dot} rounded-full flex-shrink-0 mt-2`} />
                  <span className="text-slate-700 text-sm">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-bold text-xl text-slate-900 text-center mb-6">How to Enroll</h3>
            <div className="space-y-3">
              {program.enrollmentSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-lg p-4 border border-slate-200">
                  <div className={`w-8 h-8 ${c.bg} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
            Start Your {program.title} Career
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            {program.structure.fundingNote}. Apply today to check your eligibility.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={program.applyHref} className={`inline-flex items-center gap-2 ${c.bg} ${c.hover} text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105`}>
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={program.contactHref || '/support'} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
