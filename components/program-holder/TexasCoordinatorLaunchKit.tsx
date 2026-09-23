import Link from 'next/link';

export function TexasCoordinatorLaunchKit() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Texas State Launch Playbook</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Amir: start here before making Texas commitments.</h2>
        <p className="mt-3 max-w-4xl leading-7 text-slate-700">Your role is to build relationships, document opportunities, recruit qualified employers, and bring proposed partnerships back to Elevate for sponsor approval. Do not promise funding, participant eligibility, grant awards, or changes to registered apprenticeship standards.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Fastest launch sequence</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
            <li>Begin in Austin with Texas Workforce Commission, ApprenticeshipTexas, and Workforce Solutions Capital Area.</li>
            <li>Present Elevate as an existing U.S. Department of Labor Registered Apprenticeship sponsor. Ask what Texas information is required to place each applicable RAP on the statewide ETPL.</li>
            <li>Ask the local Board for its current ITA limits, OJT reimbursement rules, supportive-service rules, target occupations, and employer-services contact.</li>
            <li>Build 10–20 employer prospects in high-demand occupations. Do not activate an employer as an apprenticeship site without Elevate sponsor approval.</li>
            <li>Get written employer interest, hiring needs, occupation, wage range, training need, apprentice capacity, and supervisor/mentor availability.</li>
            <li>Match the project to the correct funding lane. Submit the opportunity and supporting documents to Elevate before representing it as approved.</li>
            <li>After Austin is repeatable, expand along I-35 to San Antonio, then Dallas–Fort Worth and Houston.</li>
          </ol>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Funding in plain English</h3>
          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
            <p><strong>WIOA / ETPL:</strong> Registered Apprenticeship programs are automatically eligible for Texas ETPL inclusion, but the sponsor still supplies required program information to TWC. Listing does not guarantee participant funding.</p>
            <p><strong>Texas Industry Partnership:</strong> Find an industry partner with a real workforce need and a local Workforce Board willing to collaborate. WIOA funding can reach $150,000 and requires dollar-for-dollar leveraged funds from the industry partner.</p>
            <p><strong>High Demand Job Training:</strong> A local Board partners with an eligible economic-development corporation. TWC can provide up to $150,000 matched dollar-for-dollar by local economic-development sales-tax funds.</p>
            <p><strong>Other grants:</strong> Treat every published ceiling as a maximum opportunity, never as money Elevate already has. Confirm the current solicitation, eligible applicant, match, population, deliverables, and application window before proceeding.</p>
          </div>
        </article>
      </div>
      <article className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
        <h3 className="text-xl font-black text-amber-950">What to take into every meeting</h3>
        <p className="mt-2 text-sm leading-6 text-amber-950">Bring Elevate's current approval/credential packet from the dashboard Documents area, the applicable DOL Registered Apprenticeship program information, program description, occupation, RTI/OJL structure, employer requirements, credential outcome, proposed training cost, and contact information. Never claim a Texas approval, ETPL listing, grant award, or funding authorization unless that exact approval is documented.</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black">Board meeting letter — ready to print</h3>
        <div className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-800">{`Dear Workforce Development Leadership,

My name is Amir Naseen, and I serve as the Texas State Site Coordinator for Elevate for Humanity. I am reaching out on behalf of Elizabeth Greene and Elevate's workforce and Registered Apprenticeship initiatives.

Elevate is developing employer partnerships in Texas and would like to coordinate with your Board before launching participant activity in your workforce area. Our goal is to understand your current high-demand occupations, employer needs, WIOA training policies, Individual Training Account limits, OJT opportunities, supportive services, and the process for coordinating eligible Registered Apprenticeship programs.

I would appreciate a meeting with your Business Solutions, Employer Services, or workforce training leadership team. We are specifically interested in building employer-driven pipelines that lead to employment, recognized credentials, and documented apprenticeship outcomes.

At this stage, I am requesting coordination and information. I am not representing that any participant, employer, program, or project has already been approved for Board or state funding.

Thank you for the opportunity to coordinate. I look forward to learning your local priorities and identifying where Elevate can support Texas employers and job seekers.

