import Image from 'next/image';
import Link from 'next/link';

type Props = {
  name: string;
  phone?: string | null;
  email?: string | null;
  agreementSigned: boolean;
  programCount: number;
};

const contacts = [
  {
    name: 'WorkOne Gary',
    purpose: 'Visit for local intake, WIOA case management, employer services, and referrals.',
    phone: '(219) 981-1520',
    email: null,
    address: '504 Broadway, 4th Floor, Gary, IN 46402',
    source: 'https://www.in.gov/dwd/workonenwi/locations',
  },
  {
    name: 'WorkOne Northwest Indiana Business Services',
    purpose: 'Request an employer services meeting and ask about OJT, hiring needs, and current local training policies.',
    phone: '(219) 248-7488',
    email: 'employersolutions@gotoworkonenw.com',
    address: 'Region 1 employer services',
    source: 'https://www.in.gov/dwd/workonenwi/employers/',
  },
  {
    name: 'Northwest Indiana Workforce Board',
    purpose: 'Ask for the Region 1 training, business services, and apprenticeship contacts and current local plan.',
    phone: '(219) 462-2940',
    email: null,
    address: 'Center of Workforce Innovations, 504 Broadway, 4th Floor, Gary',
    source: 'https://www.in.gov/dwd/workonenwi/nwi-workforce-board/',
  },
  {
    name: 'Indiana INTraining / ETP team',
    purpose: 'Confirm provider and each program/location listing and the process to qualify for WIOA ITAs.',
    phone: null,
    email: 'INTraining@dwd.in.gov',
    address: 'Indiana Department of Workforce Development',
    source: 'https://www.in.gov/dwd/career-training-adult-ed/intraining/',
  },
  {
    name: 'Workforce Ready Grant provider team',
    purpose: 'Ask whether an approved Indiana program and provider may apply for this separate grant.',
    phone: null,
    email: 'wrg@dwd.in.gov',
    address: 'Indiana Department of Workforce Development',
    source: 'https://www.in.gov/dwd/nextleveljobs/employer/training-providers/',
  },
  {
    name: 'Indiana work-based learning office',
    purpose: 'Ask about Indiana apprenticeship and employer site coordination.',
    phone: null,
    email: 'wbl@dwd.in.gov',
    address: 'Indiana Department of Workforce Development',
    source: 'https://www.in.gov/dwd/owbla/',
  },
];

