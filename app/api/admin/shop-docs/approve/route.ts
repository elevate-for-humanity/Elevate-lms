import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { shop_document_id, approved } = await req.json();

    if (!shop_document_id) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    // Update document approval status
    const { error } = await supabase
      .from('shop_documents')
      .update({
        approved: !!approved,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', shop_document_id);

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    // Check if all required docs are now approved
    const { data: doc } = await supabase
      .from('shop_documents')
      .select('shop_id')
      .eq('id', shop_document_id)
      .single();

    if (doc) {
      const { data: allDocs } = await supabase
        .from('shop_required_docs_status')
        .select('required, approved')
        .eq('shop_id', doc.shop_id);

      const requiredDocs = allDocs?.filter((d) => d.required) || [];
      const allApproved = requiredDocs.every((d) => d.approved);

      if (allApproved) {
        // Mark shop onboarding as complete
        await supabase
          .from('shop_onboarding')
          .update({
            handbook_ack: true,
            reporting_trained: true,
            apprentice_supervisor_assigned: true,
            rapids_reporting_ready: true,
            completed_at: new Date().toISOString(),
          })
          .eq('shop_id', doc.shop_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Approval failed' },
      { status: 500 }
    );
  }
}
