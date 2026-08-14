import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/admin/programs/[programId]/credentials
// Returns all credential_registry rows linked to this program via program_credentials.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('program_credentials')
    .select(
      `
      id, is_required, sort_order, notes,
      credential:credential_registry(
        id, name, abbreviation, issuer_type, credential_stack,
        competency_area, stack_level, issuing_authority, is_active
      )
    `,
    )
    .eq('program_id', programId)
    .order('sort_order');

  if (error) {
    logger.error('GET program_credentials error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

const LinkSchema = z.object({
  credential_id: z.string().uuid('Invalid credential ID'),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

// POST /api/admin/programs/[programId]/credentials
// Links a credential to this program.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const { programId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();

  const body = await req.json().catch(() => null);
  const parsed = LinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Prevent duplicates
  const { data: existing } = await db
    .from('program_credentials')
    .select('id')
    .eq('program_id', programId)
    .eq('credential_id', parsed.data.credential_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This credential is already linked to the program.' },
      { status: 409 },
    );
  }

  const { data, error } = await db
    .from('program_credentials')
    .insert({ ...parsed.data, program_id: programId })
    .select(
      `
      id, is_required, sort_order, notes,
      credential:credential_registry(
        id, name, abbreviation, issuer_type, credential_stack,
        competency_area, stack_level, issuing_authority, is_active
      )
    `,
    )
    .maybeSingle();

  if (error) {
    logger.error('POST program_credentials error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  logger.info('Credential linked to program', {
    programId,
    credentialId: parsed.data.credential_id,
  });
  return NextResponse.json({ link: data }, { status: 201 });
}
