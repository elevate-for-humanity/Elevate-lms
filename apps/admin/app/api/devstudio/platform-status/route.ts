import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();

    // Supabase Status
    const supabaseStart = Date.now();
    const supabaseStatus = {
      status: 'connected' as const,
      latency_ms: 0,
      region: 'us-east-1',
      tables_accessible: 0,
      total_tables: 0,
    };

    try {
      // Count accessible tables
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      supabaseStatus.latency_ms = Date.now() - supabaseStart;
      supabaseStatus.tables_accessible = profileCount !== null ? 1 : 0;
      supabaseStatus.total_tables = 50; // Estimated total tables
    } catch (err) {
      supabaseStatus.status = 'error';
      supabaseStatus.last_error = err instanceof Error ? err.message : 'Connection failed';
    }

    // Stripe Status
    let stripeStatus = {
      status: 'inactive' as const,
      mode: 'test' as const,
      balance_cents: 0,
      active_subscriptions: 0,
      failed_payments_24h: 0,
      pending_invoices: 0,
    };

    try {
      const stripe = getStripe();
      if (stripe) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [balance, subscriptions, failedPayments, pendingInvoices] = await Promise.all([
          stripe.balance.retrieve(),
          stripe.subscriptions.list({ status: 'active', limit: 100 }),
          stripe.charges.list({
            created: { gte: Math.floor(yesterday.getTime() / 1000) },
            limit: 100,
          }).then(r => r.data.filter(c => !c.paid && c.failure_message)),
          stripe.invoices.list({ status: 'open', limit: 100 }),
        ]);

        stripeStatus = {
          status: 'active',
          mode: process.env.NEXT_PUBLIC_STRIPE_MODE === 'live' ? 'live' : 'test',
          balance_cents: balance.available.reduce((sum, b) => sum + b.amount, 0),
          active_subscriptions: subscriptions.data.length,
          failed_payments_24h: failedPayments.length,
          pending_invoices: pendingInvoices.data.length,
        };
      }
    } catch (err) {
      console.error('Stripe status error:', err);
      stripeStatus.status = 'error';
    }

    // GitHub PR Status (mock for now - would need GitHub token)
    const githubStatus = {
      total_open: 0,
      needs_review: 0,
      changes_requested: 0,
      approved: 0,
      drafts: 0,
      recent_prs: [] as Array<{
        number: number;
        title: string;
        state: string;
        url: string;
        updated_at: string;
        author: string;
      }>,
    };

    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      try {
        const repoResponse = await fetch(
          'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/pulls?state=open&per_page=10',
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (repoResponse.ok) {
          const prs = await repoResponse.json();
          githubStatus.total_open = prs.length;
          
          for (const pr of prs) {
            const isDraft = pr.draft;
            const hasChanges = pr.requested_reviewers?.length > 0;
            
            if (isDraft) {
              githubStatus.drafts++;
            } else if (hasChanges) {
              githubStatus.needs_review++;
            }
          }
          
          githubStatus.recent_prs = prs.slice(0, 5).map((pr: any) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            url: pr.html_url,
            updated_at: pr.updated_at,
            author: pr.user?.login || 'unknown',
          }));
        }
      } catch (err) {
        console.error('GitHub PR status error:', err);
      }
    }

    return NextResponse.json({
      supabase: supabaseStatus,
      stripe: stripeStatus,
      github: githubStatus,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Platform status error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Status check failed' },
      { status: 500 }
    );
  }
}