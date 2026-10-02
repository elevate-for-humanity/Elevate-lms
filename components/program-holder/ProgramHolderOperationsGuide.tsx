import Link from 'next/link';

type Program = { title?: string | null; name?: string | null; slug?: string | null; estimated_weeks?: number | null; total_hours?: number | null; credential_name?: string | null };

export function ProgramHolderOperationsGuide({ holderName, programs, role }: { holderName?: string | null; programs: Program[]; role?: string | null }) {
  const names = programs.map((p) => p.title || p.name || p.slug).filter(Boolean) as string[];
  return (
    <section className="space-y-5" aria-labelledby="program-holder-operations-guide">
      <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Program Holder Operations Center</p>
        <h2 id="program-holder-operations-guide" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">How to run your assigned programs from application through completion</h2>
        <p className="mt-3 max-w-4xl leading-7 text-slate-700">{holderName || 'Program Holder'}, your responsibility is to keep every assigned participant moving. Contact applicants, document outcomes, guide funding candidates through required WorkOne steps, monitor onboarding and assignments, follow up before deadlines, intervene when a learner stalls, communicate through the portal, and document completion/closeout. Do not promise funding or change official program requirements.</p>
        {names.length ? <p className="mt-3 text-sm font-bold text-slate-900">Assigned programs: {names.join(' • ')}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-black">Your participant workflow</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
            <li><strong>New applicant:</strong> review the account, call or email promptly, confirm program interest, and record the contact outcome and next follow-up.</li>
            <li><strong>Funding route:</strong> when workforce funding applies, tell the applicant exactly what WorkOne step is required and follow up until the applicant reports the outcome. Never represent funding as guaranteed.</li>
            <li><strong>Approved/enrolled:</strong> verify onboarding, required documents, course access, schedule, start date, and any program-specific requirements.</li>
            <li><strong>Active student:</strong> check attendance, assignments, progress, barriers, instructor/site activity, credentials, and deadlines. Do not wait for the student to call you after falling behind.</li>
            <li><strong>Stalled or missing work:</strong> contact the student, document the issue, give a specific next action and due date, and escalate unresolved barriers to Elevate.</li>
            <li><strong>Completion:</strong> verify required coursework, hours/skills where applicable, credential or completion evidence, final records, and closeout before marking the account complete.</li>
          </ol>
        </article>
        <article className="rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-black">Weekly account-management routine</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-700">
            <li>Open Applicants and contact every person without a documented outcome or next follow-up.</li>
            <li>Review Students for missed assignments, low progress, attendance issues, incomplete onboarding, and upcoming deadlines.</li>
            <li>Review Hours and required verification when the assigned program tracks training/work hours.</li>
            <li>Check Documents and Compliance for missing or rejected records.</li>
            <li>Use the phone, email, messages, notes, and interactive office inside the dashboard so communication remains attached to the account.</li>
            <li>Escalate funding, access, compliance, instructor, employer/site, or technical problems instead of leaving the account idle.</li>
            <li>End every contact with a documented next action, responsible person, and date.</li>
          </ul>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-black">Student email templates</h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Template title="Initial applicant follow-up" text={`Subject: Next steps for your Elevate application

Hello [Student Name],

I am your Program Holder contact for [Program]. I am reviewing your application and want to make sure you know your next step.

Please reply with:
1. Have you completed your required WorkOne appointment or funding step, if applicable?
2. Did WorkOne give you any instructions or request documents?
3. Are you still planning to begin [Program]?
4. Is anything preventing you from moving forward?

Please reply by [date]. I will document your update and help route the next action.

Thank you,
[Program Holder Name]`} />
          <Template title="Progress check" text={`Subject: Progress check for [Program]

Hello [Student Name],

I am checking your progress in [Program]. Please reply with:
• What assignment/module are you currently working on?
• Are you caught up with your required work?
• Do you have a deadline you may miss?
• Are you having trouble accessing the course, instructor, worksite, or required materials?
• What do you need help with right now?

Please respond by [date] so we can address problems before you fall behind.

Thank you,
[Program Holder Name]`} />
          <Template title="Missing work / deadline" text={`Subject: Action needed for your [Program] account

Hello [Student Name],

Your account shows that [missing assignment/document/hours/action] still needs attention.

Your next action is: [specific action].
Please complete it by: [date].

If something is preventing you from completing it, reply to this email or contact me through the dashboard so we can document the barrier and determine the next step.

Thank you,
[Program Holder Name]`} />
          <Template title="WorkOne follow-up" text={`Subject: WorkOne follow-up needed for your training application

Hello [Student Name],

I am following up on the workforce-funding step for your [Program] application.

Please tell me:
• Did you attend/schedule your WorkOne appointment?
• What did your WorkOne representative tell you?
• Were you asked to submit additional documents?
• Were you given another appointment or deadline?

Funding is determined by the responsible workforce agency and is not guaranteed. I need your update so your Elevate account reflects the correct next step.

Thank you,
[Program Holder Name]`} />
        </div>
      </article>

      <article className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Your Digital Office</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">The portal is your office—not just a student list.</h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">Use the built-in tools so calls, follow-ups, meetings, support, and participant progress stay connected to the work. Do not move routine program operations into scattered personal texts, personal email threads, or undocumented calls when the portal provides the workflow.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <OfficeTool title="Phone & dialer" benefit="Call applicants and students from the Program Holder workspace, handle follow-up without exposing a personal number, and keep the communication tied to program operations." use="Use for first contact, missed-deadline outreach, WorkOne follow-up, urgent barriers, and scheduled check-ins." />
          <OfficeTool title="Email" benefit="Send professional written directions, progress questions, reminders, document requests, and next steps from the same operating environment." use="Use when the student needs instructions they can reread or when you need a documented follow-up." />
          <OfficeTool title="Video conferencing" benefit="Meet face-to-face without requiring the participant to travel for routine advising, orientation, progress coaching, or troubleshooting." use="Use for onboarding help, scheduled advising, progress meetings, and conversations that are easier to resolve live." />
          <OfficeTool title="Screen sharing" benefit="Show a participant where to click and see the problem they are describing instead of trying to diagnose a portal issue blindly over the phone." use="Use for portal navigation, course access, assignment location, document-upload guidance, and approved technical support. Do not expose unrelated private records while sharing." />
          <OfficeTool title="PWA / mobile access" benefit="Keeps the Program Holder workspace available from a phone like an app so applicants, alerts, communications, and account work are easier to manage away from a desk." use="Use for timely follow-up and mobile operations. The PWA is an access method to the real portal, not a separate or generic dashboard." />
          <OfficeTool title="Community" benefit="Creates a professional space for approved announcements, encouragement, program updates, resources, and appropriate peer connection without replacing the official student record." use="Use for group information that belongs to the program community. Keep private participant issues in authorized one-to-one records and communications." />
          <OfficeTool title="PARIS portal guidance" benefit="Helps explain where features, records, and next actions are located and can guide users through approved portal workflows." use="Use PARIS for navigation and approved information; the Program Holder still reviews the record and is responsible for official decisions and follow-up." />
          <OfficeTool title="Notes, tasks & communication history" benefit="Creates continuity. The next person reviewing an account can see what happened, what was promised, what is missing, and when the next action is due." use="After meaningful contact, record the outcome, barrier, next action, responsible person, and follow-up date." />
          <OfficeTool title="Participant progress workspace" benefit="Brings applications, enrollment, assignments, hours where applicable, documents, compliance, and completion activity into one operating view." use="Use it as the source for your weekly account review instead of relying on memory or waiting for students to report problems." />
        </div>
      </article>

      <article className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-xl font-black text-blue-950">Use the communication tools inside your office</h3>
        <p className="mt-3 text-sm leading-6 text-blue-950">Use the dashboard phone/dialer for participant calls, Email for written follow-up, Messages for portal communication, and notes/tasks to record the outcome. When screen sharing or video support is appropriate, launch it from the participant interaction area. PARIS may explain where tools and records are located, but the Program Holder remains responsible for reviewing the participant record, communicating accurately, and documenting the action.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/program-holder/students/pending" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">Open Applicants</Link>
          <Link href="/program-holder/students" className="rounded-xl border border-blue-700 bg-white px-5 py-3 text-sm font-black text-blue-950">Open Students</Link>
          <Link href="/program-holder/documents" className="rounded-xl border border-blue-700 bg-white px-5 py-3 text-sm font-black text-blue-950">Documents</Link>
          <Link href="/program-holder/reports" className="rounded-xl border border-blue-700 bg-white px-5 py-3 text-sm font-black text-blue-950">Reports</Link>
        </div>
      </article>
    </section>
  );
}

function OfficeTool({ title, benefit, use }: { title: string; benefit: string; use: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h4 className="font-black text-slate-950">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-700">{benefit}</p><p className="mt-3 text-sm leading-6 text-slate-700"><strong>When to use it:</strong> {use}</p></div>;
}

function Template({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl bg-slate-50 p-4"><h4 className="font-black text-slate-950">{title}</h4><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{text}</pre></div>;
}
