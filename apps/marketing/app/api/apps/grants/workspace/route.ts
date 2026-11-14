import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireIndividualWorkspace, workspaceFailure } from '@/lib/apps/workspaces/access';
import { searchOpportunities } from '@/lib/integrations/grants-gov';
import { grantRecord } from '@/lib/apps/workspaces/grants';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = z.string().uuid();
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const access = await requireIndividualWorkspace(request, 'grants');
  if (access instanceof NextResponse) return access;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'A valid request body is required.' }, { status: 400 });
    if (body.action === 'search') {
      const keyword = z.string().trim().min(2).max(180).safeParse(body.keyword);
      if (!keyword.success)
        return NextResponse.json(
          { error: 'Enter a search phrase between 2 and 180 characters.' },
          { status: 400 },
        );
      let result;
      try {
        result = await searchOpportunities({
          keyword: keyword.data,
          rows: 25,
          oppStatuses: ['posted', 'forecasted'],
        });
      } catch {
        return NextResponse.json(
          { error: 'Grants.gov could not be reached. Your search allowance has not been used.' },
          { status: 502 },
        );
      }
      const quota = await access.db.rpc('reserve_grants_search', { p_user_id: access.userId });
      if (quota.error) throw quota.error;
      const allowance = Array.isArray(quota.data) ? quota.data[0] : quota.data;
      if (!allowance?.allowed)
        return NextResponse.json(
          { error: 'Your monthly grant search allowance has been reached.' },
          { status: 429 },
        );
      let records = result.opportunities.map(grantRecord);
      let opportunities: any[] = [];
      if (records.length) {
        const existing = await access.db
          .from('grant_opportunities')
          .select('opportunity_number,external_id')
          .in(
            'opportunity_number',
            records.map((row) => row.opportunity_number),
          );
        if (existing.error) throw existing.error;
        const identities = new Map(
          (existing.data || []).map((row) => [row.opportunity_number, row.external_id]),
        );
        records = records.map((row) => ({
          ...row,
          external_id: String(identities.get(row.opportunity_number) || row.external_id),
        }));
      }
      if (records.length) {
        const saved = await access.db
          .from('grant_opportunities')
          .upsert(records, { onConflict: 'external_id' })
          .select('*');
        if (saved.error) throw saved.error;
        opportunities = saved.data || [];
      }
      return NextResponse.json({
        ok: true,
        opportunities,
        total: result.totalCount,
        remaining: allowance.remaining,
      });
    }
    if (body.action === 'application') {
      if (access.subscription.plan === 'starter')
        return NextResponse.json(
          { error: 'Application tracking requires the Professional or Enterprise plan.' },
          { status: 403 },
        );
      const parsed = z
        .object({
          id: uuid,
          status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn']),
          notes: z.string().max(10000),
          amount_requested: z.preprocess(
            (v) => (v === '' || v == null ? null : Number(v)),
            z.number().min(0).max(1e12).nullable(),
          ),
          budget_narrative: z.string().max(10000).optional().default(''),
        })
        .safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: 'Check the application status, budget, and notes.' },
          { status: 400 },
        );
      const saved = await access.db
        .from('grant_applications')
        .update({
          status: parsed.data.status,
          notes: parsed.data.notes,
          amount_requested: parsed.data.amount_requested,
          budget_narrative: parsed.data.budget_narrative,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parsed.data.id)
        .eq('created_by', access.userId)
        .select('id')
        .maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data)
        return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    const id = uuid.safeParse(body.grant_id);
    if (!id.success) return NextResponse.json({ error: 'Select an opportunity.' }, { status: 400 });
    const opportunity = await access.db
      .from('grant_opportunities')
      .select('id,title,agency,opportunity_number,url')
      .eq('id', id.data)
      .maybeSingle();
    if (opportunity.error) throw opportunity.error;
    if (!opportunity.data)
      return NextResponse.json({ error: 'Opportunity not found.' }, { status: 404 });
    if (body.action === 'save' || body.action === 'unsave') {
      const saved = await access.db.from('user_saved_grants').upsert(
        {
          user_id: access.userId,
          grant_id: id.data,
          status: body.action === 'save' ? 'active' : 'inactive',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,grant_id' },
      );
      if (saved.error) throw saved.error;
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'draft') {
      if (access.subscription.plan === 'starter')
        return NextResponse.json(
          { error: 'Application tracking requires the Professional or Enterprise plan.' },
          { status: 403 },
        );
      const existing = await access.db
        .from('grant_applications')
        .select('id')
        .eq('opportunity_id', id.data)
        .eq('created_by', access.userId)
        .limit(1)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return NextResponse.json({ ok: true, id: existing.data.id });
      const saved = await access.db.from('grant_applications').upsert(
        {
          created_by: access.userId,
          submitted_by: access.userId,
          opportunity_id: id.data,
          opportunity_title: opportunity.data.title,
          agency_name: opportunity.data.agency,
          opportunity_number: opportunity.data.opportunity_number,
          opportunity_url: opportunity.data.url,
          status: 'draft',
        },
        { onConflict: 'created_by,opportunity_id', ignoreDuplicates: true },
      );
      if (saved.error) throw saved.error;
      const tracker = await access.db
        .from('grant_applications')
        .select('id')
        .eq('created_by', access.userId)
        .eq('opportunity_id', id.data)
        .single();
      if (tracker.error) throw tracker.error;
      return NextResponse.json({ ok: true, id: tracker.data.id });
    }
    return NextResponse.json({ error: 'Unsupported workspace action.' }, { status: 400 });
  } catch (error) {
    return workspaceFailure(error);
  }
}
