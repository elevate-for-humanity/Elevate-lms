import { logger } from '@/lib/logger';
/**
 * Milady Course Purchase & Student Provisioning
 * 
 * When a student pays Elevate, we:
 * 1. Pay Milady for the course access ($295 per student)
 * 2. Create student account in Milady
 * 3. Send student their login credentials
 * 
 * Milady accepts payments via:
 * - Stripe Connect (if partner)
 * - Direct API purchase
 * - Bulk license codes (pre-purchased)
 */

import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';



// Milady pricing per program
const MILADY_COSTS: Record<string, number> = {
  'barber-apprenticeship': 295,
  'cosmetology-apprenticeship': 295,
  'esthetician-apprenticeship': 195,
  'nail-technician-apprenticeship': 145,
};

// Milady course IDs/SKUs
const MILADY_COURSE_SKUS: Record<string, string> = {
  'barber-apprenticeship': 'MILADY-BARBER-RTI',
  'cosmetology-apprenticeship': 'MILADY-COSMO-RTI',
  'esthetician-apprenticeship': 'MILADY-ESTH-RTI',
  'nail-technician-apprenticeship': 'MILADY-NAIL-RTI',
};

export interface MiladyPurchaseResult {
  success: boolean;
  studentCredentials?: {
    email: string;
    temporaryPassword: string;
    loginUrl: string;
  };
  licenseCode?: string;
  paymentId?: string;
  error?: string;
}

export interface StudentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Purchase Milady course access for a student
 * This is called after student pays Elevate
 */
export async function purchaseMiladyCourse(
  student: StudentData,
  programSlug: string,
  elevatePaymentId: string
): Promise<MiladyPurchaseResult> {
  const supabase = await createClient();
  const cost = MILADY_COSTS[programSlug] || 295;
  const courseSku = MILADY_COURSE_SKUS[programSlug];

  try {
    // Method 1: If we have Milady API credentials, use direct API
    if (process.env.MILADY_API_KEY && process.env.MILADY_API_SECRET) {
      return await purchaseViaMiladyAPI(student, programSlug, cost);
    }

    // Method 2: If we have pre-purchased license codes, assign one
    const licenseResult = await assignPrePurchasedLicense(supabase, student, programSlug);
    if (licenseResult.success) {
      return licenseResult;
    }

    // Method 3: If Milady has Stripe Connect, pay them directly
    if (process.env.MILADY_STRIPE_ACCOUNT_ID) {
      return await purchaseViaStripeConnect(student, programSlug, cost, elevatePaymentId);
    }

    // Method 4: Queue for manual purchase and provisioning
    return await queueManualPurchase(supabase, student, programSlug, cost);

  } catch (error: any) {
    logger.error('[Milady Purchase] Error:', error);
    
    // Record failed attempt
    await supabase.from('vendor_payments').insert({
      student_id: student.id,
      vendor_name: 'milady',
      program_slug: programSlug,
      amount: cost,
      status: 'failed',
      error_message: 'Payment processing failed',
      elevate_payment_id: elevatePaymentId,
      created_at: new Date().toISOString(),
    });

    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Purchase via Milady's direct API
 */
async function purchaseViaMiladyAPI(
  student: StudentData,
  programSlug: string,
  cost: number
): Promise<MiladyPurchaseResult> {
  const courseSku = MILADY_COURSE_SKUS[programSlug];
  
  // Call Milady API to create account and purchase course
  const response = await fetch(`${process.env.MILADY_API_URL}/v1/school/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MILADY_API_KEY}`,
      'X-School-ID': process.env.MILADY_SCHOOL_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student: {
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
      },
      courseSku: courseSku,
      paymentMethod: 'school_account', // Bill to school's account
    }),
  });

  if (!response.ok) {
    throw new Error(`Milady API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,
    studentCredentials: {
      email: student.email,
      temporaryPassword: data.temporaryPassword,
      loginUrl: data.loginUrl || 'https://www.miladytraining.com/users/sign_in',
    },
    paymentId: data.transactionId,
  };
}

/**
 * Assign a pre-purchased license code
 */
async function assignPrePurchasedLicense(
  supabase: any,
  student: StudentData,
  programSlug: string
): Promise<MiladyPurchaseResult> {
  // Get available license code
  const { data: license, error } = await supabase
    .from('milady_license_codes')
    .select('*')
    .eq('program_slug', programSlug)
    .eq('status', 'available')
    .limit(1)
    .single();

  if (error || !license) {
    return { success: false, error: 'No available license codes' };
  }

  // Assign to student
  const { error: updateError } = await supabase
    .from('milady_license_codes')
    .update({
      status: 'assigned',
      assigned_to: student.id,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', license.id);

  if (updateError) {
    return { success: false, error: 'Failed to assign license code' };
  }

  // Record in milady_access
  await supabase.from('milady_access').upsert({
    student_id: student.id,
    program_slug: programSlug,
    provisioning_method: 'license_code',
    license_code: license.code,
    access_url: 'https://www.miladytraining.com/redeem',
    status: 'active',
    provisioned_at: new Date().toISOString(),
  }, {
    onConflict: 'student_id,program_slug',
  });

  return {
    success: true,
    licenseCode: license.code,
    studentCredentials: {
      email: student.email,
      temporaryPassword: '', // Student creates own password with license code
      loginUrl: `https://www.miladytraining.com/redeem?code=${license.code}`,
    },
  };
}

