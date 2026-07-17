import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Layout, Check, Clock } from 'lucide-react';
import { startAppTrial } from '@/lib/trial/start-app-trial';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Start Free Trial - Website Builder | Elevate Apps',
  description: 'Start your 14-day free trial of Website Builder.',
};

async function startTrial() {
  'use server';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/website-builder/start-trial');

  const result = await startAppTrial(user.id, 'website-builder');
  if (result.status === 'exists') redirect('/apps/website-builder');
  if (result.status === 'error') redirect('/apps/website-builder/start-trial?error=failed');
  redirect('/apps/website-builder?welcome=true');
}

export default async function StartTrialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/website-builder/start-trial');

  const { data: existing } = await supabase
    .from('user_app_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (existing) redirect('/apps/website-builder');

  const features = [
    '50+ professional templates',
    'Drag & drop editor',
    'Mobile responsive',
    'SEO optimized',
    'Custom domain support',
    'Email support',
  ];

  return (
    <div className="min-h-screen bg-brand-blue-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layout className="w-10 h-10 text-brand-blue-900" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Website Builder</h1>
          <p className="text-brand-blue-200">Professional Websites in Minutes</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Clock className="w-4 h-4" />
              14-Day Free Trial
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Start Your Free Trial</h2>
            <p className="text-slate-600 mt-2">No credit card required.</p>
          </div>

          {errorParam === 'failed' && (
            <div className="mb-6 rounded-lg border border-brand-red-200 bg-brand-red-50 px-4 py-3 text-sm text-brand-red-800">
              We could not start your trial. An admin may need to run migration{' '}
              <code className="text-xs">20260702000015_individual_app_subscriptions.sql</code> in Supabase,
              then try again.
            </div>
          )}

          <ul className="space-y-3 mb-8">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          <form action={startTrial}>
            <button type="submit" className="w-full bg-brand-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-blue-700 transition">
              Start Free Trial
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            By starting a trial, you agree to our <Link href="/legal" className="text-brand-blue-600 hover:underline">Terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
