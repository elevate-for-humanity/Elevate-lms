import Link from 'next/link';
import { BadgeDollarSign, BookOpenCheck, BriefcaseBusiness, CheckCircle2, ClipboardList, FileCheck2, GraduationCap, Handshake, MapPinned, UserCheck } from 'lucide-react';

const STEPS = [
  ['1', 'Apply', 'Submit the apprenticeship application and select the occupation you want to pursue.'],
  ['2', 'Eligibility & documents', 'Complete required identity, eligibility, enrollment, and program documents.'],
  ['3', 'Funding or tuition plan', 'Confirm how Related Technical Instruction and other training costs will be paid before enrollment is finalized.'],
  ['4', 'Host Shop placement', 'Use an approved Host Shop, bring a qualifying employer for review, or join the placement waitlist.'],
  ['5', 'Employment & agreements', 'The employment, supervision, wage arrangement, and apprenticeship agreements must be confirmed before approved OJL begins.'],
  ['6', 'Begin RTI + paid OJL', 'Complete Related Technical Instruction while building skills through supervised on-the-job learning with the employer.'],
  ['7', 'Track hours & competencies', 'Clock in and out, complete assigned work processes, and maintain accurate progress records.'],
  ['8', 'Host verifies progress', 'The Host Shop reviews hours, supervision, attendance, and required competencies.'],
  ['9', 'Complete program requirements', 'Finish the registered program requirements, required instruction, work processes, and completion documentation.'],
  ['10', 'Licensing / credential next steps', 'Complete any separate state examination, licensing, credential, or post-completion steps required for the occupation.'],
] as const;

const FAQ = [
  ['Do I need a Host Shop before I apply?', 'No. You can apply first. If you already know a qualifying shop, you can suggest it for review. If no approved shop is available near you, you can join the placement waitlist.'],
  ['Does a public Host Shop listing guarantee an opening?', 'No. A listing shows that the business participates in the network. Placement and current capacity must be confirmed during enrollment.'],
  ['Who pays my wages?', 'The employing Host Shop is responsible for the apprentice compensation arrangement. Elevate administers the apprenticeship and training components; it is not automatically the apprentice employer.'],
  ['Why is there tuition if this is earn-while-you-learn?', 'Wages and training costs are separate. Apprentices may earn wages from their employer while tuition or RTI costs are paid through self-pay, an approved funding source, or another authorized arrangement.'],
  ['Can I bring my own shop?', 'Yes, but the business must complete the Host Shop review and meet the applicable licensing, supervision, employment, documentation, safety, and program requirements before apprenticeship hours are approved there.'],
  ['What are OJL and RTI?', 'OJL means supervised on-the-job learning. RTI means Related Technical Instruction: the structured technical instruction that supports the occupation.'],
  ['Do my hours count as soon as I start working?', 'Only approved apprenticeship hours count. The Host Shop, employment relationship, supervision, program enrollment, and required agreements must be in place.'],
  ['What happens if I forget to clock out or an hour entry is wrong?', 'Use the dashboard correction process and provide the information needed for review. Host Shop approval may be required before corrected hours are accepted.'],
  ['Does completing the apprenticeship automatically give me a state license?', 'Not necessarily. Registered apprenticeship completion and state licensing are related but separate requirements. The page for your occupation explains the applicable licensing pathway.'],
] as const;

export default function ApprenticeshipExperienceGuide({
  programTitle = 'Apprenticeship',
  applyHref,
}: {
  programTitle?: string;
  applyHref: string;
}) {
  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:py-18" aria-labelledby="apprenticeship-journey-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">Start to finish</p>
          <h2 id="apprenticeship-journey-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            How the {programTitle} works.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg">
            Apprenticeship is more than taking classes. It combines approved employment, supervised workplace learning, Related Technical Instruction, documented competencies, and completion requirements.
          </p>
        </div>

        <ol className="mt-9 grid gap-4 md:grid-cols-2">
          {STEPS.map(([number, title, body]) => (
            <li key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-900 text-sm font-black text-white">{number}</span>
                <div>
                  <h3 className="text-lg font-black text-slate-950">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-700">{body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <UserCheck className="h-7 w-7 text-brand-red-700" />
            <h3 className="mt-3 text-xl font-black text-slate-950">Your responsibilities</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              <li>Attend work and required instruction.</li>
              <li>Clock in and out accurately.</li>
              <li>Complete documents, assignments, and competencies.</li>
              <li>Communicate absences and changes promptly.</li>
              <li>Follow workplace, safety, and program rules.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <BriefcaseBusiness className="h-7 w-7 text-brand-blue-800" />
            <h3 className="mt-3 text-xl font-black text-slate-950">Host Shop responsibilities</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              <li>Provide qualifying supervised employment.</li>
              <li>Maintain the approved compensation arrangement.</li>
              <li>Review hours, attendance, and work processes.</li>
              <li>Verify competencies and workplace progress.</li>
              <li>Maintain required licensing, safety, and records.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <Handshake className="h-7 w-7 text-emerald-700" />
            <h3 className="mt-3 text-xl font-black text-slate-950">Elevate responsibilities</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              <li>Enrollment and apprenticeship administration.</li>
              <li>Related Technical Instruction and progress records.</li>
              <li>Host Shop coordination and compliance support.</li>
              <li>Program monitoring, documentation, and completion records.</li>
              <li>Guidance on the next licensing or credential step.</li>
            </ul>
          </article>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
            <BadgeDollarSign className="h-7 w-7 text-amber-800" />
            <h3 className="mt-3 text-2xl font-black text-slate-950">Wages and tuition are separate.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Apprentices may earn compensation from the employing Host Shop while tuition or RTI costs are handled separately through self-pay, an approved workforce funding source, or another authorized payment arrangement. “Earn while you learn” does not mean every training cost is automatically free.
            </p>
          </article>
          <article className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-7">
            <MapPinned className="h-7 w-7 text-brand-blue-800" />
            <h3 className="mt-3 text-2xl font-black text-slate-950">Placement is a process, not a promise.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              You may train at an approved Host Shop with confirmed capacity, suggest a licensed business for review, or join the geographic waitlist. No public listing should be interpreted as a guaranteed job or immediate placement.
            </p>
          </article>
        </div>

        <div className="mt-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">Common questions</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Know what happens before you enroll.</h3>
          </div>
          <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {FAQ.map(([question, answer]) => (
              <details key={question} className="group p-5 sm:p-6">
                <summary className="cursor-pointer list-none font-black text-slate-950">{question}</summary>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href={applyHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3.5 text-sm font-black text-white hover:bg-brand-red-700">
            Apply for Apprenticeship
          </Link>
          <Link href="/contact?topic=apprenticeship" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-800 bg-white px-7 py-3.5 text-sm font-black text-brand-blue-900 hover:bg-sky-50">
            Ask an Enrollment Question
          </Link>
        </div>
      </div>
    </section>
  );
}
