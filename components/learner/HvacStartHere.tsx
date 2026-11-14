import Link from 'next/link';

/** Always available alongside the HVAC orientation; no course or approval gate. */
export default function HvacStartHere({ studyCode = null }: { studyCode?: string | null }) {
  const steps = [
    {
      title: 'Finish your onboarding checklist',
      href: '/lms/onboarding',
      action: 'Open my checklist',
      instructions: 'Open the checklist and complete the first unfinished item. Check your name, phone number, and program. Read each agreement before signing it. Return to the checklist to see what remains.',
      confirmation: 'A completed step shows its saved status. If an item says pending review, staff must review it; uploading the same file again does not speed that up.',
    },
    {
      title: 'Upload documents and read your agreements',
      href: '/lms/documents',
      action: 'Open documents & uploads',
      instructions: 'Open the requested document item, choose a clear photo or file, and submit it. Make sure all requested pages are readable. Reopen the item to confirm the file saved. Use All agreements & signatures below to review your signed records.',
      confirmation: 'Submitted means received; approved or verified means reviewed. If corrections are requested, read the note and replace only the requested item. Send private documents through the upload form.',
    },
    {
      title: 'Check your inbox and send a message',
      href: '/communications/email',
      action: 'Open interoffice email',
      instructions: 'Open Inbox to read program messages. To write a new message, select Compose, choose the staff recipient, add a clear subject, and select Send. Use Reply on an existing conversation so your question stays with the earlier instructions.',
      confirmation: 'Check Sent for your message and Inbox for the reply. For a dashboard problem, include your name, HVAC program, page name, button selected, exact error, and when it happened. Never include your password.',
    },
    {
      title: 'Review your schedule and arrange hands-on training',
      href: '/lms/calendar',
      action: 'Open my calendar',
      instructions: 'Your program plan is four weeks of self-paced online study followed by two weeks of scheduled hands-on training. Check your assigned dates. Contact David using the details below to confirm your practical appointment, location, arrival time, clothing, tools, and safety equipment.',
      confirmation: 'Wait for a confirmed appointment before attending. Your enrollment date is not automatically your hands-on appointment, and a request is not a confirmed booking.',
    },
    {
      title: 'Record attendance accurately',
      href: '/lms/attendance',
      action: 'Open hands-on attendance',
      instructions: 'Use the time clock only for supervised, hands-on HVAC training. At your confirmed practical session, select your HVAC enrollment, confirm that you are attending hands-on training, then clock in when your instructor starts. Clock out for every break and when training ends. Online theory lessons, videos, quizzes, and studying at home do not use this clock.',
      confirmation: 'Hands-on attendance remains pending until your instructor verifies it. Complete your theory lessons and assessments in the LMS. Report a missed practical clock-out with the actual start, break, and end times; never guess hours.',
    },
    {
      title: 'Get help with the exact step that is blocked',
      href: '/lms/support',
      action: 'Open learner support',
      instructions: 'First read the checklist, status message, and the guide below. If a button fails, refresh once and try again. If it still fails, send one clear support request with the page and error. For a missing course link, report access trouble rather than buying another course or creating another account.',
      confirmation: 'Use learner support for account, upload, dashboard, or attendance-record problems. Use David’s contact for hands-on scheduling. Keep one conversation per issue and check for a reply before sending it again.',
    },
  ];

  return (
    <section aria-labelledby="hvac-start-here" className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-800">HVAC · Start here</p>
        <h2 id="hvac-start-here" className="mt-2 text-2xl font-black text-slate-950">Your dashboard, step by step</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-800">Use these tools now to prepare for training. Course availability is separate from access to your documents, messages, calendar, and attendance tools. Start with step 1, then work through the remaining steps. These instructions stay here whenever you need them.</p>
      </div>
      <ol className="grid gap-4 lg:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.href} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white">{index + 1}</span>
              <h3 className="pt-1 text-lg font-bold leading-6 text-slate-950">{step.title}</h3>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-800">{step.instructions}</p>
            <details className="mt-3 rounded-lg bg-slate-50 p-3">
              <summary className="min-h-11 cursor-pointer text-sm font-bold text-slate-900">What should happen? What if I get stuck?</summary>
              <p className="mt-2 text-sm leading-7 text-slate-700">{step.confirmation}</p>
            </details>
            <Link href={step.href} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-800 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900">{step.action}</Link>
          </li>
        ))}
      </ol>
      <aside className="rounded-xl border border-blue-200 bg-white p-5" aria-label="EPA 608 supplemental study materials">
        <h3 className="text-lg font-bold text-slate-950">QwikStudy · EPA 608 study materials</h3>
        <p className="mt-2 text-sm leading-7 text-slate-800">Use Mainstream Engineering’s study materials alongside your Elevate HVAC lessons. On the provider’s page, choose Software download codes, sign in or register, then select Downloads and enter your software download code.</p>
        {studyCode ? (
          <div className="mt-3 rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-bold text-slate-900">Your software download code</p>
            <code className="mt-2 block select-all break-all text-xl font-bold tracking-wide text-blue-950">{studyCode}</code>
            <p className="mt-2 text-xs leading-6 text-slate-700">Keep this code for later downloads. If the provider does not accept it, contact Elevate staff for help.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-800">Contact Elevate staff for your software download code when your training access is ready.</p>
        )}
        <p className="mt-2 text-sm leading-7 text-slate-700">The package product number and barcode are not your software access code. The free download on that page covers Type I only; full EPA 608 study access requires a valid download code. Downloaded training software requires Windows.</p>
        <a href="https://ww2.epatest.com/software/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-800 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900">Open QwikStudy access instructions (new tab)</a>
        <p className="mt-3 text-xs leading-6 text-slate-700">This link opens an external study resource. Studying there does not automatically update your Elevate lesson progress or award certification.</p>
      </aside>
      <aside className="rounded-xl border border-blue-200 bg-white p-5" aria-label="Hands-on training contact">
        <h3 className="text-lg font-bold text-slate-950">Hands-on training: David Nazaire</h3>
        <p className="mt-2 text-sm leading-7 text-slate-800">Introduce yourself as an Elevate HVAC learner. Include your full name, online-study progress, and available dates. Ask David to confirm the appointment and what to bring.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="tel:+12152149355" className="inline-flex min-h-11 items-center rounded-lg border border-blue-300 px-4 py-3 text-sm font-bold text-blue-900">Call (215) 214-9355</a>
          <a href="mailto:indyondemandservices@gmail.com" className="inline-flex min-h-11 max-w-full items-center break-all rounded-lg border border-blue-300 px-4 py-3 text-sm font-bold text-blue-900">Email indyondemandservices@gmail.com</a>
        </div>
      </aside>
      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="min-h-11 cursor-pointer font-bold text-slate-950">Your daily routine and status labels</summary>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-800">
          <li>When you sign in: check messages, read your next required action, and check your calendar.</li>
          <li>Before you leave: save your work, clock out if a hands-on training session is open, check submission status, and note your next task.</li>
          <li>Access granted means your account has access approval. It does not mean documents, lessons, attendance, or certification are completed.</li>
          <li>Pending review means staff action is still needed. Correction requested means read the note and fix that item. A completed upload does not automatically earn training hours.</li>
          <li>Self-paced study still follows your assigned deadlines. Contact staff before a deadline if you cannot meet it.</li>
        </ul>
      </details>
    </section>
  );
}
