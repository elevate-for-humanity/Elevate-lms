import Link from 'next/link';
import { ResponsiveDetails } from '@/components/ui/ResponsiveDetails';

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

const RESPONSIBILITIES = [
  { title: 'Your responsibilities', items: ['Attend work and required instruction.', 'Clock in and out accurately.', 'Complete documents, assignments, and competencies.', 'Communicate absences and changes promptly.', 'Follow workplace, safety, and program rules.'] },
  { title: 'Host Shop responsibilities', items: ['Provide qualifying supervised employment.', 'Maintain the approved compensation arrangement.', 'Review hours, attendance, and work processes.', 'Verify competencies and workplace progress.', 'Maintain required licensing, safety, and records.'] },
  { title: 'Elevate responsibilities', items: ['Enrollment and apprenticeship administration.', 'Related Technical Instruction and progress records.', 'Host Shop coordination and compliance support.', 'Program monitoring, documentation, and completion records.', 'Guidance on the next licensing or credential step.'] },
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

export default function ApprenticeshipExperienceGuide({ programTitle = 'Apprenticeship', applyHref }: { programTitle?: string; applyHref: string }) {
  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-8 sm:py-12" aria-labelledby="apprenticeship-journey-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="apprenticeship-journey-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">How the {programTitle} works</h2>
        <p className="mt-3 max-w-3xl text-base leading-6 text-slate-700">Combine approved employment, supervised practice and technical instruction. Track your progress toward completion.</p>
        <ResponsiveDetails title="Your 10 enrollment and completion steps" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <ol className="grid gap-4 md:grid-cols-2">
            {STEPS.map(([number, title, body]) => (
              <li key={number} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{number}</span>
                <div><h4 className="font-bold text-slate-950">{title}</h4><p className="mt-1 text-sm leading-6 text-slate-700">{body}</p></div>
              </li>
            ))}
          </ol>
        </ResponsiveDetails>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {RESPONSIBILITIES.map(({ title, items }) => (
            <ResponsiveDetails key={title} title={title} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">{items.map((item) => <li key={item}>{item}</li>)}</ul>
            </ResponsiveDetails>
          ))}
        </div>
        {/* These material enrollment notices remain visible, including on mobile. */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-950">Wages and tuition are separate.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">The employing Host Shop pays your compensation. Tuition and related instruction costs are separate; self-pay or approved funding arrangements must be confirmed. Paid apprenticeship does not mean all training is free.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-950">Placement must be confirmed.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">A listing does not guarantee employment or placement. Shop capacity and approval must be confirmed. You can suggest a licensed shop for review or join the placement waitlist.</p>
          </article>
        </div>
        <div className="mt-7">
          <h3 className="text-xl font-bold text-slate-950">Before you enroll</h3>
          <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {FAQ.map(([question, answer]) => (
              <details key={question} className="group px-4 py-3 sm:px-5">
                <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-700">{question}</summary>
                <p className="mb-2 mt-2 max-w-4xl text-sm leading-6 text-slate-700">{answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={applyHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-red-700">Apply for Apprenticeship</Link>
          <Link href="/contact?topic=apprenticeship" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">Ask an Enrollment Question</Link>
        </div>
      </div>
    </section>
  );
}
