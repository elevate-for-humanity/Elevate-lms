import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const paymentSplitSchema = z.object({
  enrollment_id: z.string().uuid(),
  total_amount: z.number().positive(),
  payment_method: z.enum(['stripe', 'affirm', 'sezzle', 'cash', 'check', 'funded']),
  transaction_id: z.string().min(1),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Program-specific vendor costs
const VENDOR_COSTS: Record<string, { vendor: string; cost: number }> = {
  'barber-apprenticeship': {
    vendor: 'none',
    cost: 0,
  },
  'direct-support-professional': {
    vendor: 'none',
    cost: 0,
  },
  // Add other programs as needed
};

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({ requireAuth: true });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const parsed = paymentSplitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { enrollment_id, total_amount, payment_method, transaction_id } = parsed.data;

    // Get enrollment details
    const { data: enrollment, error: enrollError } = await supabase
      .from('program_enrollments')
      .select('*, programs(*)')
      .eq('id', enrollment_id)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Get vendor cost for this program
    const programSlug = enrollment.programs.slug;
    const vendorConfig = VENDOR_COSTS[programSlug] || {
      vendor: 'none',
      cost: 0,
    };

    const vendorAmount = vendorConfig.cost;
    const elevateAmount = total_amount - vendorAmount;

    // Create payment split record
    const { data: split, error: splitError } = await supabase
      .from('payment_splits')
      .insert({
        enrollment_id,
        total_amount,
        vendor_name: vendorConfig.vendor,
        vendor_amount: vendorAmount,
        elevate_amount: elevateAmount,
        payment_method,
        transaction_id,
      })
      .select()
      .single();

    if (splitError) {
      // Error: $1
      throw new Error('Failed to record payment split');
    }

    // Process payment split:
    // 1. Pay vendor for enrollment (if applicable)
    // 2. Remaining balance goes to Stripe account automatically
    if (vendorAmount > 0 && vendorConfig.vendor !== 'none') {
      await processVendorPayment({
        vendorName: vendorConfig.vendor,
        amount: vendorAmount,
        enrollmentId: enrollment_id,
        splitId: split.id,
        studentId: enrollment.user_id,
        programId: enrollment.program_id,
      });
    }

    // Note: Remaining balance ($4,595) automatically goes to Stripe account
    // No additional action needed - BNPL provider pays full amount to Stripe

    // Log to audit trail
    await supabase.from('ai_audit_log').insert({
      user_id: enrollment.user_id,
      action: 'PAYMENT_SPLIT',
      details: {
        program_slug: programSlug,
        total: total_amount,
        vendor: vendorAmount,
        elevate: elevateAmount,
        vendor_name: vendorConfig.vendor,
        payment_method,
      },
    });

    return NextResponse.json({
      success: true,
      split: {
        total: total_amount,
        vendor: vendorAmount,
        elevate: elevateAmount,
        vendor_name: vendorConfig.vendor,
      },
    });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to process payment split' },
      { status: 500 }
    );
  }
}

async function processVendorPayment(params: {
  vendorName: string;
  amount: number;
  enrollmentId: string;
  splitId: string;
  studentId: string;
  programId: string;
}) {
  const supabase = await createClient();

  try {
    // No external vendor integrations active — LMS access is handled by the enrollment pipeline
    logger.info(`Vendor payment skipped (vendor=${params.vendorName}, amount=${params.amount})`);
    await supabase
      .from('payment_splits')
      .update({ vendor_paid_at: new Date().toISOString() })
      .eq('id', params.splitId);
  } catch (error) {
      logger.error("Unhandled error", error instanceof Error ? error : undefined);
  }
}
export const POST = withApiAudit('/api/payments/split', _POST);
