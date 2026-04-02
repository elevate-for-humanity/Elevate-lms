import { createAdminClient } from '@/lib/supabase/admin';

// app/api/cash-advances/applications/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';

import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();
    const { id } = await params;
    const body = await parseBody<Record<string, any>>(request);
    const { approved_amount, notes } = body;

    // Update application status
    const { data, error }: any = await supabase
      .from('cash_advance_applications')
      .update({
        status: 'approved',
        approved_amount: approved_amount,
        approval_notes: notes,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    // Send approval email to applicant
    if (data.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.email,
            subject: 'Cash Advance Application Approved',
            template: 'cash-advance-approval',
            data: {
              name: data.full_name,
              amount: approved_amount,
              notes: notes,
            },
          }),
        });
      } catch (emailError) {
        logger.error('Failed to send approval email:', emailError);
      }
    }

    // Note: EOS Financial integration requires API credentials
    // Fund transfer will be initiated manually until API is configured

    return NextResponse.json({
      success: true,
      application: data,
      message: 'Application approved successfully',
    });
  } catch (error) { 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/cash-advances/applications/[id]/approve', _POST);
