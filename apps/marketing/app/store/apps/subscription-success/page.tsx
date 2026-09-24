import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function PendingState() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Payment received — activating access</h1>
        <p className="mt-4 leading-7 text-slate-600">QuickBooks payment confirmation activates the purchased app automatically. If payment was just completed, refresh the app in a moment.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/store/apps" className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Return to Store</Link>
          <Link href="/billing" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700">Billing</Link>
        </div>
      </div>
    </main>
  );
}

export default async function IndividualAppSubscriptionSuccess({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app = '' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login?redirect=/store/apps');

  if (app) {
    const subscription = await syncIndividualAppSubscription(user.id, app, supabase);
    if (subscription?.status === 'active') redirect(`/apps/${app}?subscription=active`);
  }
  return <PendingState />;
}
