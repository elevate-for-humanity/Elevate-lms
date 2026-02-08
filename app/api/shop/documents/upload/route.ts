import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
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
    const { data: staff } = await supabase
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
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Save document record
    const { error: dbError } = await supabase.from('shop_documents').insert({
      shop_id: shopId,
      document_type: documentType,
      file_url: uploadData.path,
      uploaded_by: user.id,
    });

    if (dbError) {
      // Error: $1
      return NextResponse.json({ error: dbError.message }, { status: 500 });
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
