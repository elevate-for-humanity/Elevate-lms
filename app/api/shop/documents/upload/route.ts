import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;
    const shopId = formData.get('shop_id') as string;

    if (!file || !documentType || !shopId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is staff at this shop
    const { data: staff } = await db
      .from('shop_staff')
      .select('id')
      .eq('shop_id', shopId)
      .eq('user_id', user.id)
      .single();

    if (!staff) {
      return NextResponse.json(
        { error: 'Not authorized for this shop' },
        { status: 403 }
      );
    }

    // Upload to storage
    const path = `shop_${shopId}/${documentType}_${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('shop-onboarding')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      // Error: $1
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Save document record
    const { error: dbError } = await db.from('shop_documents').insert({
      shop_id: shopId,
      document_type: documentType,
      file_url: uploadData.path,
      uploaded_by: user.id,
    });

    if (dbError) {
      // Error: $1
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Upload failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/shop/documents/upload', _POST);
