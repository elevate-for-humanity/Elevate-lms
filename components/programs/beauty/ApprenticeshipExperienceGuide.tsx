import Link from 'next/link';
import { BriefcaseBusiness, Handshake, UserCheck } from 'lucide-react';
import { MobileDisclosure } from '@/components/ui/MobileDisclosure';

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

export default function ApprenticeshipExperienceGuide({ programTitle = 'Apprenticeship', applyHref }: { programTitle?: string; applyHref: string }) {
  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-8 sm:py-12" aria-labelledby="apprenticeship-journey-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">Start to finish</p>
        <h2 id="apprenticeship-journey-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">How {programTitle} works.</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">Paid workplace learning, related instruction and documented progress. Open a step for details.</p>
        <ol className="mt-5 grid items-start gap-3 md:grid-cols-2">
          {STEPS.map(([number, title, body]) => <li key={number}><MobileDisclosure title={`${number}. ${title}`}><p>{body}</p></MobileDisclosure></li>)}
        </ol>
        <div className="mt-6 grid items-start gap-3 lg:grid-cols-3">
          <MobileDisclosure title="Your responsibilities" icon={<UserCheck className="h-6 w-6" />}>
            <ul className="list-disc space-y-2 pl-5"><li>Attend work and required instruction.</li><li>Clock in and out accurately.</li><li>Complete documents, assignments, and competencies.</li><li>Communicate absences and changes promptly.</li><li>Follow workplace, safety, and program rules.</li></ul>
          </MobileDisclosure>
          <MobileDisclosure title="Host Shop responsibilities" icon={<BriefcaseBusiness className="h-6 w-6" />}>
            <ul className="list-disc space-y-2 pl-5"><li>Provide qualifying supervised employment.</li><li>Maintain the approved compensation arrangement.</li><li>Review hours, attendance, and work processes.</li><li>Verify competencies and workplace progress.</li><li>Maintain required licensing, safety, and records.</li></ul>
          </MobileDisclosure>
          <MobileDisclosure title="Elevate responsibilities" icon={<Handshake className="h-6 w-6" />}>
            <ul className="list-disc space-y-2 pl-5"><li>Enrollment and apprenticeship administration.</li><li>Related Technical Instruction and progress records.</li><li>Host Shop coordination and compliance support.</li><li>Program monitoring, documentation, and completion records.</li><li>Guidance on the next licensing or credential step.</li></ul>
          </MobileDisclosure>
        </div>
        {/* Material cost and placement disclosures stay visible at every size. */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="text-lg font-bold text-slate-950">Wages and tuition are separate.</h3><p className="mt-2 text-sm leading-6 text-slate-700">The employing Host Shop pays wages. Tuition and instruction costs require self-pay, approved funding or another authorized arrangement. Earn while you learn does not automatically mean free training.</p></article>
          <article className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><h3 className="text-lg font-bold text-slate-950">Placement is not guaranteed.</h3><p className="mt-2 text-sm leading-6 text-slate-700">Apply for an approved shop with capacity, suggest a business for review, or join the geographic waitlist. A listing does not promise employment; placement must be confirmed during enrollment.</p></article>
        </div>
        <div className="mt-7">
          <h3 className="text-xl font-bold text-slate-950">Questions before you enroll</h3>
          <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {FAQ.map(([question, answer]) => <details key={question} className="p-4 sm:p-5"><summary className="min-h-11 cursor-pointer font-bold text-slate-950">{question}</summary><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{answer}</p></details>)}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={applyHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-red-700">Apply for Apprenticeship</Link>
          <Link href="/contact?topic=apprenticeship" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-950 hover:bg-slate-50">Ask an enrollment question</Link>
        </div>
      </div>
    </section>
  );
}
