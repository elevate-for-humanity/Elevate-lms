import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'SMS Terms & Consent',
  description: `How ${PLATFORM_DEFAULTS.orgName} uses text messaging, how to opt in, message frequency, and how to opt out or get help.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/sms-terms' },
};

const sections = [
  {
    title: 'Programs that send text messages',
    body: `When you give us your mobile number, ${PLATFORM_DEFAULTS.orgName} may send text messages related to the program you asked about. These include application and enrollment updates, admissions and advising replies, appointment and orientation reminders, class and apprenticeship schedule changes, document and payment reminders, testing and credential notices, and replies to messages you send us.`,
  },
  {
    title: 'How you opt in',
    body: 'You opt in by providing your mobile number and agreeing to receive text messages when you submit a form on this site, request information, apply, enroll, or message us at a published number. Consent is not a condition of enrollment, funding, employment, or any purchase. If you do not want text messages, use the phone or email options on our contact page instead.',
  },
  {
    title: 'Message frequency',
    body: 'Message frequency varies with your activity. You will receive messages only as needed for the program you are in — typically a small number per month, and more often during an active application, enrollment, or orientation window. We do not send marketing messages to numbers that only opted in for service updates.',
  },
  {
    title: 'Cost',
    body: 'Message and data rates may apply. Your mobile carrier sets these rates. We do not charge you for the text messages themselves.',
  },
  {
    title: 'How to opt out',
    body: 'Reply STOP to any message to unsubscribe. You will receive one confirmation message and then no further text messages from that program. You can also contact us and ask us to remove your number.',
  },
  {
    title: 'How to get help',
    body: `Reply HELP to any message for assistance, or contact us through the support options on this site. You can reach ${PLATFORM_DEFAULTS.orgName} by phone or email using the details on our contact page.`,
  },
  {
    title: 'Privacy',
    body: 'We do not sell or share your mobile number or messaging consent with third parties for their own marketing. Your number is used to deliver the messages described above and is handled under our Privacy Policy. Mobile opt-in data is not shared with any third party for marketing or promotional purposes.',
  },
];

export default function SmsTermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'SMS Terms & Consent' }]} />
        </div>
      </div>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Legal & Privacy</p>
          <h1 className="mt-3 text-4xl font-black">SMS Terms &amp; Consent</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            These terms explain how {PLATFORM_DEFAULTS.orgName} uses text messaging, how you opt in,
            how often we message, and how to opt out or get help.
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-400">Effective: November 15, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
          <strong className="font-bold text-slate-900">Summary:</strong> message frequency varies;
          message and data rates may apply; reply STOP to opt out; reply HELP for help. Consent is
          not a condition of enrollment, funding, employment, or any purchase.
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-black">Questions</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Contact us with any question about text messaging, consent, or your mobile number.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Contact us</Link>
            <Link href="/privacy" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100">Privacy Policy</Link>
            <Link href="/terms" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100">Terms of Service</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
