import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'How Training Works | Career Pathways | Elevate for Humanity',
  description: 'What a student day looks like at Elevate: classroom instruction, hands-on labs, online learning, progress tracking, and how we support you from enrollment to employment.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways/training-model' },
};

export default function TrainingModelPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Pathways', href: '/pathways' }, { label: 'How Training Works' }]} />
        </div>
      </div>

      {/* Visual hero */}
      <section className="relative h-[280px] sm:h-[360px]">
        <Image src="/images/programs-hq/training-classroom.jpg" alt="Students in a hands-on training classroom" fill sizes="100vw" className="object-cover" priority quality={90} />
      </section>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">How Training Works</h1>
          <div className="text-gray-700 space-y-4">
            <p>
              This page explains what your experience looks like as a student at Elevate — from
              the day you enroll to the day you start your new job. No jargon, no acronyms without
              explanation. Just a clear picture of what to expect.
            </p>
            <p>
              Elevate operates as a Hybrid Workforce Training Provider and Registered
              Apprenticeship Sponsor. Related Technical Instruction (RTI) is delivered through
              licensed credential partners and authorized program holders under centralized
              curriculum oversight. On-the-Job Training (OJT) is conducted by approved employer
              partners. Elevate manages enrollment, funding navigation, progress tracking,
              competency assessment, and career services.
            </p>
            <p>
              Every program combines some form of classroom instruction, hands-on practice, and
              online coursework. The mix depends on your program. A CDL student spends most of
              their time behind the wheel of a truck. A CNA student splits time between a classroom
              and a clinical rotation at a healthcare facility. A cybersecurity student works
              primarily online with live virtual instructor sessions.
            </p>
          </div>
        </div>
      </section>

      {/* Three training formats */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Three Ways We Deliver Training</h2>

          <div className="space-y-6">
            {/* Hybrid */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-48 sm:h-auto sm:w-64 flex-shrink-0">
                  <Image src="/images/programs-hq/skilled-trades-hero.jpg" alt="Hands-on trades training" fill sizes="(max-width: 640px) 100vw, 256px" className="object-cover" />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Classroom + Hands-On Lab</h3>
                  <p className="text-xs text-gray-400 mb-3">Programs: HVAC, Electrical, Welding, Plumbing, CNA, Medical Assistant, Phlebotomy</p>
                  <p className="text-sm text-gray-700 mb-3">
                    You come to a training facility 3–5 days per week. Mornings are typically classroom
                    instruction — theory, code requirements, safety protocols, exam prep. Afternoons are
                    hands-on: you work with real tools and equipment in a lab or shop environment.
                    Healthcare students do clinical rotations at actual healthcare facilities where they
                    work with real patients under supervision.
                  </p>
                  <p className="text-sm text-gray-700">
                    You also have access to an online learning platform where you can review lessons,
                    take practice quizzes, and track your progress outside of class. This is not a
                    replacement for in-person training — it is a supplement that helps you study on
                    your own time.
                  </p>
                </div>
              </div>
            </div>

            {/* In-person intensive */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-48 sm:h-auto sm:w-64 flex-shrink-0">
                  <Image src="/images/programs-hq/cdl-trucking.jpg" alt="CDL behind-the-wheel training" fill sizes="(max-width: 640px) 100vw, 256px" className="object-cover" />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Full-Time In-Person</h3>
                  <p className="text-xs text-gray-400 mb-3">Programs: CDL, Barber Apprenticeship, CPR/First Aid</p>
                  <p className="text-sm text-gray-700 mb-3">
                    CDL students spend 160+ hours in a truck — classroom instruction for permit prep
                    and regulations, then behind-the-wheel training on highways and city streets. You
                    train on the same Freightliner, Peterbilt, and Kenworth trucks used by major carriers.
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    Barber apprentices train at a real barbershop under a licensed instructor. You work
                    with real clients from day one. The full apprenticeship is 1,500 hours of on-the-job
                    training plus required classroom instruction — approximately 18 months.
                  </p>
                  <p className="text-sm text-gray-700">
                    CPR/First Aid is a single-day certification course. You learn and get certified the same day.
                  </p>
                </div>
              </div>
            </div>

            {/* Online */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-48 sm:h-auto sm:w-64 flex-shrink-0">
                  <Image src="/images/programs-hq/cybersecurity.jpg" alt="Online cybersecurity training" fill sizes="(max-width: 640px) 100vw, 256px" className="object-cover" />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Online with Live Instructors</h3>
                  <p className="text-xs text-gray-400 mb-3">Programs: IT Support, Cybersecurity</p>
                  <p className="text-sm text-gray-700 mb-3">
                    You work through lessons on our online learning platform at your own pace — video
                    lessons, reading materials, hands-on labs, and practice quizzes. But you are not
                    alone. You also attend scheduled live sessions with an instructor and your cohort
                    where you can ask questions, work through problems together, and get real-time help.
                  </p>
                  <p className="text-sm text-gray-700">
                    This format works well if you are working part-time, have family obligations, or
                    live outside the Indianapolis area. All you need is a computer and internet access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What a typical week looks like */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">What a Typical Week Looks Like</h2>
          <p className="text-gray-600 mb-8">
            Here is an example week for an HVAC or Electrical student in a 12-week program.
            Schedules vary by program, but this gives you a realistic picture.
          </p>

          <div className="space-y-3">
            {[
              { day: 'Monday', am: 'Classroom: Electrical theory, National Electrical Code review, exam prep', pm: 'Lab: Hands-on wiring practice, conduit bending, troubleshooting exercises' },
              { day: 'Tuesday', am: 'Classroom: Safety protocols, OSHA standards, blueprint reading', pm: 'Lab: Equipment installation practice, diagnostic testing' },
              { day: 'Wednesday', am: 'Classroom: Code compliance, inspection procedures', pm: 'Lab: Project work — complete a wiring installation from blueprint to inspection' },
              { day: 'Thursday', am: 'Classroom: Customer service, job site professionalism, industry overview', pm: 'Lab: Timed skill assessments, practice certification exam' },
              { day: 'Friday', am: 'Online: Review lessons on the learning platform, take practice quizzes, study for certification exam', pm: 'Career services: Resume workshop, interview practice, or employer meet-and-greet (scheduled periodically)' },
            ].map((d) => (
              <div key={d.day} className="bg-slate-50 rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-2">{d.day}</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><span className="font-semibold text-gray-800">Morning:</span> {d.am}</div>
                  <div><span className="font-semibold text-gray-800">Afternoon:</span> {d.pm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we track your progress */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">How We Track Your Progress</h2>
          <p className="text-gray-600 mb-8">
            When you enroll, you get a personal account on our online learning platform. Here is
            what you see when you log in and what your instructors and case managers can see.
          </p>

          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-2">What you see (your student dashboard)</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Your course progress — which lessons you have completed and which are next</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Your quiz and assessment scores</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Your attendance record</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Your certification exam status — whether you are eligible to test, when your exam is scheduled, and your result once you take it</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Upcoming deadlines and class schedule</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Messages from your instructor or program staff</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-2">What your instructor sees</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Progress for every student in the cohort — who is on track, who is falling behind</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Attendance records with automatic flags for missed sessions</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Assessment scores and areas where students need extra help</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Ability to send messages and schedule make-up sessions</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-2">What your case manager or funding agency sees (if applicable)</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Attendance and progress reports — sent weekly or biweekly</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Credential attainment reports — who passed, what credential, which issuing authority</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Employment outcome reports — employer, job title, wage, retention at 6 and 12 months</li>
                <li className="flex items-start gap-2"><span className="text-brand-blue-600 mt-0.5">•</span>Reports are generated from the platform, not self-reported</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What happens if you fall behind */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">What Happens If You Fall Behind</h2>
          <p className="text-gray-700 mb-4">
            Life happens. If you miss a class, fail a quiz, or hit a personal barrier, here is
            what we do — because we do not just let people drop out quietly.
          </p>
          <div className="space-y-3">
            {[
              { title: 'Missed a class', desc: 'Your instructor is notified automatically. Program staff reaches out within 24 hours to check on you and schedule a make-up session. Excused absences are documented for your case manager.' },
              { title: 'Struggling with material', desc: 'Your instructor reviews your assessment scores and identifies where you need help. You get extra practice time, tutoring, or modified assignments. The goal is to get you caught up, not to fail you out.' },
              { title: 'Personal barrier (transportation, childcare, housing)', desc: 'Our team connects you with supportive services — transportation assistance, childcare referrals, emergency resources. Many of these services are available through your WIOA case manager or community partners.' },
              { title: 'Need to pause', desc: 'If you need to take a break for a serious reason, we work with you and your funding source to pause and resume in the next cohort. You do not lose your progress.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cohort timeline example */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Example: 12-Week Skilled Trades Program Timeline</h2>
          <p className="text-gray-600 mb-6 text-sm">
            This is a real example of how a 12-week HVAC, Electrical, or Welding program flows
            from enrollment to employment.
          </p>

          <div className="space-y-3">
            {[
              { week: 'Before you start', activity: 'Eligibility screening, funding confirmation, enrollment paperwork, learning platform account setup, orientation', result: 'You are enrolled and funded. You know your start date, class schedule, and what to bring on day one.' },
              { week: 'Weeks 1–2', activity: 'Safety training, OSHA 10 certification, tool orientation, introduction to your trade', result: 'You earn your OSHA 10 card. You know how to safely operate tools and equipment.' },
              { week: 'Weeks 3–6', activity: 'Core technical training — classroom instruction plus hands-on lab work every day', result: 'You can perform basic installations, repairs, and diagnostics in your trade.' },
              { week: 'Weeks 7–10', activity: 'Advanced skills, complex projects, troubleshooting, certification exam prep', result: 'You can handle real-world job scenarios. You are scoring well on practice exams.' },
              { week: 'Weeks 11–12', activity: 'Certification exams, career services (resume, interview prep), employer introductions', result: 'You earn your industry credential. You have a resume and interview skills. You are meeting employers.' },
              { week: 'After graduation', activity: 'Job placement support, employer referrals, follow-up at 6 and 12 months', result: 'You are working in your field. We track your employment and wage to make sure the pathway delivered.' },
            ].map((r) => (
              <div key={r.week} className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{r.week}</h3>
                <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">What you do:</span> {r.activity}</p>
                <p className="text-sm text-gray-600"><span className="font-semibold">What you walk away with:</span> {r.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to See It for Yourself?</h2>
          <p className="text-lg text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            The best way to understand how training works is to start. Check your eligibility —
            it takes about 5 minutes. If you qualify for funding, your training can be free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition">
              Check Eligibility &amp; Apply
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