/**
 * Pay Milady via Stripe Connect (if they're a connected account)
 */
async function purchaseViaStripeConnect(
  student: StudentData,
  programSlug: string,
  cost: number,
  elevatePaymentId: string
): Promise<MiladyPurchaseResult> {
  // Create a transfer to Milady's connected account
  const transfer = await stripe.transfers.create({
    amount: cost * 100, // Convert to cents
    currency: 'usd',
    destination: process.env.MILADY_STRIPE_ACCOUNT_ID!,
    transfer_group: elevatePaymentId,
    metadata: {
      student_id: student.id,
      student_email: student.email,
      program_slug: programSlug,
      purpose: 'milady_course_purchase',
    },
  });

  // After payment, Milady should auto-provision via webhook
  // For now, queue for manual verification
  return {
    success: true,
    paymentId: transfer.id,
    studentCredentials: {
      email: student.email,
      temporaryPassword: '', // Milady will email credentials
      loginUrl: 'https://www.miladytraining.com/users/sign_in',
    },
  };
}

/**
 * Queue for manual purchase (admin buys on Milady portal)
 */
async function queueManualPurchase(
  supabase: any,
  student: StudentData,
  programSlug: string,
  cost: number
): Promise<MiladyPurchaseResult> {
  // Create provisioning queue entry
  await supabase.from('milady_provisioning_queue').upsert({
    student_id: student.id,
    student_email: student.email,
    student_name: `${student.firstName} ${student.lastName}`,
    program_slug: programSlug,
    course_code: MILADY_COURSE_SKUS[programSlug],
    status: 'pending',
    amount_to_pay: cost,
    notes: 'Auto-queued after student payment. Admin needs to purchase on Milady portal.',
    created_at: new Date().toISOString(),
  }, {
    onConflict: 'student_id,program_slug',
  });

  // Record pending vendor payment
  await supabase.from('vendor_payments').insert({
    student_id: student.id,
    vendor_name: 'milady',
    program_slug: programSlug,
    amount: cost,
    status: 'pending_manual',
    created_at: new Date().toISOString(),
  });

  // Record access as pending
  await supabase.from('milady_access').upsert({
    student_id: student.id,
    program_slug: programSlug,
    provisioning_method: 'manual',
    status: 'pending_setup',
    provisioned_at: new Date().toISOString(),
  }, {
    onConflict: 'student_id,program_slug',
  });

  return {
    success: true, // Queued successfully
    studentCredentials: {
      email: student.email,
      temporaryPassword: '',
      loginUrl: 'https://www.miladytraining.com/users/sign_in',
    },
  };
}

