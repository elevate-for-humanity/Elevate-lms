import Link from 'next/link';
import { notFound } from 'next/navigation';

const TOPICS: Record<string, { title: string; checks: string[] }> = {
  browser: { title: 'Browser Support', checks: ['Use a current version of Chrome, Edge, Safari, or Firefox.', 'Allow cookies for Elevate domains so authentication can persist.', 'Disable extensions that block required site scripts if a page will not load.'] },
  connection: { title: 'Connection Issues', checks: ['Confirm other secure websites load on the same connection.', 'Switch networks if a managed network blocks streaming or authentication traffic.', 'Retry the page after connectivity is stable.'] },
  install: { title: 'Install the App', checks: ['Open the Elevate site in a supported browser.', 'Use the browser install or Add to Home Screen option when available.', 'Launch the installed PWA and sign in normally.'] },
  security: { title: 'Account Security', checks: ['Use a unique password and do not share login credentials.', 'Sign out on shared devices.', 'Contact support if you receive an unexpected account or sign-in notification.'] },
  cache: { title: 'Clear Browser Data', checks: ['Close extra Elevate tabs.', 'Clear cached site data for the affected Elevate domain.', 'Reopen the site and sign in again.'] },
  troubleshooting: { title: 'General Troubleshooting', checks: ['Reload the page once.', 'Confirm you are using the correct Elevate domain for your role.', 'If the issue continues, record the page address and error message before contacting support.'] },
};

export default async function TechnicalTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const article = TOPICS[topic];
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <Link href="/help/technical" className="text-sm font-semibold text-blue-700">← Technical Help</Link>
        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{article.title}</h1>
          <p className="mt-3 text-slate-600">Complete these checks in order before escalating the issue.</p>
          <ul className="mt-7 space-y-4">
            {article.checks.map((check) => <li key={check} className="rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">{check}</li>)}
          </ul>
          <div className="mt-8 border-t border-slate-200 pt-6"><Link href="/contact" className="font-semibold text-blue-700">Contact Support</Link></div>
        </article>
      </div>
    </main>
  );
}
