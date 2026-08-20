import Link from 'next/link';
import { notFound } from 'next/navigation';

const TOPICS: Record<string, { title: string; guidance: string[] }> = {
  profile: { title: 'Profile Information', guidance: ['Keep your legal name and current contact information accurate.', 'Use the authenticated learner or staff portal to update fields available to your role.', 'Contact support when a protected record requires correction.'] },
  email: { title: 'Email and Sign-In', guidance: ['Use the email address attached to your Elevate account.', 'Check spam or junk folders for requested account messages.', 'Contact support before creating a duplicate account with a different email.'] },
  security: { title: 'Account Security', guidance: ['Use a unique password.', 'Sign out of shared computers.', 'Report unexpected sign-in or password-reset messages promptly.'] },
  billing: { title: 'Billing', guidance: ['Review the payment terms attached to your program, subscription, or self-pay plan.', 'Keep receipts and transaction confirmations.', 'Contact support before retrying a payment that is still processing.'] },
  notifications: { title: 'Notifications', guidance: ['Keep your email and phone information current.', 'Review portal alerts for required documents, coursework, and deadlines.', 'Check device and browser notification settings if alerts are enabled but not appearing.'] },
  privacy: { title: 'Privacy', guidance: ['Use your own account and do not share credentials.', 'Only upload documents through authorized Elevate forms and portals.', 'Use the privacy and contact pages for questions about access, correction, or disclosure of your information.'] },
};

export default async function AccountHelpTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const article = TOPICS[topic];
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <Link href="/help/account" className="text-sm font-semibold text-blue-700">← Account Help</Link>
        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{article.title}</h1>
          <ul className="mt-7 space-y-4">
            {article.guidance.map((item) => <li key={item} className="rounded-xl border border-slate-200 p-4 leading-7 text-slate-700">{item}</li>)}
          </ul>
          <div className="mt-8 border-t border-slate-200 pt-6"><Link href="/help" className="font-semibold text-blue-700">Open Help Center</Link></div>
        </article>
      </div>
    </main>
  );
}
