import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ENCHANTED_HEARTS } from '@/lib/partners/enchanted-hearts';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('enrollment_id') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return NextResponse.json({ error: 'Invalid enrollment reference.' }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('redirect', `/enrollment/training-registration?enrollment_id=${id}`);
    return NextResponse.redirect(login);
  }
  const db = await requireAdminClient();
  const order = await db.from('school_invoice_orders').select('program_id')
    .eq('enrollment_id', id).eq('student_id', user.id).maybeSingle();
  if (order.error) return NextResponse.json({ error: 'Registration lookup is unavailable.' }, { status: 503 });
  const program = ENCHANTED_HEARTS.programs.find((item) => item.programId === order.data?.program_id);
  if (!program) return NextResponse.json({ error: 'Confirmed tuition payment is required.' }, { status: 403 });
  const response = NextResponse.redirect(program.registrationUrl);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
