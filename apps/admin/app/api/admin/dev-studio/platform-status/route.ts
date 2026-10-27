import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadBillingProviderConfig } from '@/lib/billing/config';
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

type BillingStatus = {
  status: 'ledger_ready' | 'error';
  primary_provider: 'quickbooks' | 'paypal';
  active_schedules: number;
  open_invoices: number;
  past_due_invoices: number;
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

    let billingStatus: BillingStatus = {
      status: 'error',
      primary_provider: 'quickbooks',
      active_schedules: 0,
      open_invoices: 0,
      past_due_invoices: 0,
    };

    try {
      const db = await requireAdminClient();
      const [config, schedules, openInvoices, pastDueInvoices] = await Promise.all([
        loadBillingProviderConfig(db),
        db.from('billing_schedules').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        db.from('billing_invoices').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        db.from('billing_invoices').select('id', { count: 'exact', head: true }).eq('status', 'past_due'),
      ]);
      if (schedules.error || openInvoices.error || pastDueInvoices.error) throw new Error('Billing ledger query failed');
      billingStatus = {
        status: 'ledger_ready',
        primary_provider: config.primary,
        active_schedules: schedules.count ?? 0,
        open_invoices: openInvoices.count ?? 0,
        past_due_invoices: pastDueInvoices.count ?? 0,
      };
    } catch {
      // Preserve status as error without exposing billing account details.
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
      billing: billingStatus,
      github: githubStatus,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Platform status error:', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