/**
 * Mark manual purchase as complete (called by admin)
 */
export async function completeMiladyPurchase(
  studentId: string,
  programSlug: string,
  credentials: {
    username?: string;
    temporaryPassword?: string;
    licenseCode?: string;
  }
) {
  const supabase = await createClient();

  // Update access record
  await supabase.from('milady_access').update({
    status: 'active',
    username: credentials.username,
    license_code: credentials.licenseCode,
    access_url: 'https://www.miladytraining.com/users/sign_in',
    manually_provisioned_at: new Date().toISOString(),
  })
  .eq('student_id', studentId)
  .eq('program_slug', programSlug);

  // Update queue
  await supabase.from('milady_provisioning_queue').update({
    status: 'completed',
    processed_at: new Date().toISOString(),
  })
  .eq('student_id', studentId)
  .eq('program_slug', programSlug);

  // Update vendor payment
  await supabase.from('vendor_payments').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
  })
  .eq('student_id', studentId)
  .eq('vendor_name', 'milady')
  .eq('status', 'pending_manual');

  // Send credentials email to student
  const { data: student } = await supabase
    .from('profiles')
    .select('email, full_name, first_name')
    .eq('id', studentId)
    .single();

  if (student) {
    await sendMiladyCredentialsEmail(student, credentials, programSlug);
  }

  return { success: true };
}

/**
 * Send Milady credentials email to student
 */
async function sendMiladyCredentialsEmail(
  student: { email: string; full_name?: string; first_name?: string },
  credentials: { username?: string; temporaryPassword?: string; licenseCode?: string },
  programSlug: string
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Milady Access is Ready</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0;">Your Milady Access is Ready!</h1>
  </div>
  
  <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <p>Hi ${student.first_name || student.full_name || 'Student'},</p>
    
    <p>Great news! Your Milady RISE theory training access has been set up. You can now start your coursework.</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #4f46e5;">Your Login Details</h3>
      
      ${credentials.licenseCode ? `
      <p><strong>License Code:</strong></p>
      <p style="font-family: monospace; font-size: 18px; background: white; padding: 10px; border-radius: 4px; letter-spacing: 2px;">${credentials.licenseCode}</p>
      <p style="font-size: 14px; color: #6b7280;">Use this code at: <a href="https://www.miladytraining.com/redeem">miladytraining.com/redeem</a></p>
      ` : ''}
      
      ${credentials.username ? `
      <p><strong>Username:</strong> ${credentials.username}</p>
      ` : `
      <p><strong>Email:</strong> ${student.email}</p>
      `}
      
      ${credentials.temporaryPassword ? `
      <p><strong>Temporary Password:</strong> ${credentials.temporaryPassword}</p>
      <p style="font-size: 14px; color: #dc2626;">⚠️ Please change your password after first login.</p>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.miladytraining.com/users/sign_in" 
         style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Login to Milady RISE →
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    
    <p style="font-size: 14px; color: #6b7280;">
      <strong>Next Steps:</strong>
    </p>
    <ol style="font-size: 14px; color: #6b7280;">
      <li>Login to Milady RISE using the details above</li>
      <li>Complete your theory coursework at your own pace</li>
      <li>Track your progress on your <a href="${siteUrl}/learner/dashboard">Elevate Dashboard</a></li>
    </ol>
    
    <p style="font-size: 14px; color: #6b7280;">
      Questions? Contact us at <a href="mailto:info@elevateforhumanity.org">info@elevateforhumanity.org</a>
    </p>
  </div>
</body>
</html>
  `;

  // Send email
  await fetch(`${siteUrl}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: student.email,
      subject: '🎓 Your Milady Theory Training Access is Ready!',
      html: emailHtml,
    }),
  });
}
