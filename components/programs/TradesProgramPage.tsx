'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AuthorityStrip, CredentialPipeline } from '@/components/InstitutionalAuthority';
import CohortWaitlist from '@/components/programs/CohortWaitlist';

export interface CurriculumModule {
  week: string;
  title: string;
  topics: string[];
  image?: string;
  project?: string;
}

export interface Credential {
  name: string;
  issuingBody: string;
}

export interface TradesProgramData {
  slug: string;
  name: string;
  tagline: string;
  heroImage: string;
  secondaryImage: string;
  careerImage: string;
  duration: string;
  totalHours: string;
  rtiHours: string;
  ojtHours: string;
  modality: string;
  schedule: string;
  cohortMin: number;
  cohortMax: number;
  location: string;
  credentials: Credential[];
  curriculum: CurriculumModule[];
  admissionsRequirements: string[];
  bilingualSupport: boolean;
  tutoringAvailable: boolean;
  attendanceTracking: string;
  escalationProcess: string;
  reportFrequency: string;
  reportFormat: string;
  workBasedLearning: string;
  retentionTracking: string;
  costPerParticipant: number;
  examFeesIncluded: boolean;
  materialsIncluded: string[];
  paymentTerms: string;
  employerPartners: string[];
  nextLevelJobsEligible: boolean;
  careers: { title: string; salaryRange: string }[];
}

