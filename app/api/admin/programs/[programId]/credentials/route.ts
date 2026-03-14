import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'staff'];

async function authorize(supabase: any, db: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) return null;
  return user;
}

// GET /api/admin/programs/[programId]/credentials
// Returns all credential_registry rows linked to this program via program_credentials.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();
  const user = await authorize(supabase, db);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await db
    .from('program_credentials')
    .select(`
      id, is_required, sort_order, notes,
      credential:credential_registry(
        id, name, abbreviation, issuer_type, credential_stack,
        competency_area, stack_level, issuing_authority, is_active
      )
    `)
    .eq('program_id', programId)
    .order('sort_order');

  if (error) {
    logger.error('GET program_credentials error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

const LinkSchema = z.object({
  credential_id: z.string().uuid('Invalid credential ID'),
  is_required:   z.boolean().default(true),
  sort_order:    z.number().int().min(0).default(0),
  notes:         z.string().optional().nullable(),
});

// POST /api/admin/programs/[programId]/credentials
// Links a credential to this program.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();
  const user = await authorize(supabase, db);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    return NextResponse.json({ error: 'This credential is already linked to the program.' }, { status: 409 });
  }

  const { data, error } = await db
    .from('program_credentials')
    .insert({ ...parsed.data, program_id: programId })
    .select(`
      id, is_required, sort_order, notes,
      credential:credential_registry(
        id, name, abbreviation, issuer_type, credential_stack,
        competency_area, stack_level, issuing_authority, is_active
      )
    `)
    .single();

  if (error) {
    logger.error('POST program_credentials error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.info('Credential linked to program', { programId, credentialId: parsed.data.credential_id });
  return NextResponse.json({ link: data }, { status: 201 });
}
