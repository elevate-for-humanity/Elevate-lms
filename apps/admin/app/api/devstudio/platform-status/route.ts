import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

type SupabaseStatus = {
  status: 'connected' | 'error';
  latency_ms: number;
  region: string;
  tables_accessible: number;
  total_tables: number;
  last_error?: string;
};

type StripeStatus = {
  status: 'inactive' | 'active' | 'error';
  mode: 'test' | 'live';
  balance_cents: number;
  active_subscriptions: number;
  failed_payments_24h: number;
  pending_invoices: number;
};

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();

    const supabaseStart = Date.now();
    const supabaseStatus: SupabaseStatus = {
      status: 'connected',
      latency_ms: 0,
      region: 'us-east-1',
      tables_accessible: 0,
      total_tables: 0,
    };

    try {
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      supabaseStatus.latency_ms = Date.now() - supabaseStart;
      supabaseStatus.tables_accessible = profileCount !== null ? 1 : 0;
      supabaseStatus.total_tables = 50;
    } catch {
      supabaseStatus.status = 'error';
      supabaseStatus.last_error = 'Connection failed';
    }

    let stripeStatus: StripeStatus = {
      status: 'inactive',
      mode: 'test',
      balance_cents: 0,
      active_subscriptions: 0,
      failed_payments_24h: 0,
      pending_invoices: 0,
    };

    try {
      const stripe = getStripe();
      if (stripe) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [balance, subscriptions, failedPayments, pendingInvoices] = await Promise.all([
          stripe.balance.retrieve(),
          stripe.subscriptions.list({ status: 'active', limit: 100 }),
          stripe.charges.list({
            created: { gte: Math.floor(yesterday.getTime() / 1000) },
            limit: 100,
          }).then((r) => r.data.filter((c) => !c.paid && c.failure_message)),
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
          },
        );

        if (repoResponse.ok) {
          const prs = await repoResponse.json();
          githubStatus.total_open = prs.length;

          for (const pr of prs) {
            if (pr.draft) githubStatus.drafts++;
            else if (pr.requested_reviewers?.length > 0) githubStatus.needs_review++;
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
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
