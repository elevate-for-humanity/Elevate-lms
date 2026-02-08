import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { requireRole } from '@/lib/requireRole';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require sponsor or admin role
    try {
      await requireRole(user.id, 'sponsor');
    } catch (error) {
      try {
        await requireRole(user.id, 'admin');
      } catch (error) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      secure: true,
      message: 'Access granted to secure admin endpoint',
    });
  } catch (err: any) {
    return NextResponse.json(
      { err: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
