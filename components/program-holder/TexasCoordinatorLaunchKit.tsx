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
      <div className="flex flex-wrap gap-3">
        <Link href="/program-holder/documents" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Open Approval & Document Packet</Link>
        <a href="https://www.twc.texas.gov/programs/texas-industry-partnership" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">Texas Industry Partnership</a>
        <a href="https://www.twc.texas.gov/programs/high-demand-job-training" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">High Demand Job Training</a>
      </div>
    </section>
  );
}
