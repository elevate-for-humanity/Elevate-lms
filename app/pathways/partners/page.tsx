import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Partners & Cohort Training | Career Pathways | Elevate for Humanity',
  description: 'How workforce boards, community organizations, and employers partner with Elevate for custom cohort training, progress reporting, and credentialed placement.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways/partners' },
};

export default function PartnersPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Pathways', href: '/pathways' }, { label: 'Partners & Cohort Training' }]} />
        </div>
      </div>

      {/* Visual hero */}
      <section className="relative h-[280px] sm:h-[360px]">
        <Image src="/images/heroes-hq/employer-hero.jpg" alt="Employer and workforce partnership meeting" fill sizes="100vw" className="object-cover" priority quality={90} />
      </section>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Partners &amp; Cohort Training</h1>
          <div className="text-gray-700 space-y-4">
            <p>
              Elevate runs custom training cohorts for workforce boards, community organizations,
              employers, and government agencies. This page explains exactly how it works — what
              you get, how long it takes, what reports you receive, and what it costs.
            </p>
            <p>
              If you are a case manager at WorkOne, a program director at a community organization
              like La Plaza or Goodwill, an HR director at a company that needs trained workers, or
              a grant administrator evaluating training providers — this page is for you.
            </p>
          </div>
        </div>
      </section>

      {/* How a custom cohort works — step by step */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">How a Custom Cohort Works</h2>
          <p className="text-gray-600 mb-8">
            This is the process from first conversation to final outcome report. Most cohorts
            are up and running within 2–3 weeks of initial contact.
          </p>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'You tell us what you need',
                time: '1 phone call or email',
                image: '/images/heroes-hq/contact-hero.jpg',
                desc: 'You contact us and describe your situation: how many participants you want to train, what industry, what timeline, and what funding source you are using (WIOA, employer-sponsored, grant, etc.). We ask about your participants — their backgrounds, barriers, and goals — so we can match them to the right program.',
              },
              {
                step: 2,
                title: 'We design the cohort',
                time: '3–5 business days',
                image: '/images/programs-hq/training-classroom.jpg',
                desc: 'We configure a cohort for your group: start date, program track, credential targets, class schedule, and reporting cadence. If you need evening or weekend classes, we can accommodate that. If your participants need supportive services (transportation, childcare referrals), we coordinate those. You approve the plan before we start.',
              },
              {
                step: 3,
                title: 'Your participants enroll',
                time: '1–2 weeks',
                image: '/images/programs-hq/students-learning.jpg',
                desc: 'You refer participants to us. We handle eligibility screening, document collection, account setup on our learning platform, and orientation scheduling. Each participant gets a login to track their own progress. You get a roster with enrollment confirmation.',
              },
              {
                step: 4,
                title: 'Training begins',
                time: '4–16 weeks depending on program',
                image: '/images/heroes-hq/programs-hero.jpg',
                desc: 'Your cohort starts training together. Depending on the program, this includes classroom instruction, hands-on lab work, clinical rotations, behind-the-wheel training, or online coursework with live instructor sessions. You receive progress reports at the frequency you choose — weekly or biweekly.',
              },
              {
                step: 5,
                title: 'Participants earn credentials',
                time: 'End of program',
                image: '/images/heroes-hq/success-hero.jpg',
                desc: 'Participants take their certification exams. We report results to you: who passed, what credential was issued, and by which authority. Certification pathways include EPA Section 608 preparation with proctored exam administration through an approved testing partner. Credentials are issued by recognized third parties (Indiana ISDH, Indiana BMV, EPA, OSHA, CompTIA, AWS, Indiana PLA) — not by Elevate.',
              },
              {
                step: 6,
                title: 'Placement and outcome reporting',
                time: 'Ongoing after program completion',
                image: '/images/heroes-hq/career-services-hero.jpg',
                desc: 'Our career services team helps participants with resume building, interview preparation, and direct employer introductions. We track employment outcomes at 6 months and 12 months. You receive a final cohort report with credential attainment rates, employment rates, employer names, job titles, and wage data.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0">
                    <Image src={s.image} alt={s.title} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" />
                    <div className="absolute top-3 left-3 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
                      {s.step}
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{s.title}</h3>
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-3">{s.time}</span>
                    </div>
                    <p className="text-sm text-gray-700">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What reports look like */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">What Reports You Receive</h2>
          <p className="text-gray-600 mb-8">
            Reports are generated from our learning platform — not self-reported. You can request
            reports at any time, and we send them in the format you need (PDF, spreadsheet, or
            direct access to the platform).
          </p>

          <div className="space-y-4">
            {[
              {
                name: 'Weekly or Biweekly Progress Report',
                includes: 'Attendance records for each session, lesson completion percentage per participant, assessment and quiz scores, flags for participants who are falling behind or have missed sessions.',
                when: 'Sent on the schedule you choose — every Friday, every other Monday, or any cadence that works for your team.',
              },
              {
                name: 'Credential Report',
                includes: 'Exam dates for each participant, pass or fail result, credential name and issuing authority, credential issue date, and any retake scheduling.',
                when: 'Sent within 5 business days of exam completion.',
              },
              {
                name: 'Employment Outcome Report',
                includes: 'Employer name, job title, start date, starting wage, and employment verification. Tracked at 6 months (Q2) and 12 months (Q4) after program exit.',
                when: 'Sent at Q2 and Q4 milestones. Interim updates available on request.',
              },
              {
                name: 'Final Cohort Summary',
                includes: 'Total enrollment count, completion rate, credential attainment rate, employment rate, average starting wage, and participant-level detail as needed for funder compliance (WIOA performance indicators).',
                when: 'Sent within 30 days of cohort completion.',
              },
              {
                name: 'Apprenticeship Report (for apprenticeship programs)',
                includes: 'On-the-job training hours logged per apprentice, wage progression, RAPIDS registration status, classroom instruction completion, and projected completion date.',
                when: 'Sent monthly.',
              },
            ].map((r) => (
              <div key={r.name} className="bg-slate-50 rounded-lg border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-2">{r.name}</h3>
                <p className="text-sm text-gray-700 mb-2"><span className="font-semibold">What it includes:</span> {r.includes}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">When you get it:</span> {r.when}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who partners with us */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Who Partners With Us</h2>

          <div className="space-y-8">
            {[
              {
                type: 'Workforce Boards & Government Agencies',
                examples: 'WorkOne centers, Indiana DWD, regional workforce boards, county agencies',
                image: '/images/heroes-hq/how-it-works-hero.jpg',
                what: [
                  'WIOA-eligible training programs listed on the Eligible Training Provider List (ETPL)',
                  'Cohort-based training with published start dates, durations, and credential outcomes',
                  'Per-participant progress tracking with exportable reports for case managers',
                  'Alignment to WIOA performance indicators: credential attainment, employment Q2/Q4, median earnings, measurable skill gains',
                  'Custom cohort intake for agency referrals with dedicated enrollment support',
                ],
              },
              {
                type: 'Community Organizations',
                examples: 'La Plaza, Goodwill, community centers, reentry programs, faith-based organizations',
                image: '/images/heroes-hq/about-hero.jpg',
                what: [
                  'Custom cohorts designed for your participant population and their specific needs',
                  'Flexible scheduling — day, evening, and weekend options where available',
                  'Barrier removal support: transportation referrals, childcare coordination, supportive service connections',
                  'Bilingual intake support where available',
                  'Regular progress updates sent directly to your case managers or program directors',
                  'No cost to participants who qualify for WIOA, WRG, or JRI funding',
                ],
              },
              {
                type: 'Employers',
                examples: 'HVAC contractors, healthcare facilities, trucking companies, barbershops, IT firms',
                image: '/images/heroes-hq/employer-hero.jpg',
                what: [
                  'Apprenticeship host site opportunities — we handle DOL registration, RAPIDS paperwork, and compliance',
                  'Custom training cohorts aligned to your specific hiring needs and job requirements',
                  'Pre-screened, credentialed candidates ready for direct hire on day one',
                  'On-the-job training (OJT) reimbursement coordination through workforce funding programs',
                  'Ongoing upskilling for your current employees through our learning platform',
                  'No recruitment fees — our career services team connects you with graduates at no cost',
                ],
              },
              {
                type: 'Educational Institutions',
                examples: 'Community colleges, career centers, high schools, adult education programs',
                image: '/images/programs-hq/students-learning.jpg',
                what: [
                  'Articulation and credit transfer discussions for students moving between programs',
                  'Dual enrollment or bridge program partnerships',
                  'Shared credential pathways (for example: CNA at Elevate → LPN at Ivy Tech → RN at a university)',
                  'Referral pipelines for students who need short-term credentials before or alongside degree programs',
                ],
              },
            ].map((p) => (
              <div key={p.type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0">
                    <Image src={p.image} alt={p.type} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" />
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{p.type}</h3>
                    <p className="text-xs text-gray-400 mb-3">Examples: {p.examples}</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {p.what.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-brand-blue-600 mt-0.5 flex-shrink-0">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available programs quick reference */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Programs Available for Custom Cohorts</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Any of these programs can be configured as a dedicated cohort for your organization.
            Click any program for full details.
          </p>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Program</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Credential</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Funding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'CNA Certification', href: '/programs/cna-certification', duration: '4–6 weeks', credential: 'CNA (Indiana ISDH)', funding: 'WIOA, JRI, Self-Pay' },
                  { name: 'CDL Class A/B', href: '/programs/cdl', duration: '4–6 weeks', credential: 'CDL (Indiana BMV)', funding: 'WIOA, WRG, Self-Pay' },
                  { name: 'HVAC Technician', href: '/programs/hvac-technician', duration: '12–16 weeks', credential: 'EPA 608 + OSHA 10', funding: 'WIOA, WRG, Employer' },
                  { name: 'Electrical', href: '/programs/electrical', duration: '12–16 weeks', credential: 'OSHA 10 + NCCER Level 1', funding: 'WIOA, WRG, Employer' },
                  { name: 'Welding', href: '/programs/welding', duration: '12–16 weeks', credential: 'AWS + OSHA 10', funding: 'WIOA, WRG, Employer' },
                  { name: 'IT Support', href: '/programs/technology/it-support', duration: '8–12 weeks', credential: 'CompTIA A+', funding: 'WIOA, JRI, Self-Pay' },
                  { name: 'Cybersecurity', href: '/programs/technology/cybersecurity', duration: '12–16 weeks', credential: 'CompTIA Security+', funding: 'WIOA, JRI, Self-Pay' },
                  { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', duration: '~18 months', credential: 'Indiana Barber License', funding: 'State Grant, Employer' },
                ].map((r) => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Link href={r.href} className="font-medium text-brand-blue-600 hover:text-brand-blue-700">{r.name}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{r.duration}</td>
                    <td className="px-4 py-3 text-gray-600">{r.credential}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{r.funding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Set Up a Cohort?</h2>
          <p className="text-lg text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Tell us about your organization, your participants, and your timeline.
            We typically have a cohort plan ready within one week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
              Contact Us to Start <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/pathways" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-bold transition border-2 border-white/30">
              Back to Career Pathways
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
