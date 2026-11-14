import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ENCHANTED_HEARTS } from '@/lib/partners/enchanted-hearts';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id))
    return NextResponse.json({ error: 'Invalid program.' }, { status: 400 });
  const db = await requireAdminClient();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data, error } = await db
    .from('programs')
    .select(
      'id,name,slug,description,duration_weeks,requires_license,is_free,price,total_cost,funding_eligible,category',
    )
    .eq(uuid ? 'id' : 'slug', id)
    .eq('published', true)
    .eq('is_active', true)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: 'Program details are temporarily unavailable.' },
      { status: 503 },
    );
  if (!data) return NextResponse.json({ error: 'Program not found.' }, { status: 404 });
  const schoolProgram = ENCHANTED_HEARTS.programs.find((item) => item.programId === data.id);
  const program = schoolProgram
    ? {
        ...data,
        name: schoolProgram.title,
        slug: schoolProgram.publicSlug,
        description: schoolProgram.summary,
        price: schoolProgram.retailPriceCents / 100,
      }
    : data;
  return NextResponse.json({ program }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
