/**
 * Milady Automatic Payment Handler
 * Processes Milady enrollment and payment automatically
 */

import { createClient } from '@/lib/supabase/server';


const MILADY_COST = 295; // $295 per enrollment

interface MiladyPaymentParams {
  enrollmentId: string;
  studentId: string;
  programId: string;
  amount?: number;
}

/**
 * Process Milady payment and enrollment
 * This happens automatically after student pays
 */
export async function processMiladyPayment(params: MiladyPaymentParams) {
  const supabase = await createClient();
  const amount = params.amount || MILADY_COST;

  try {

    // STEP 1: Trigger Milady auto-enrollment API
    // This gives student immediate access to Milady RISE
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const miladyResponse = await fetch(`${siteUrl}/api/milady/auto-enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: params.studentId,
        programId: params.programId,
      }),
    });

    if (!miladyResponse.ok) {
      throw new Error('Milady enrollment API failed');
    }

    // STEP 2: Record vendor payment in database
    // This tracks that Milady needs to be paid
    const { error: paymentError } = await supabase
      .from('vendor_payments')
      .insert({
        enrollment_id: params.enrollmentId,
        vendor_name: 'milady',
        amount: amount,
        status: 'pending', // Will be marked 'paid' when Milady invoices
        payment_method: 'invoice', // Milady invoices us monthly
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      // Error: $1
      // Don't throw - enrollment should still succeed
    }

    // STEP 3: Log to audit trail
    await supabase.from('ai_audit_log').insert({
      user_id: params.studentId,
      action: 'MILADY_PAYMENT_PROCESSED',
      details: {
        program_slug: 'barber-apprenticeship',
        enrollment_id: params.enrollmentId,
        amount: amount,
        status: 'pending',
        method: 'automatic',
      },
    });

    return {
      success: true,
      amount: amount,
      status: 'pending',
      message: 'Milady enrollment and payment processed',
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1

    // Log error but don't fail enrollment
    await supabase.from('ai_audit_log').insert({
      user_id: params.studentId,
      action: 'MILADY_PAYMENT_ERROR',
      details: {
        program_slug: 'barber-apprenticeship',
        enrollment_id: params.enrollmentId,
        error: 'Operation failed',
      },
    });

    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Mark Milady payment as paid (when invoice is paid)
 */
export async function markMiladyPaymentPaid(
  enrollmentId: string,
  invoiceId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('vendor_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      invoice_id: invoiceId,
    })
    .eq('enrollment_id', enrollmentId)
    .eq('vendor_name', 'milady');

  if (error) {
    // Error: $1
    return { success: false, error: 'Operation failed' };
  }

  return { success: true };
}

/**
 * Get pending Milady payments (for monthly invoice reconciliation)
 */
export async function getPendingMiladyPayments() {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('vendor_payments')
    .select(
      `
      *,
      enrollments (
        id,
        user_id,
        program_id,
        created_at
      )
    `
    )
    .eq('vendor_name', 'milady')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    // Error: $1
    return { success: false, error: 'Operation failed', payments: [] };
  }

  return {
    success: true,
    payments: data,
    total: data.reduce((sum, p) => sum + Number(p.amount), 0),
    count: data.length,
  };
}
