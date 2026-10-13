import Link from 'next/link';

export function PortalStartChecklist({ role }: { role: 'host-shop' | 'program-holder' }) {
  const host = role === 'host-shop';
  const phone = host ? '/host-shop/dashboard/phone' : '/program-holder/phone';
  const email = host ? '/host-shop/email' : '/program-holder/email';
  const guide = host ? '/host-shop/orientation' : '/program-holder/how-to-use';
  return (
    <section aria-label="First login setup tasks" className="my-6 rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-fuchsia-50 p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-widest text-cyan-800">Your first login · Start here</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Set up your office. Stay connected.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">Complete these setup tasks, then check your dashboard for new students, messages, and required actions each workday.</p>
      <ol className="mt-5 grid gap-4 lg:grid-cols-3">
        <li className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-black">1. Install your app</h3><p className="mt-2 text-sm leading-6">Open your role app. On iPhone use Share → Add to Home Screen; on Android use the browser menu → Install app or Add to Home Screen. Open the installed icon and sign in.</p><Link className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-800 underline" href={`/install/${role}`}>Open app installation</Link></li>
        <li className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-black">2. Activate your phone</h3><p className="mt-2 text-sm leading-6">Open Phone, confirm your assigned extension, allow microphone access when prompted, and select Connect phone. Set work hours and choose Ring, Vibrate, Silent, Do Not Disturb, or Off. Open the app and reconnect when you return to work.</p><Link className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-800 underline" href={phone}>Set up phone and extension</Link><details className="mt-2 text-sm"><summary className="cursor-pointer font-bold">Answer calls and return messages</summary><p className="mt-2 leading-6">Use Answer or Decline for incoming calls; Mute and Hang up during a call. Connect before placing a return call. Review missed calls and PARIS callback notes, contact the caller, and update the follow-up status. Mobile devices can suspend background audio; keep the app active during your working hours.</p></details></li>
        <li className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-black">3. Activate your office email</h3><p className="mt-2 text-sm leading-6">Open Email and confirm the assigned From address belongs to you. Read Inbox, use Compose for a new message, and Reply within an existing conversation. You can use your assigned office mailbox for inter-office communication now. If no mailbox is assigned, contact Administration for setup.</p><Link className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-800 underline" href={email}>Open your office email</Link></li>
      </ol>
      <div className="mt-5 flex flex-wrap gap-4 rounded-2xl bg-slate-950 p-4 text-sm text-white"><span className="font-black">Administration · Elizabeth Greene</span><a className="underline" href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a><a className="underline" href="tel:+13179999620">(317) 999-9620 · extension 0</a></div>
      <Link className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-800 underline" href={guide}>Learn how to use every workspace tab</Link>
    </section>
  );
}
