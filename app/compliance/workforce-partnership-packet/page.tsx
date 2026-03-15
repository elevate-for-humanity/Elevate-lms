
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Shield,
  GraduationCap,
  Building2,
  Award,
  FileCheck,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Monitor,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = {
  title: 'Workforce Partnership Packet | Compliance | Elevate for Humanity',
  description:
    'Ready-to-share partnership packet for workforce boards, community organizations, and employer partners. Program list, delivery model, progress reporting, credential structure, and cohort timeline.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/workforce-partnership-packet',
  },
};

/* ── Program Summary Data ── */
const PROGRAMS = [
  { name: 'Barber Apprenticeship', duration: '~18 months', format: 'In-Person + LMS', rtiHours: 144, ojtHours: 1500, credential: 'Indiana Barber License', funding: 'Self-Pay / Employer-Sponsored', registered: true },
  { name: 'CNA Certification', duration: '4–6 weeks', format: 'Hybrid', rtiHours: 105, ojtHours: 45, credential: 'CNA Certification (ISDH)', funding: 'WIOA / JRI / Self-Pay', registered: false },
  { name: 'CDL Commercial Driving', duration: '4–6 weeks', format: 'In-Person', rtiHours: 40, ojtHours: 120, credential: 'CDL Class A/B (BMV)', funding: 'WIOA / WRG / Self-Pay', registered: false },
  { name: 'HVAC Technician', duration: '8–16 weeks', format: 'Hybrid', rtiHours: 200, ojtHours: 200, credential: 'EPA 608 + OSHA 10', funding: 'WIOA / WRG / Employer', registered: false },
  { name: 'IT Help Desk', duration: '8 weeks', format: 'In-Person + Labs', rtiHours: 280, ojtHours: 40, credential: 'Certiport IT Specialist', funding: 'WIOA / JRI / Self-Pay', registered: false },
  { name: 'Cybersecurity Analyst', duration: '12 weeks', format: 'In-Person + Labs', rtiHours: 440, ojtHours: 40, credential: 'Certiport IT Specialist — Cybersecurity', funding: 'WIOA / JRI / Self-Pay', registered: false },
  { name: 'Welding', duration: '10–16 weeks', format: 'In-Person', rtiHours: 160, ojtHours: 240, credential: 'AWS D1.1 + OSHA 10', funding: 'WIOA / WRG / Employer', registered: false },
  { name: 'Electrical', duration: '10–16 weeks', format: 'Hybrid', rtiHours: 200, ojtHours: 200, credential: 'OSHA 10 + NCCER Core', funding: 'WIOA / WRG / Employer', registered: false },
];

export default function WorkforcePartnershipPacketPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white">
      {/* Breadcrumbs — hidden on print */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Workforce Partnership Packet' },
          ]} />
        </div>
      </div>

      {/* Hero — hidden on print */}
      <section className="relative h-[240px] sm:h-[300px] print:hidden overflow-hidden">
        <Image
          src="/images/pages/workforce-partnership-hero.jpg"
          alt="Workforce partnership meeting"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-slate-600 text-sm font-medium uppercase tracking-wider mb-2">
              Partnership Documentation
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Workforce Partnership Packet
            </h1>
          </div>
        </div>
      </section>

      {/* Print header */}
      <div className="hidden print:block px-8 pt-8 pb-4 border-b-2 border-gray-900">
        <h1 className="text-2xl font-bold text-gray-900">Workforce Partnership Packet</h1>
        <p className="text-sm text-gray-600">Elevate for Humanity — Partnership Documentation</p>
        <p className="text-xs text-gray-500 mt-1">RAPIDS ID: 2025-IN-132301 | INTraining Location ID: 10004621</p>
      </div>

      {/* Organization Overview */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Overview</h2>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Organization</dt>
                  <dd className="text-gray-900 font-medium">Elevate for Humanity Career &amp; Technical Institute</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Legal Entity</dt>
                  <dd className="text-gray-900">2Exclusive LLC-S (DBA Elevate for Humanity Career &amp; Technical Institute)</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Classification</dt>
                  <dd className="text-gray-900">Hybrid Workforce Training Provider & Registered Apprenticeship Sponsor</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Location</dt>
                  <dd className="text-gray-900">Indianapolis, Indiana</dd>
                </div>
              </dl>
            </div>
            <div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">RAPIDS Registration</dt>
                  <dd className="text-gray-900">2025-IN-132301</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">INTraining Location</dt>
                  <dd className="text-gray-900">10004621</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Approvals</dt>
                  <dd className="text-gray-900">WIOA Eligible Training Provider, WRG Provider, Indiana DWD Listed</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Cohort Setup Time</dt>
                  <dd className="text-gray-900 font-medium">~2 weeks from agreement to enrollment</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Delivery Model Summary */}
          <div className="bg-white rounded-lg p-6 border print:bg-white print:border-gray-300">
            <h3 className="font-bold text-gray-900 mb-3">Delivery Model</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Training is delivered through licensed credential partners and approved program
              holders under centralized institutional oversight, with employer partners providing
              structured on-the-job training. Elevate manages enrollment, funding navigation,
              progress tracking, competency assessment, and career services. All instruction is
              tracked through the institutional LMS.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">RTI via licensed credential partners (mapped hours)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">OJT via approved employer partners</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Competency-based assessment with mapped standards</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">LMS tracking for RTI hours, modules, and evaluations</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Credentials issued by licensed authorities (not Elevate)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">MOU-governed partner relationships</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Catalog */}
      <section className="py-10 bg-white print:bg-white print:border-t">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Program Catalog</h2>
          <p className="text-gray-600 text-sm mb-6">
            All programs include mapped RTI hours, OJT hours, and industry-recognized credentials.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse print:text-[10px]">
              <thead>
                <tr className="bg-white print:bg-white">
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Program</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Duration</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Format</th>
                  <th className="text-center p-2.5 font-semibold text-gray-900 border-b">RTI Hrs</th>
                  <th className="text-center p-2.5 font-semibold text-gray-900 border-b">OJT Hrs</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Credential</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Funding</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMS.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white/50' : 'bg-white'}>
                    <td className="p-2.5 font-medium text-gray-900 border-b">
                      {p.name}
                      {p.registered && <span className="ml-1 text-[10px] text-brand-green-700 font-semibold">(RAPIDS)</span>}
                    </td>
                    <td className="p-2.5 text-gray-700 border-b">{p.duration}</td>
                    <td className="p-2.5 text-gray-700 border-b">{p.format}</td>
                    <td className="p-2.5 text-center text-brand-blue-700 font-semibold border-b print:text-gray-900">{p.rtiHours}</td>
                    <td className="p-2.5 text-center text-gray-700 border-b">{p.ojtHours.toLocaleString()}</td>
                    <td className="p-2.5 text-gray-700 border-b">{p.credential}</td>
                    <td className="p-2.5 text-gray-600 border-b">{p.funding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Progress Reporting */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Reporting for Partners</h2>
          <p className="text-gray-600 text-sm mb-6">
            Workforce partners and cohort sponsors receive structured progress reports through
            the institutional LMS. Reports are available on a schedule agreed upon in the
            partnership MOU.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, title: 'Enrollment Report', desc: 'Student enrollment status, demographic data (as permitted), program assignment, and start dates.' },
              { icon: Clock, title: 'RTI Hour Tracking', desc: 'Hours completed vs. required per student. Broken down by classroom, online, and lab hours.' },
              { icon: Monitor, title: 'Module Completion', desc: 'Per-student module progress, assessment scores, and competency verification status.' },
              { icon: Building2, title: 'OJT Hour Logging', desc: 'Employer-submitted OJT hours with supervisor verification. Skill area breakdown included.' },
              { icon: Award, title: 'Credential Status', desc: 'Exam readiness, exam dates, pass/fail results, and credential issuance confirmation.' },
              { icon: Users, title: 'Cohort Summary', desc: 'Aggregate cohort metrics: completion rate, credential attainment, employment placement, and retention.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-lg p-4 border print:bg-white print:border-gray-300">
                  <Icon className="w-5 h-5 text-brand-blue-600 mb-2 print:text-gray-700" />
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-xs">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 print:bg-white print:border-gray-300">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Reporting frequency:</span> Weekly, biweekly, or monthly — configured per partnership agreement. Real-time dashboard access available for authorized partner contacts.
            </p>
          </div>
        </div>
      </section>

      {/* Cohort Timeline */}
      <section className="py-10 bg-white print:bg-white print:border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cohort Setup Timeline</h2>
          <p className="text-gray-600 text-sm mb-6">
            From initial agreement to student enrollment in approximately 2 weeks.
          </p>

          <div className="space-y-3">
            {[
              { day: 'Day 1–2', title: 'Partnership Agreement', desc: 'MOU execution, cohort parameters defined (size, program, timeline, reporting requirements).' },
              { day: 'Day 3–5', title: 'Student Intake', desc: 'Eligibility screening, enrollment forms, funding determination (WIOA/JRI/WRG/self-pay).' },
              { day: 'Day 5–7', title: 'Credential Partner Alignment', desc: 'RTI provider confirmed, instructor assignment, module sequencing, LMS accounts created.' },
              { day: 'Day 7–10', title: 'Employer OJT Setup', desc: 'OJT agreements signed, work process schedules documented, supervisors designated (if applicable).' },
              { day: 'Day 10–14', title: 'Cohort Launch', desc: 'Orientation, first RTI session, LMS access activated, progress tracking begins.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start bg-white rounded-lg p-4 border print:border-gray-300">
                <div className="flex-shrink-0 w-20 text-xs font-bold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded text-center print:bg-white print:text-gray-900">
                  {step.day}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment & Verification */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment & Competency Verification</h2>
          <p className="text-gray-600 text-sm mb-6">
            Competency-based assessment aligned to industry skill standards.
          </p>

          <div className="bg-white rounded-lg p-6 border print:bg-white print:border-gray-300">
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Assessment Authority</p>
                <ul className="space-y-1 text-gray-700 text-xs">
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />RTI competencies verified by Credential Partner / Instructor</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />OJT competencies verified by Employer Supervisor</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />Final completion verified by Program Holder + Sponsor (Elevate)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Evaluation Checkpoints</p>
                <ul className="space-y-1 text-gray-700 text-xs">
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />30-day evaluation (initial progress review)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />Midpoint evaluation (competency milestone check)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />Final competency review (certification readiness)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0 mt-0.5" />Completion documentation (credential issuance + placement)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-10 bg-white print:bg-white print:border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Partnership Inquiries</h2>
          <div className="bg-white rounded-lg border p-6 print:border-gray-300">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-blue-600 flex-shrink-0 print:text-gray-700" />
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-gray-700">info@elevateforhumanity.org</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-blue-600 flex-shrink-0 print:text-gray-700" />
                <div>
                  <p className="font-semibold text-gray-900">Phone</p>
                  <p className="text-gray-700">(317) 794-0484</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-blue-600 flex-shrink-0 print:text-gray-700" />
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p className="text-gray-700">Indianapolis, Indiana</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-brand-blue-600 flex-shrink-0 print:text-gray-700" />
                <div>
                  <p className="font-semibold text-gray-900">Website</p>
                  <p className="text-gray-700">www.elevateforhumanity.org</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation — hidden on print */}
      <section className="py-10 bg-white print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/compliance/apprenticeship-structure" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
              Apprenticeship & RTI Structure
            </Link>
            <Link href="/compliance/credential-partners" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition">
              Credential Partner Registry
            </Link>
            <Link href="/instructional-framework" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition">
              Instructional Framework
            </Link>
            <Link href="/workone-partner-packet" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition">
              WorkOne Partner Packet
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>
    </div>
  );
}