export function GaryCoordinatorLaunchKit({ name, phone, email, agreementSigned, programCount }: Props) {
  const signature = [name, 'Gary Regional Site Coordinator', 'Elevate for Humanity', phone, email]
    .filter(Boolean).join('\n');

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 pb-16 sm:p-8">
      <section className="relative min-h-64 overflow-hidden rounded-3xl bg-slate-950 text-white">
        <Image src="/images/pages/community-page-2.webp" alt="Elevate workforce community" fill priority sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950/90 to-slate-950/30" />
        <div className="relative max-w-3xl p-5 sm:p-9">
          <p className="text-xs font-black uppercase tracking-widest text-blue-200">Gary, Indiana · Site coordinator training</p>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">Your step-by-step launch guide</h1>
          <p className="mt-3 text-sm leading-6 sm:text-base">Use this guide to build approved training sites, meet the Region 1 workforce team, recruit employers, and document every participant outcome. Program details and account amounts in the portal come from current records; local funding and wages require confirmation.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">What a site coordinator does</h2>
          <p className="mt-3 text-sm leading-6">You represent Elevate for introductory outreach in the assigned Gary area. Identify local employers and qualified training organizations, arrange meetings, gather requirements, and submit each proposed Program Holder and delivery site for Elevate approval. Record contacts, notes, next steps, and learner progress in the dashboard. You do not independently approve a holder, enroll a funded student, sign for Elevate, promise a grant, or change apprenticeship standards.</p>
        </article>
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">What a Program Holder does</h2>
          <p className="mt-3 text-sm leading-6">A Program Holder is the approved local provider responsible for delivering its assigned program: qualified instructor and site, schedule, supervision, attendance and training hours, learner safety, required documents, assessments, progress reports, and completion evidence. Different programs may require different holders, licenses, instructors, employer sites, and course assignments. Your regional view of {programCount} pathways is a recruiting and coordination scope; it does not authorize your organization to teach every pathway.</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Email draft: Workforce Ready Grant</h2>
          <p className="mt-1 text-xs">To: wrg@dwd.in.gov · Subject: Gary certificate provider eligibility and application steps</p>
          <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">{`Hello Workforce Ready Grant team,

I coordinate proposed Gary-area training partnerships for Elevate for Humanity. We are first confirming Indiana ETPL status for the exact provider, program, and delivery location. Which of our proposed certificate pathways might qualify for Workforce Ready Grant review, and what is the current provider application process, evidence, and timeline?

Please direct us to the current qualifying program list and the appropriate reviewer. We will not represent any program as grant funded until DWD approves it in writing.

Thank you,
${signature}`}</div>
        </article>
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Email draft: apprenticeship coordination</h2>
          <p className="mt-1 text-xs">To: wbl@dwd.in.gov · Subject: Gary employer apprenticeship site coordination</p>
          <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">{`Hello Indiana Work-Based Learning and Apprenticeship team,

I am a Gary Regional Site Coordinator with Elevate for Humanity. We are recruiting qualified local employers and training providers and want to coordinate correctly with Indiana before proposing apprenticeship delivery sites.

Could you identify the regional contact, the required employer/site and mentor information, and the steps for coordinating an existing sponsor's programs in Indiana? We can share our current sponsor and occupation documents for review. We will submit each employer and site for sponsor approval before representing it as active.

Thank you,
${signature}`}</div>
        </article>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-black">Start in this order</h2>
        <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-6">
          <li><strong>Finish your account setup.</strong> Open <Link className="text-blue-700 underline" href="/program-holder/compliance">Compliance</Link>, sign the MOU, acknowledge the handbook and confidentiality documents, upload ID/business registration/insurance/W-9, and complete the profile. Use <Link className="text-blue-700 underline" href="/program-holder/payouts">Payouts</Link> to request the secure provider invitation. Enter banking details only on the provider’s verified setup page; contact Elevate if the invitation is unavailable.</li>
          <li><strong>Learn the program catalog.</strong> Open <Link className="text-blue-700 underline" href="/program-holder/programs">My Programs</Link>. Read the description, credential, hours, published price, estimated career pay, funding indicator, and course assignment for each pathway. Prioritize two or three that match actual Gary employers. An internal WIOA flag or an approval in another state does not establish Indiana ETPL status.</li>
          <li><strong>Call WorkOne Gary.</strong> Introduce yourself as a site coordinator, ask for a Business Services Representative and a WIOA training/ETPL contact, and request a meeting. Bring Elevate’s current sponsor and program documents from <Link className="text-blue-700 underline" href="/program-holder/documents">Documents</Link>. Ask which occupations Region 1 prioritizes, ITA limits, OJT rules, supportive services, approval steps, and whether each exact provider/program/location is on Indiana INTraining’s ETP list.</li>
          <li><strong>Recruit one holder per actual delivery need.</strong> For each target pathway, find a qualified school, licensed professional, training business, or employer with a real site and instructor. Record organization, contact, credential/license, capacity, equipment, schedule, employer demand, and proposed cost. Send the candidate to Elevate for review; do not promise an assignment or payment.</li>
          <li><strong>Build employer demand.</strong> Ask employers for occupation, openings, wage range, worksite, mentor/supervisor, apprentice capacity, and hiring timetable. WorkOne can discuss recruitment, OJT, and other services. Get a written expression of interest and submit it for Elevate sponsor review before naming a registered apprenticeship site.</li>
          <li><strong>Only then route learners.</strong> Use <Link className="text-blue-700 underline" href="/program-holder/students/pending">Applicants</Link> to call, log outcome and follow-up, and refer each person to WorkOne for individual eligibility. Funding is a case-manager decision for the participant and the approved program. Keep applicant data in the portal.</li>
          <li><strong>Run weekly operations.</strong> Review <Link className="text-blue-700 underline" href="/program-holder/students">Students</Link>, <Link className="text-blue-700 underline" href="/program-holder/hours">Hours</Link>, and <Link className="text-blue-700 underline" href="/program-holder/reports">Reports</Link>. Confirm attendance, supervisor verification, skills, barriers, credentials, and next steps; escalate missing records. Close each meeting with an owner and a date.</li>
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Funding and earnings: read this before quoting numbers</h2>
          <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-6">
            <li><strong>WIOA Individual Training Accounts:</strong> the exact Indiana provider and program must qualify on the ETP list; WorkOne determines an individual’s eligibility and available funds. A catalog funding flag is a lead to verify, not approval.</li>
            <li><strong>Workforce Ready Grant:</strong> this is a separate Indiana approval for qualifying certificate programs and approved providers. Ask the state provider team before advertising it.</li>
            <li><strong>Employer OJT:</strong> WorkOne may reimburse an eligible employer for qualifying training wages under its agreement. Ask Business Services for current terms before hiring or promising reimbursement.</li>
            <li><strong>Student cost and career wages:</strong> each program card shows the current published price and any career salary estimate on file. Salary is an estimate, not a job offer or guaranteed Gary wage. If no written funding determination exists, explain the self-pay option and refer financing questions to Admissions.</li>
            <li><strong>Your compensation:</strong> {agreementSigned ? 'Review your signed coordinator MOU and the Payouts page for your actual terms and earned milestones.' : 'Your MOU is not signed. Review the proposed terms with Elevate before representing any amount as earned.'} No lead or unverified enrollment guarantees a payout.</li>
          </ul>
        </article>
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Use the phone, video, and payout tools</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6">
            <li>Open <Link className="text-blue-700 underline" href="/program-holder/phone">Phone</Link>, review the assigned extension and main line, choose availability and ring mode, then connect the browser phone. Allow microphone access only when prompted for a call. Keep the PWA open and online while expecting calls; use the inbox for missed calls and callbacks.</li>
            <li>Open <Link className="text-blue-700 underline" href="/program-holder/meetings">Meetings</Link>. Video is offered only when the meeting service says it is ready. Create a room for an applicant with a portal account, join it, test camera/microphone, and use the in-room share control on a supported browser. If video is unavailable, schedule phone or in-person and ask Elevate to activate the service.</li>
            <li>Open <Link className="text-blue-700 underline" href="/program-holder/payouts">Payouts</Link>. Complete documents and agreement first. Use the secure payment-provider invitation to enter banking information; never put routing/account numbers in messages, documents, or this dashboard. Confirm status after provider verification.</li>
          </ol>
        </article>
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-7">
        <h2 className="text-xl font-black">Who to call and email</h2>
        <p className="mt-2 text-sm text-slate-600">These are official published contact channels. Call first to confirm the right person and current procedure; record the name and follow-up in the portal.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <article key={contact.name} className="rounded-xl border border-slate-200 p-4 text-sm">
              <h3 className="font-black">{contact.name}</h3>
              <p className="mt-1 text-slate-600">{contact.purpose}</p>
              <p className="mt-2">{contact.address}</p>
              {contact.phone && <p>Call: <a className="text-blue-700 underline" href={`tel:${contact.phone.replace(/\D/g, '')}`}>{contact.phone}</a></p>}
              {contact.email && <p className="break-all">Email: <a className="text-blue-700 underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
              <a className="mt-2 inline-block text-xs text-blue-700 underline" href={contact.source} target="_blank" rel="noreferrer">Official source</a>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Email draft: WorkOne employer services</h2>
          <p className="mt-1 text-xs">To: employersolutions@gotoworkonenw.com · Subject: Gary training and employer partnership meeting</p>
          <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">{`Hello WorkOne Northwest Indiana Business Services,

I am ${name}, a Gary Regional Site Coordinator with Elevate for Humanity. We are mapping local employer demand and qualified program delivery sites in Gary and would like a meeting with your Business Services and WIOA training colleagues.

Could you share the current Region 1 priority occupations, employer OJT process, ITA policies, training provider/ETP requirements, and the best contact for each? We can bring our current sponsor and program documents and a shortlist of proposed training pathways. We will confirm each program's Indiana approval and each participant's eligibility before discussing funding as available.

Please suggest a meeting time and any materials we should send ahead.

Thank you,
${signature}`}</div>
        </article>
        <article className="rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Email draft: Indiana provider approval</h2>
          <p className="mt-1 text-xs">To: INTraining@dwd.in.gov · Subject: Indiana ETPL review for Gary program locations</p>
          <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">{`Hello INTraining team,

I coordinate proposed Gary-area training partnerships for Elevate for Humanity. We want to verify the status of each exact provider, program, and Indiana delivery location before describing any training as WIOA eligible.

Please advise how to search or apply in INTraining, what documents and performance data are required, how Registered Apprenticeship programs are handled, and who can review our proposed Gary locations. We can provide program outlines, credentials, costs, delivery partners, and sponsor documents for your review.

We are requesting guidance and are not claiming Indiana ETPL approval or a funding award.

Thank you,
${signature}`}</div>
        </article>
      </section>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-7">
        <h2 className="text-xl font-black">August 2026 flooding: a separate assistance lane</h2>
        <p className="mt-2 text-sm leading-6">Lake County is included in Indiana’s August disaster declaration. People whose work or self-employment was directly interrupted by the storms may ask WorkOne about reemployment and training and DWD about Disaster Unemployment Assistance. DUA is an individual benefit, not an Elevate training grant. DWD’s published application deadline is October 27, 2026; applicants first file regular unemployment and follow DWD’s DUA instructions. Call 1-800-891-6499 for DUA help. Do not collect Social Security numbers or disaster claim documents in coordinator outreach.</p>
        <a className="mt-3 inline-block text-sm font-bold text-blue-800 underline" href="https://www.in.gov/dwd/indiana-unemployment/individuals/dua/" target="_blank" rel="noreferrer">Current DWD disaster assistance instructions</a>
      </section>
    </main>
  );
}
