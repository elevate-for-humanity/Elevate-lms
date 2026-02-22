import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
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

    // Check if user is admin
    const { data: profile } = await db
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
    const { error } = await db
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
    const { data: doc } = await db
      .from('shop_documents')
      .select('shop_id')
      .eq('id', shop_document_id)
      .single();

    if (doc) {
      const { data: allDocs } = await db
        .from('shop_required_docs_status')
        .select('required, approved')
        .eq('shop_id', doc.shop_id);

      const requiredDocs = allDocs?.filter((d) => d.required) || [];
      const allApproved = requiredDocs.every((d) => d.approved);

      if (allApproved) {
        // Mark shop onboarding as complete
        await db
          .from('shop_onboarding')
          .update({
            handbook_ack: true,
            reporting_trained: true,
            apprentice_supervisor_assigned: true,
            rapids_reporting_ready: true,
            completed_at: new Date().toISOString(),
          })
          .eq('shop_id', doc.shop_id);

        // Notify shop owner that all docs are approved and onboarding is complete
        try {
          const { data: shop } = await db
            .from('host_shops')
            .select('owner_id, name')
            .eq('id', doc.shop_id)
            .single();

          if (shop?.owner_id) {
            const { data: ownerProfile } = await db
              .from('profiles')
              .select('email, full_name')
              .eq('id', shop.owner_id)
              .single();

            if (ownerProfile?.email) {
              const { notifyHostShopDecision } = await import('@/lib/notifications');
              await notifyHostShopDecision(
                ownerProfile.email,
                shop.name || 'Your Shop',
                true,
                doc.shop_id
              );
            }
          }
        } catch (notifyErr) {
          // Non-fatal
        }
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