export default function TradesProgramPage({ data }: { data: TradesProgramData }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: data.name },
          ]} />
        </div>
      </div>

      {/* Hero — clean image, no text overlay */}
      <section className="relative h-[320px] sm:h-[420px]">
        <Image src={data.heroImage} alt={data.name} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded">
          <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Elevate for Humanity</span>
        </div>
      </section>

      {/* Program title + quick facts */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold">{data.name}</h1>
            {data.nextLevelJobsEligible && (
              <span className="inline-block bg-brand-green-700 text-white text-xs font-bold px-3 py-1 rounded">Next Level Jobs Eligible</span>
            )}
          </div>
          <p className="text-slate-300 text-sm mb-4 max-w-2xl">{data.tagline}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm border-t border-slate-700 pt-4">
            <div><div className="font-bold text-lg">{data.duration}</div><div className="text-slate-500">Duration</div></div>
            <div><div className="font-bold text-lg">{data.totalHours}</div><div className="text-slate-500">Total Hours</div></div>
            <div><div className="font-bold text-lg">${data.costPerParticipant.toLocaleString()}</div><div className="text-slate-500">Per Participant</div></div>
            <div><div className="font-bold text-lg">{data.cohortMin}–{data.cohortMax}</div><div className="text-slate-500">Cohort Size</div></div>
          </div>
        </div>
      </section>

      {/* Authority badges */}
      <div className="bg-white py-4 border-b border-gray-100">
        <AuthorityStrip />
      </div>

      {/* Overview + photo */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Program Overview</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-200">
                <Row label="Duration" value={data.duration} />
                <Row label="Total Instructional Hours" value={data.totalHours} />
                <Row label="RTI (Online / LMS)" value={data.rtiHours} />
                <Row label="OJT (Internship at Employer)" value={data.ojtHours} />
                <Row label="Delivery Model" value={data.modality} />
                <Row label="Schedule" value={data.schedule} />
                <Row label="Cohort Size" value={`${data.cohortMin}–${data.cohortMax} participants`} />
                <Row label="Training Location" value={data.location} />
                <Row label="Next Level Jobs" value={data.nextLevelJobsEligible ? 'Yes' : 'No'} />
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-2">
            <div className="relative h-64 lg:h-full min-h-[250px] rounded-lg overflow-hidden">
              <Image src={data.secondaryImage} alt={`${data.name} training`} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Credentials Awarded</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-300"><th className="text-left py-2 pr-4 text-slate-500 font-semibold">Credential</th><th className="text-left py-2 text-slate-500 font-semibold">Issuing Body</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {data.credentials.map((c, i) => (
                <tr key={i}><td className="py-3 pr-4 text-slate-900 font-medium">{c.name}</td><td className="py-3 text-slate-600">{c.issuingBody}</td></tr>
              ))}
            </tbody>
          </table>
          {data.examFeesIncluded && <p className="text-sm text-slate-500 mt-3">All certification exam fees included in program cost.</p>}
        </div>
      </section>

      {/* Credential Pipeline */}
      <CredentialPipeline />

      {/* Curriculum with images */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Curriculum</h2>
          <Link href={`/programs/${data.slug}/curriculum`} className="text-sm text-brand-blue-600 underline hover:text-brand-blue-800">View Full Curriculum</Link>
        </div>
        <div className="space-y-6">
          {data.curriculum.map((mod, i) => (
            <div key={i} className="grid sm:grid-cols-4 gap-0 border border-slate-200 rounded-lg overflow-hidden">
              {mod.image && (
                <div className="relative h-48 sm:h-auto sm:col-span-1">
                  <Image src={mod.image} alt={mod.title} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                </div>
              )}
              <div className={`p-5 ${mod.image ? 'sm:col-span-3' : 'sm:col-span-4'}`}>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">{mod.week}</span>
                  <h3 className="font-bold text-slate-900">{mod.title}</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700">
                  {mod.topics.map((t, j) => <li key={j}>– {t}</li>)}
                </ul>
                {mod.project && <p className="text-sm text-slate-500 mt-2">Project: {mod.project}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Admissions */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Admissions Requirements</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {data.admissionsRequirements.map((r, i) => <li key={i}>– {r}</li>)}
          </ul>
        </div>
      </section>

      {/* Support + Reporting */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Student Support</h2>
            <table className="w-full text-sm"><tbody className="divide-y divide-slate-200">
              <Row label="Bilingual (Spanish)" value={data.bilingualSupport ? 'Available' : 'Not available'} />
              <Row label="Tutoring" value={data.tutoringAvailable ? 'Available' : 'Not available'} />
              <Row label="Attendance Tracking" value={data.attendanceTracking} />
              <Row label="Escalation to LOC" value={data.escalationProcess} />
            </tbody></table>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Reporting & Compliance</h2>
            <table className="w-full text-sm"><tbody className="divide-y divide-slate-200">
              <Row label="Progress Reports" value={data.reportFrequency} />
              <Row label="Format" value={data.reportFormat} />
              <Row label="Work-Based Learning" value={data.workBasedLearning} />
              <Row label="Post-Placement" value={data.retentionTracking} />
            </tbody></table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Pricing & Payment</h2>
          <table className="w-full text-sm mb-4"><tbody className="divide-y divide-slate-200">
            <Row label="Cost Per Participant" value={`$${data.costPerParticipant.toLocaleString()}`} />
            <Row label="Exam Fees" value={data.examFeesIncluded ? 'Included' : 'Not included'} />
            <Row label="Payment Terms" value={data.paymentTerms} />
          </tbody></table>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Included in Cost</p>
          <p className="text-sm text-slate-700">{data.materialsIncluded.join(' · ')}</p>
        </div>
      </section>

      {/* Careers + photo */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="relative h-64 lg:h-full min-h-[250px] rounded-lg overflow-hidden">
              <Image src={data.careerImage} alt={`${data.name} career opportunities`} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
            </div>
          </div>
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Career Outcomes</h2>
            {data.careers.length > 0 && (
              <table className="w-full text-sm mb-6">
                <thead><tr className="border-b border-slate-300"><th className="text-left py-2 pr-4 text-slate-500 font-semibold">Position</th><th className="text-left py-2 text-slate-500 font-semibold">Salary Range</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {data.careers.map((c, i) => <tr key={i}><td className="py-2 pr-4 text-slate-900">{c.title}</td><td className="py-2 text-slate-600">{c.salaryRange}</td></tr>)}
                </tbody>
              </table>
            )}
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Employer Partners</p>
            {data.employerPartners.length > 0
              ? <p className="text-sm text-slate-700">{data.employerPartners.join(' · ')}</p>
              : <p className="text-sm text-slate-500">Employer partner list provided upon LOC engagement</p>
            }
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="bg-slate-50 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap gap-6 text-sm">
          <Link href={`/contact?subject=${encodeURIComponent(data.name + ' Syllabus Request')}`} className="text-brand-blue-600 underline hover:text-brand-blue-800">Request Syllabus</Link>
          <Link href={`/contact?subject=${encodeURIComponent(data.name + ' Brochure Request')}`} className="text-brand-blue-600 underline hover:text-brand-blue-800">Request Brochure</Link>
          <Link href="/contact" className="text-brand-blue-600 underline hover:text-brand-blue-800">Contact Program Director</Link>
        </div>
      </section>

      {/* Waitlist */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <CohortWaitlist programSlug={data.slug} programName={data.name} />
      </section>

      {/* CTA */}
      <section className="bg-white py-10 border-t">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{data.name}</h2>
            <p className="text-slate-400 text-sm">{data.duration} · ${data.costPerParticipant.toLocaleString()}/participant</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/apply?program=${data.slug}`} className="bg-white text-slate-900 px-6 py-3 rounded font-semibold text-sm hover:bg-slate-100 transition-colors">Apply Now</Link>
            <Link href={`/contact?subject=${encodeURIComponent(data.name)}`} className="border border-slate-500 text-white px-6 py-3 rounded font-semibold text-sm hover:border-white transition-colors">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-slate-500 w-[40%]">{label}</td>
      <td className="py-2 text-slate-900">{value}</td>
    </tr>
  );
}
