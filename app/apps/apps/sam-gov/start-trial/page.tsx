import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Check, Clock, Shield, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Start Free Trial - SAM.gov Assistant | Elevate Apps',
  description: 'Start your 14-day free trial of SAM.gov Assistant.',
};

async function startTrial(formData: FormData) {
  'use server';
  
  const supabase = await createClient();
  const db = (await getAdminClient()) || supabase;
  if (!supabase) {
    redirect('/error?message=service-unavailable');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/apps/sam-gov/start-trial');
  }

  // Check if already has subscription
  const { data: existing } = await db
    .from('user_app_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_slug', 'sam-gov')
    .maybeSingle();

  if (existing) {
    redirect('/apps/sam-gov');
  }

  // Create trial subscription
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const { error } = await db
    .from('user_app_subscriptions')
    .insert({
      user_id: user.id,
      app_slug: 'sam-gov',
      plan: 'starter',
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    });

  if (error) {
    console.error('Error creating trial:', error);
    redirect('/apps/sam-gov/start-trial?error=failed');
  }

  redirect('/apps/sam-gov?welcome=true');
}

export default async function StartTrialPage() {
  const supabase = await createClient();
  const db = (await getAdminClient()) || supabase;
  
  if (!supabase) {
    redirect('/error?message=service-unavailable');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/apps/sam-gov/start-trial');
  }

  // Check if already has subscription
  const { data: existing } = await db
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'sam-gov')
    .maybeSingle();

  if (existing) {
    redirect('/apps/sam-gov');
  }

  const features = [
    'Step-by-step registration wizard',
    'UEI lookup and validation',
    'Compliance monitoring dashboard',
    'Document storage (1GB)',
    'Email support',
    'Automatic renewal reminders',
  ];

  return (
    <div className="min-h-screen bg-brand-blue-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-brand-blue-900" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">SAM.gov Assistant</h1>
          <p className="text-brand-blue-200">Federal Contractor Registration Made Simple</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-brand-green-100 text-brand-green-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Clock className="w-4 h-4" />
              14-Day Free Trial
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Start Your Free Trial</h2>
            <p className="text-gray-600 mt-2">No credit card required. Cancel anytime.</p>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-brand-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <form action={startTrial}>
            <button
              type="submit"
              className="w-full bg-brand-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-blue-700 transition"
            >
              Start Free Trial
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            By starting a trial, you agree to our{' '}
            <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-brand-blue-200 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Instant Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
