import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { WebsiteClaimReviewClient, type ReviewClaim } from './WebsiteClaimReviewClient';

export const dynamic = 'force-dynamic';

export default async function WebsiteClaimsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('website_claim_registry')
    .select('id,claim_key,claim_text,claim_category,evidence_reference,evidence_url,methodology,status,updated_at,user_websites(site_name)')
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-black uppercase tracking-widest text-brand-red-700">Website governance</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Public claim evidence review</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">Verify the exact claim against its evidence before allowing it onto a published customer website. AI and website owners cannot approve their own proof.</p>
        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">Claim registry unavailable: {error.message}</div> : <div className="mt-8"><WebsiteClaimReviewClient initialClaims={(data ?? []) as unknown as ReviewClaim[]} /></div>}
      </div>
    </main>
  );
}
