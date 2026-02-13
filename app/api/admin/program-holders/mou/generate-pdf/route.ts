import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guardAdmin() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// MOU PDF generation moved to reduce bundle size
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json(
    { error: 'PDF generation temporarily unavailable' },
    { status: 503 }
  );
}

export async function POST() {
  const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json(
    { error: 'PDF generation temporarily unavailable' },
    { status: 503 }
  );
}
