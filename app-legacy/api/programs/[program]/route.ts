// PUBLIC ROUTE: public program detail page data
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * GET /api/programs/[slug]
 *
 * Returns program details with outcomes and requirements.
 * Strict: 404 if not published/active.
 */
async function _GET(request: NextRequest, { params }: { params: Promise<{ program: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { program: slug } = await params;
    const supabase = await requireAdminClient();

    // Fetch program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select(
        `
        id,
        slug,
        name,
        description,
        category,
        duration_weeks,
        price,
        certification,
        credential,
        required_hours,
        hero_image,
        hero_image_alt,
        is_active
      `,
      )
      .eq('slug', slug)
      .maybeSingle();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if published/active
    if (!program.is_active) {
      return NextResponse.json({ error: 'Program not available' }, { status: 404 });
    }

    // Fetch outcomes
    const { data: outcomes } = await supabase
      .from('program_outcomes')
      .select('id, outcome, outcome_order')
      .eq('program_id', program.id)
      .order('outcome_order', { ascending: true });

    // Fetch requirements
    const { data: requirements } = await supabase
      .from('program_requirements')
      .select('id, requirement, requirement_order')
      .eq('program_id', program.id)
      .order('requirement_order', { ascending: true });

    return NextResponse.json({
      program: {
        ...program,
        outcomes: outcomes || [],
        requirements: requirements || [],
      },
    });
  } catch (error) {
    logger.error('Program API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/programs/[slug]', _GET);
