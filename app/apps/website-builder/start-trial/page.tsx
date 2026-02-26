import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Layout, Check, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Start Free Trial - Website Builder | Elevate Apps',
  description: 'Start your 14-day free trial of Website Builder.',
};

async function startTrial() {
  'use server';
  
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) redirect('/error?message=service-unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/website-builder/start-trial');

  const { data: existing } = await db
    .from('user_app_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (existing) redirect('/apps/website-builder');

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const { error } = await db
    .from('user_app_subscriptions')
    .insert({
      user_id: user.id,
      app_slug: 'website-builder',
      plan: 'starter',
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    });

  if (error) redirect('/apps/website-builder/start-trial?error=failed');
  redirect('/apps/website-builder?welcome=true');
}

export default async function StartTrialPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) redirect('/error?message=service-unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/website-builder/start-trial');

  const { data: existing } = await db
    .from('user_app_subscriptions')
    .select('*')
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
            <h2 className="text-2xl font-bold text-gray-900">Start Your Free Trial</h2>
            <p className="text-gray-600 mt-2">No credit card required.</p>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <form action={startTrial}>
            <button type="submit" className="w-full bg-brand-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-blue-700 transition">
              Start Free Trial
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            By starting a trial, you agree to our <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
