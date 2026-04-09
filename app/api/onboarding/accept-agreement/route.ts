import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { agreement_type, document_version } = await req.json();

    if (!agreement_type || !document_version) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user profile for role
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Insert acceptance record
    const { error: insertError } = await admin
      .from('license_agreement_acceptances')
      .insert({
        user_id: user.id,
        agreement_type,
        document_version,
        role_at_signing: profile?.role || 'student',
        signer_email: user.email,
        signer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        signature_method: 'click',
        legal_acknowledgment: true,
      });

    if (insertError) {
      logger.error('Agreement insert failed', undefined, { detail: insertError.message }); return NextResponse.json({ error: 'Failed to save agreement' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('Accept agreement failed', err instanceof Error ? err : undefined); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
