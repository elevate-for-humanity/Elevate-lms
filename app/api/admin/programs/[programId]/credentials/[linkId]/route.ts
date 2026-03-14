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

const PatchSchema = z.object({
  is_required: z.boolean().optional(),
  sort_order:  z.number().int().min(0).optional(),
  notes:       z.string().optional().nullable(),
});

// PATCH /api/admin/programs/[programId]/credentials/[linkId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; linkId: string }> }
) {
  const { programId, linkId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();
  const user = await authorize(supabase, db);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data, error } = await db
    .from('program_credentials')
    .update(parsed.data)
    .eq('id', linkId)
    .eq('program_id', programId)
    .select()
    .single();

  if (error) {
    logger.error('PATCH program_credentials error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ link: data });
}

// DELETE /api/admin/programs/[programId]/credentials/[linkId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; linkId: string }> }
) {
  const { programId, linkId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();
  const user = await authorize(supabase, db);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await db
    .from('program_credentials')
    .delete()
    .eq('id', linkId)
    .eq('program_id', programId);

  if (error) {
    logger.error('DELETE program_credentials error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.info('Credential unlinked from program', { programId, linkId });
  return new NextResponse(null, { status: 204 });
}
