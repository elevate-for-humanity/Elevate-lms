export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const { productId } = await req.json();

    const { error } = await supabase
      .from('marketplace_products')
      .update({ status: 'approved' })
      .eq('id', productId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ err: toErrorMessage(err) }, { status: 500 });
  }
}
