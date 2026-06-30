export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiAuthGuard } from '@/lib/admin/guards';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  if (!isAIAvailable()) {
    return NextResponse.json({ error: 'AI features not configured' }, { status: 503 });
  }

  try {
    const supabaseAdmin = await requireAdminClient();
    const body = await req.json();
    const { grantId, entityId } = body as { grantId: string; entityId: string };

    if (!grantId || !entityId) {
      return NextResponse.json({ error: 'grantId and entityId are required' }, { status: 400 });
    }

    const { data: grant, error: grantError } = await supabaseAdmin
      .from('grant_opportunities').select('*').eq('id', grantId).maybeSingle();
    if (grantError || !grant) return NextResponse.json({ error: 'Grant not found' }, { status: 404 });

    const { data: entity, error: entityError } = await supabaseAdmin
      .from('entities').select('*').eq('id', entityId).maybeSingle();
    if (entityError || !entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });

    const systemPrompt = `You are an expert federal and state grant writer helping an organization draft a complete narrative.
Write in clear, human, persuasive language. Avoid fluff. Use headings and paragraphs.

Sections required:
1. Project Title
2. Statement of Need
3. Target Population
4. Project Description & Activities
5. Goals, Objectives, and Outcomes
6. Organizational Capacity
7. Partnerships
8. Evaluation Plan
9. Sustainability
10. Budget Narrative (high level)

Return a single markdown-formatted string.`;

    const userPrompt = `Grant Opportunity:
Title: ${grant.title}
Agency: ${grant.agency ?? 'N/A'}
Summary: ${grant.summary ?? 'N/A'}
Eligibility: ${grant.eligibility ?? 'N/A'}
NAICS tags: ${(grant.naics_tags ?? []).join(', ')}

Organization (Entity):
Name: ${entity.name}
Type: ${entity.entity_type}
UEI: ${entity.uei ?? 'N/A'}
NAICS list: ${(entity.naics_list ?? []).join(', ')}
Capability narrative: ${entity.capability_narrative ?? 'N/A'}
Org history: ${entity.org_history ?? 'N/A'}
Key personnel: ${entity.key_personnel ?? 'N/A'}

Write a full draft grant narrative tailored to this opportunity and organization.
Focus on workforce, community impact, and elevation if applicable.`;

    const completion = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const content = completion.content ?? '';

    const { data: app, error: appError } = await supabaseAdmin
      .from('grant_applications')
      .upsert(
        { grant_id: grant.id, entity_id: entity.id, draft_title: `${grant.title} – ${entity.name}`, draft_narrative: content, status: 'draft' },
        { onConflict: 'grant_id,entity_id' },
      )
      .select().single();

    if (appError || !app) return NextResponse.json({ error: 'Failed to save grant application' }, { status: 500 });

    return NextResponse.json({ ok: true, applicationId: app.id, draft_narrative: app.draft_narrative });
  } catch (err) {
    logger.error(err);
    return NextResponse.json({ error: 'Unexpected error while drafting grant' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/grants/draft', _POST);
