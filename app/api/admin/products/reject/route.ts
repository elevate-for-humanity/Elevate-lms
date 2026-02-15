export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    await requireAdmin();

    const supabase = await createClient();
    const { productId, reason } = await req.json();

    const { error } = await supabase
      .from('marketplace_products')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Does not meet marketplace standards',
      })
      .eq('id', productId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ err: toErrorMessage(err) }, { status: 500 });
  }
}