Sincerely,
Amir Naseen
Texas State Site Coordinator
Elevate for Humanity
346-295-4481
topacesolutions@gmail.com`}</div>
      </article>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Your first 30 days</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Days 1–3: introduce yourself to ApprenticeshipTexas/TWC and Workforce Solutions Capital Area; request employer-services and apprenticeship meetings.</li>
            <li>Days 1–7: obtain the local ITA cap, OJT policy, ETPL/RAP procedure, supportive-service rules, target occupations, grant contacts, and current employer priorities in writing.</li>
            <li>Week 2: build at least 20 qualified employer prospects across HVAC/skilled trades, healthcare, transportation/logistics, and other approved occupations.</li>
            <li>Week 2–3: hold employer discovery meetings. Capture vacancies, wages, minimum qualifications, supervisors, apprentice capacity, worksite, and hiring timeline.</li>
            <li>Week 3: identify the best first employer cohort and submit the employer/workforce documentation to Elevate for sponsor review.</li>
            <li>Week 4: schedule the San Antonio workforce-board introduction while continuing Austin employer development. Do not abandon Austin before the first pipeline is repeatable.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Questions to ask every Workforce Board</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>What is your current ITA tuition cap and maximum training duration?</li>
            <li>How does your Board fund DOL Registered Apprenticeship RTI?</li>
            <li>What OJT reimbursement percentage and duration do you currently authorize?</li>
            <li>Which occupations and industries are priorities right now?</li>
            <li>Which participant populations are you actively trying to serve?</li>
            <li>What supportive services can eligible participants receive?</li>
            <li>What documentation must Elevate and the employer submit before training or work begins?</li>
            <li>Who owns employer services, apprenticeship, ETPL, WIOA training authorization, and grants?</li>
            <li>Are there current Texas Industry Partnership, High Demand Job Training, Skills Development, or other funding opportunities relevant to this project?</li>
            <li>What is the next concrete step, responsible person, and deadline?</li>
          </ul>
        </article>
      </div>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black">Employer meeting script</h3>
        <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-800">{`I represent Elevate for Humanity's Texas workforce expansion. Elevate operates workforce training and Registered Apprenticeship initiatives. I am here to learn your hiring problem first — not sell you a promise.

Which positions are hardest to fill? How many people do you expect to hire? What starting wage do you pay? What skills must a new hire have on day one? Who can supervise structured on-the-job learning? Would you consider developing qualified candidates through a registered apprenticeship or workforce-supported training model?

I will document the opportunity and take it through Elevate's sponsor review. Any workforce reimbursement, grant, participant eligibility, or apprenticeship approval must be confirmed before we represent it as available.`}</p>
      </article>
      <article className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-xl font-black text-red-950">Authority: what you may and may not do</h3>
        <div className="mt-4 grid gap-5 md:grid-cols-2 text-sm leading-6 text-red-950"><div><p className="font-black">You MAY</p><p>Represent Elevate in introductory meetings; distribute approved materials; gather requirements; recruit employer prospects; request meetings; collect letters of interest; document workforce opportunities; coordinate follow-ups; and submit proposed partnerships for sponsor review.</p></div><div><p className="font-black">You MAY NOT</p><p>Sign contracts for Elizabeth or Elevate unless separately authorized in writing; promise grant/WIOA money; guarantee enrollment or placement; change tuition; change apprenticeship standards; activate an employer as a RAP site; represent a pending Texas registration as approved; or share protected participant data outside authorized systems.</p></div></div>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black">End every meeting with these five things</h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">1) named decision-maker, 2) exact next action, 3) documents they need from Elevate, 4) documents/commitment we need from them, and 5) a follow-up date. Enter all five in the dashboard the same day. A meeting without a next action is not a completed outreach task.</p>
      </article>
      <div className="flex flex-wrap gap-3">
        <Link href="/program-holder/documents" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Open Approval & Document Packet</Link>
        <a href="https://www.twc.texas.gov/programs/texas-industry-partnership" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">Texas Industry Partnership</a>
        <a href="https://www.twc.texas.gov/programs/high-demand-job-training" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">High Demand Job Training</a>
      </div>
    </section>
  );
}
