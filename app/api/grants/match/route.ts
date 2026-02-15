
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/grants/match/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function computeMatchScore(
  entityNaics: string[],
  grantNaics: string[],
  entityType: 'for_profit' | 'nonprofit',
  categories: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const overlappingNaics = entityNaics.filter((n) => grantNaics.includes(n));
  if (overlappingNaics.length > 0) {
    score += 40;
    reasons.push(`NAICS overlap: ${overlappingNaics.join(', ')}`);
  }

  if (entityType === 'nonprofit' && categories.includes('nonprofit')) {
    score += 30;
    reasons.push('Nonprofit-only opportunity');
  }

  if (entityType === 'for_profit' && categories.includes('small_business')) {
    score += 30;
    reasons.push('Small business opportunity');
  }

  if (categories.includes('workforce')) {
    score += 10;
    reasons.push('Workforce-related opportunity');
  }

  if (categories.includes('beauty') || categories.includes('wellness')) {
    score += 10;
    reasons.push('Beauty/wellness-related opportunity');
  }

  if (score > 100) score = 100;
  return { score, reasons };
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { data: entities, error: entitiesError } = await supabaseAdmin
      .from('entities')
      .select('*');

    if (entitiesError || !entities) {
      logger.error(entitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch entities' },
        { status: 500 }
      );
    }

    const { data: grants, error: grantsError } = await supabaseAdmin
      .from('grant_opportunities')
      .select('*')
      .gte('due_date', new Date().toISOString().slice(0, 10));

    if (grantsError || !grants) {
      logger.error(grantsError);
      return NextResponse.json(
        { error: 'Failed to fetch grants' },
        { status: 500 }
      );
    }

    for (const grant of grants) {
      const grantNaics = (grant.naics_tags ?? []) as string[];
      const categories = (grant.categories ?? []) as string[];

      for (const entity of entities) {
        const entityNaics = (entity.naics_list ?? []) as string[];
        const { score, reasons } = computeMatchScore(
          entityNaics,
          grantNaics,
          entity.entity_type as 'for_profit' | 'nonprofit',
          categories
        );

        if (score < 30) continue;

        const { error } = await supabaseAdmin.from('grant_matches').upsert(
          {
            grant_id: grant.id,
            entity_id: entity.id,
            match_score: score,
            reasons,
          },
          { onConflict: 'grant_id,entity_id' }
        );

        if (error) {
          logger.error(
            'Error upserting grant_match',
            grant.id,
            entity.id,
            error
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error(err);
    return NextResponse.json(
      { error: 'Unexpected error during grant matching' },
      { status: 500 }
    );
  }
}
