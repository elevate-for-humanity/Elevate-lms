import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import WorkbookNarration from '@/components/lms/WorkbookNarration';
import { liveAvatarGuideUrl } from '@/lib/orientation/portal-guide.mjs';
import { getNavigationForRole, type UserRole } from '@/lib/navigation/navigation-config';
import { portalGuides } from '@/lib/orientation/portal-guide-topics';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dashboard Orientation | Elevate', robots: { index: false, follow: false } };

export default async function PortalGuidePage({ searchParams }: { searchParams: Promise<{ portal?: string }> }) {
  const { portal } = await searchParams;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent('/portal-guide' + (portal ? '?portal=' + encodeURIComponent(portal) : ''))}`);

  const key = typeof portal === 'string' && Object.hasOwn(portalGuides, portal) ? portal : null;
  const guide = key ? portalGuides[key] : undefined;
  const role = key === 'administrator' ? 'admin' : key === 'testing' ? 'testing_center' : key;
  const navigation = role ? getNavigationForRole(role as UserRole) : [];
  const liveUrl = liveAvatarGuideUrl(process.env.LIVEAVATAR_PORTAL_GUIDE_EMBED_URL);
  const welcome = 'Welcome to Elevate for Humanity. I’m PARIS. I’ll walk you through your dashboard, what you can do here, and where to get help. You can pause at any time and follow the steps on screen.';
  const narration = guide ? [
    welcome,
    ...guide.steps.map(([title, instruction]) => `${title}. ${instruction}`),
    'Look in your dashboard menu for these sections.',
    ...navigation.map(section => `${section.label}. ${section.items.map(item => item.label).join(', ')}.`),
    'Open the FAQ library when you have a question or need to review a step.',
  ].join(' ') : welcome;

  return (
    <main className="mx-auto min-h-dvh max-w-4xl space-y-7 px-4 py-8 sm:px-6">
      <header className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
        <p className="font-semibold">Welcome to Elevate for Humanity</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{guide ? `${guide.title} dashboard orientation` : 'Dashboard orientation'}</h1>
        <p className="mt-3 leading-6 text-slate-200">Follow the walkthrough with PARIS or open a question in the FAQ library.</p>
        {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-white px-4 font-bold text-slate-950">Talk to the live AI instructor</a>}
      </header>
      <WorkbookNarration title="PARIS · Dashboard orientation" description="Listen to the full walkthrough or follow the written steps below." text={narration} />
      {guide ? (
        <section aria-labelledby="guide-steps">
          <h2 id="guide-steps" className="text-xl font-bold">Dashboard walkthrough</h2>
          <ol className="mt-4 grid gap-3">
            {guide.steps.map(([title, instruction]) => (
              <li key={title} className="rounded-xl border bg-white p-4">
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-slate-700">{instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <nav aria-label="Dashboard orientations" className="flex flex-wrap gap-3">
          {Object.entries(portalGuides).filter(([key]) => key !== 'learner').map(([key, item]) => (
            <Link key={key} href={`/portal-guide?portal=${key}`} className="inline-flex min-h-11 items-center rounded-lg border px-4 font-bold">{item.title}</Link>
          ))}
        </nav>
      )}
      {navigation.length > 0 && (
        <section aria-labelledby="guide-menu">
          <h2 id="guide-menu" className="text-xl font-bold">Dashboard menu reference</h2>
          {navigation.map(section => (
            <details key={section.id} className="mt-3 rounded-lg border bg-white p-4">
              <summary className="cursor-pointer font-bold">{section.label}</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                {section.items.map(item => <li key={item.id}>{item.label}</li>)}
              </ul>
            </details>
          ))}
        </section>
      )}
      {portal === 'workforce' && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-6" aria-labelledby="practice-title">
          <h2 id="practice-title" className="text-xl font-bold">Practice with a fictional WorkOne record</h2>
          <ol className="mt-3 space-y-3">
            <li><label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 shrink-0" />Confirm the example region is Indianapolis / Marion.</label></li>
            <li><details><summary className="cursor-pointer font-bold">Open practice student DEMO-104</summary><p className="mt-2">Progress is 60%. One practice assessment is recorded. No credential has been earned.</p></details></li>
            <li><label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 shrink-0" />Identify the next follow-up. Ask the student what remains before the credential can be verified.</label></li>
            <li><details><summary className="cursor-pointer font-bold">Practice the FAA submission steps</summary><p className="mt-2">A Regional Lead with FAA access selects the enrollment, enters the authorization reference, attaches the signed PDF, and checks for the submission receipt.</p></details></li>
          </ol>
        </section>
      )}
      <section aria-labelledby="guide-faq">
        <h2 id="guide-faq" className="text-xl font-bold">FAQ library</h2>
        {[...(guide?.faq ?? []), ['Where can I find this guide again?', 'Open Orientation from your dashboard any time.'], ['What can I ask the live guide?', 'Ask about dashboard navigation or the practice example. Keep personal records and documents in the secure portal.']].map(([question, answer]) => (
          <details key={question} className="mt-3 rounded-lg border bg-white p-4">
            <summary className="cursor-pointer font-bold">{question}</summary>
            <p className="mt-2 text-slate-700">{answer}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
