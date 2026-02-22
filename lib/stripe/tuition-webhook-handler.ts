import { logger } from '@/lib/logger';
/**
 * TUITION WEBHOOK HANDLER
 * 
 * Handles Stripe webhook events for tuition payments:
 * - checkout.session.completed: Grant access, create subscription if installment plan
 * - invoice.paid: Track installment progress, check for completion
 * - invoice.payment_failed: Suspend access, send notification
 * - customer.subscription.deleted: Handle subscription end
 */

import { getStripe } from '@/lib/stripe/client';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { 
  createInstallmentSubscription, 
  checkAndCancelCompletedSubscription,
  handleFailedPayment 
} from './tuition-checkout';
import { INSTALLMENT_RULES } from './tuition-config';

/**
 * Send emails after payment is completed
 * Email 1: Mikady - Payment confirmation
 * Email 2: Welcome Letter - Instructions to complete enrollment
 */
async function sendWelcomeLetterEmail(studentId: string, programId: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    logger.info('RESEND_API_KEY not configured, skipping emails');
    return;
  }

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get student info
  const { data: student } = await supabaseClient
    .from('profiles')
    .select('email, full_name, phone')
    .eq('id', studentId)
    .single();

  // Get program info
  const { data: program } = await supabaseClient
    .from('programs')
    .select('title, name, duration, start_date')
    .eq('id', programId)
    .single();

  if (!student?.email) {
    logger.error('No student email found');
    return;
  }

  const resend = new Resend(resendKey);
  const programName = program?.title || program?.name || 'your program';
  const studentName = student.full_name || 'Student';

  try {
    // ============================================
    // EMAIL 1: MIKADY - Payment Confirmation
    // ============================================
    await resend.emails.send({
      from: 'Elevate for Humanity <billing@elevateforhumanity.org>',
      to: student.email,
      subject: `Payment Confirmed - ${programName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://www.elevateforhumanity.org/logo.png" alt="Elevate for Humanity" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">Payment Confirmed!</h1>
          </div>
          
          <p>Dear ${studentName},</p>
          
          <p>Thank you! Your payment for <strong>${programName}</strong> has been successfully processed.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p style="margin: 5px 0;"><strong>Program:</strong> ${programName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Confirmed</p>
          </div>
          
          <p>A separate welcome email with instructions to complete your enrollment will follow shortly.</p>
          
          <p>If you have any questions about your payment, please contact our billing department:</p>
          <ul>
            <li>Phone: (317) 314-3757</li>
            <li>Email: billing@elevateforhumanity.org</li>
          </ul>
          
          <p>Best regards,<br>
          <strong>Elevate for Humanity Billing</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            © ${new Date().getFullYear()} Elevate for Humanity, Inc. All rights reserved.
          </p>
        </body>
        </html>
      `,
    });

    logger.info(`Payment confirmation (Mikady) sent to ${student.email}`);

    // ============================================
    // EMAIL 2: WELCOME LETTER - Complete Enrollment
    // ============================================
    await resend.emails.send({
      from: 'Elevate for Humanity <admissions@elevateforhumanity.org>',
      to: student.email,
      subject: `ACTION REQUIRED: Complete Your Enrollment - ${programName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://www.elevateforhumanity.org/logo.png" alt="Elevate for Humanity" style="max-width: 200px;">
          </div>
          
          <h1 style="color: #1e40af; text-align: center;">Welcome to Elevate for Humanity!</h1>
          
          <p>Dear ${studentName},</p>
          
          <p>Congratulations on enrolling in <strong>${programName}</strong>! We are excited to have you join our learning community.</p>
          
          <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 0; text-align: center;">⚠️ IMPORTANT: YOU CANNOT START TRAINING UNTIL YOU COMPLETE ENROLLMENT</h2>
            <p style="text-align: center; font-weight: bold;">
              You must complete ALL onboarding steps in the Student Portal before you can begin your program.
            </p>
          </div>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0;">Complete These Steps Now:</h2>
            <ol style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 15px;">
                <strong>Upload Required Documents:</strong>
                <ul style="margin-top: 5px;">
                  <li>Government-Issued ID (Driver's License, State ID, or Passport)</li>
                  <li>Social Security Card</li>
                  <li>Transfer Hours Documentation</li>
                </ul>
              </li>
              <li style="margin-bottom: 15px;">
                <strong>Sign Required Agreements:</strong>
                <ul style="margin-top: 5px;">
                  <li>Enrollment Agreement</li>
                  <li>Participation Agreement</li>
                  <li>FERPA Consent Form</li>
                </ul>
              </li>
              <li style="margin-bottom: 15px;"><strong>Read and Acknowledge the Student Handbook</strong></li>
              <li style="margin-bottom: 15px;"><strong>Complete Your Student Profile</strong></li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.elevateforhumanity.org/student-portal/onboarding" style="background-color: #1e40af; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">Complete Enrollment Now</a>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h2 style="color: #92400e; margin-top: 0;">Important Reminders</h2>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Clock In/Out:</strong> You must clock in and out for ALL training sessions using the Student Portal. Leaving for more than 15 minutes requires clocking out.</li>
              <li style="margin-bottom: 8px;"><strong>Attendance:</strong> Minimum 90% attendance is required. Three unexcused absences may result in termination.</li>
              <li style="margin-bottom: 8px;"><strong>Weekly Hours:</strong> Plan for 28-40 hours per week of combined classroom and on-the-job training.</li>
              <li style="margin-bottom: 8px;"><strong>All Sales Final:</strong> All tuition payments are non-refundable. We reserve the right to terminate enrollment for rule violations.</li>
            </ul>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Information</h3>
            <p style="margin: 5px 0;"><strong>Phone:</strong> (317) 314-3757</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> support@elevateforhumanity.org</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>
          </div>
          
          <p>We look forward to supporting you on your journey to a rewarding career!</p>
          
          <p>Best regards,<br>
          <strong>The Elevate for Humanity Admissions Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This email was sent to ${student.email} because you enrolled in a program at Elevate for Humanity.<br>
            © ${new Date().getFullYear()} Elevate for Humanity, Inc. All rights reserved.
          </p>
        </body>
        </html>
      `,
    });

    logger.info(`Welcome letter sent to ${student.email} for program ${programName}`);

    // Record emails sent
    await supabaseClient.from('email_logs').insert([
      {
        user_id: studentId,
        email_type: 'payment_confirmation',
        recipient_email: student.email,
        subject: `Payment Confirmed - ${programName}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      },
      {
        user_id: studentId,
        email_type: 'welcome_letter',
        recipient_email: student.email,
        subject: `ACTION REQUIRED: Complete Your Enrollment - ${programName}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }
    ]).catch(() => {}); // Ignore if table doesn't exist

    // ============================================
    // ADMIN NOTIFICATION - New Enrollment
    // ============================================
    await sendAdminEnrollmentNotification(studentId, programId, studentName, student.email, programName);

    // ============================================
    // RAPIDS - Create pending registration
    // ============================================
    await createRAPIDSPendingRecord(supabaseClient, studentId, programId, studentName, programName);

  } catch (error) {
    logger.error('Failed to send emails:', error);
  }
}

/**
 * Notify admin of new enrollment
 */
async function sendAdminEnrollmentNotification(
  studentId: string,
  programId: string,
  studentName: string,
  studentEmail: string,
  programName: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'info@elevateforhumanity.org';
  const resend = new Resend(resendKey);

  try {
    await resend.emails.send({
      from: 'Elevate for Humanity <system@elevateforhumanity.org>',
      to: adminEmail,
      subject: `🎉 New Enrollment: ${studentName} - ${programName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">New Student Enrollment!</h1>
          </div>
          
          <p>A new student has enrolled and completed payment.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Student Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${studentName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
            <p style="margin: 5px 0;"><strong>Program:</strong> ${programName}</p>
            <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">Action Required</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Student needs to complete onboarding (documents, agreements)</li>
              <li>RAPIDS registration pending - will be submitted after onboarding complete</li>
              <li>Assign to training site/mentor when ready</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://www.elevateforhumanity.org/admin/students/${studentId}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Student</a>
            <a href="https://www.elevateforhumanity.org/admin/enrollments" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-left: 10px;">All Enrollments</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated notification from Elevate for Humanity LMS.
          </p>
        </body>
        </html>
      `,
    });

    logger.info(`Admin notification sent for new enrollment: ${studentName}`);

  } catch (error) {
    logger.error('Failed to send admin notification:', error);
  }
}

/**
 * Create RAPIDS pending registration record
 * RAPIDS submission happens after student completes onboarding
 */
async function createRAPIDSPendingRecord(
  supabase: any,
  studentId: string,
  programId: string,
  studentName: string,
  programName: string
): Promise<void> {
  try {
    // Check if this is an apprenticeship program requiring RAPIDS
    const { data: program } = await supabase
      .from('programs')
      .select('type, rapids_required, occupation_code')
      .eq('id', programId)
      .single();

    const isApprenticeship = program?.type === 'apprenticeship' || program?.rapids_required;
    
    if (!isApprenticeship) {
      logger.info(`Program ${programName} does not require RAPIDS registration`);
      return;
    }

    // Create pending RAPIDS record
    await supabase.from('rapids_tracking').insert({
      student_id: studentId,
      program_id: programId,
      status: 'pending_onboarding',
      occupation_code: program?.occupation_code || null,
      created_at: new Date().toISOString(),
      notes: 'Awaiting student onboarding completion before RAPIDS submission',
    });

    logger.info(`RAPIDS pending record created for ${studentName} - ${programName}`);

  } catch (error) {
    logger.error('Failed to create RAPIDS record:', error);
  }
}

async function sendPaymentFailedEmail(studentId: string, programId: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get student info
  const { data: student } = await supabaseClient
    .from('profiles')
    .select('email, full_name')
    .eq('id', studentId)
    .single();

  // Get program info
  const { data: program } = await supabaseClient
    .from('programs')
    .select('title')
    .eq('id', programId)
    .single();

  if (!student?.email) return;

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: 'Elevate LMS <billing@elevateforhumanity.org>',
    to: student.email,
    subject: 'Payment Failed - Action Required',
    html: `
      <h1>Payment Failed</h1>
      <p>Hi ${student.full_name || 'Student'},</p>
      <p>We were unable to process your tuition payment for <strong>${program?.title || 'your program'}</strong>.</p>
      <p>Please update your payment method to avoid interruption to your course access.</p>
      <p><a href="https://www.elevateforhumanity.org/account/billing">Update Payment Method</a></p>
      <p>If you have questions, contact us at support@elevateforhumanity.org</p>
    `,
  });
}
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

export async function handleTuitionWebhook(event: Stripe.Event): Promise<void> {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
      
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
      
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
  }
}

/**
 * CHECKOUT COMPLETED
 * - Grant course access
 * - Create subscription if installment plan
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const { metadata } = session;
  
  if (!metadata?.student_id || !metadata?.program_id) {
    logger.error('Missing metadata in checkout session');
    return;
  }
  
  const studentId = metadata.student_id;
  const programId = metadata.program_id;
  const paymentOption = metadata.payment_option;
  
  logger.info(`Checkout completed: ${paymentOption} for student ${studentId}`);
  
  // Record payment in database
  await supabase.from('tuition_payments').insert({
    student_id: studentId,
    program_id: programId,
    stripe_session_id: session.id,
    payment_option: paymentOption,
    amount_paid: session.amount_total ? session.amount_total / 100 : 0,
    status: 'completed',
    created_at: new Date().toISOString(),
  });
  
  // Handle based on payment option
  if (paymentOption === 'pay_in_full' || paymentOption === 'bnpl') {
    // Full payment received - grant full access
    await grantCourseAccess(studentId, programId, 'full');
    await updateEnrollmentStatus(studentId, programId, 'active', 'paid_in_full');
    
    // Send welcome letter email
    await sendWelcomeLetterEmail(studentId, programId);
    
  } else if (paymentOption === 'installment_plan' && metadata.create_subscription === 'true') {
    // Deposit paid - create subscription for remaining balance (weekly or monthly)
    const customerId = session.customer as string;
    const paymentIntentId = session.payment_intent as string;
    
    // Get the payment method from the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentMethodId = paymentIntent.payment_method as string;
    
    // Create subscription for weekly/monthly payments
    const result = await createInstallmentSubscription(customerId, paymentMethodId, {
      student_id: studentId,
      program_id: programId,
      // Weekly payments (new)
      weekly_amount: metadata.weekly_amount,
      number_of_weeks: metadata.number_of_weeks,
      payment_interval: metadata.payment_interval,
      // Monthly payments (legacy support)
      monthly_amount: metadata.monthly_amount,
      number_of_months: metadata.number_of_months,
    });
    
    if (result.success) {
      // Grant access after deposit
      await grantCourseAccess(studentId, programId, 'active');
      await updateEnrollmentStatus(studentId, programId, 'active', 'installment_plan');
      
      // Store subscription ID
      await supabase.from('tuition_subscriptions').insert({
        student_id: studentId,
        program_id: programId,
        stripe_subscription_id: result.subscriptionId,
        monthly_amount: parseInt(metadata.monthly_amount || metadata.weekly_amount || '0'),
        total_installments: parseInt(metadata.number_of_months || metadata.number_of_weeks || '0'),
        installments_paid: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      });
      
      // Send welcome letter email
      await sendWelcomeLetterEmail(studentId, programId);
    } else {
      logger.error('Failed to create subscription:', result.error);
      // Still grant access since deposit was paid, but flag for manual review
      await grantCourseAccess(studentId, programId, 'active');
      await updateEnrollmentStatus(studentId, programId, 'active', 'subscription_failed');
    }
  }
}

/**
 * INVOICE PAID (Subscription payment - weekly or monthly)
 * - Track installment progress
 * - Send payment confirmation
 * - Cancel subscription when complete
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;
  
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Only handle tuition installments
  if (subscription.metadata.payment_type !== 'tuition_installment') return;
  
  const studentId = subscription.metadata.student_id;
  const programId = subscription.metadata.program_id;
  const paymentInterval = subscription.metadata.payment_interval || 'month';
  const amountPaid = invoice.amount_paid / 100;
  
  logger.info(`${paymentInterval}ly payment of $${amountPaid} received for student ${studentId}`);
  
  // Record payment in tuition_payments
  await supabase.from('tuition_payments').insert({
    student_id: studentId,
    program_id: programId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    payment_option: 'installment',
    amount_paid: amountPaid,
    status: 'completed',
    created_at: new Date().toISOString(),
  });
  
  // Also record in student_payments for unified tracking
  await supabase.from('student_payments').insert({
    student_id: studentId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount: amountPaid,
    type: paymentInterval === 'week' ? 'weekly_payment' : 'monthly_payment',
    status: 'completed',
  }).catch(() => {}); // Ignore if table doesn't exist
  
  // Update installment count in tuition_subscriptions
  const { data: tuitionSub } = await supabase
    .from('tuition_subscriptions')
    .select('installments_paid, total_installments')
    .eq('stripe_subscription_id', subscriptionId)
    .single();
  
  if (tuitionSub) {
    const newCount = (tuitionSub.installments_paid || 0) + 1;
    
    await supabase
      .from('tuition_subscriptions')
      .update({ 
        installments_paid: newCount,
        last_payment_date: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);
    
    // Check if all installments paid
    if (newCount >= tuitionSub.total_installments) {
      await supabase
        .from('tuition_subscriptions')
        .update({ status: 'completed' })
        .eq('stripe_subscription_id', subscriptionId);
      
      await updateEnrollmentStatus(studentId, programId, 'active', 'paid_in_full');
      
      // Send completion notification
      await sendPaymentCompletionEmail(studentId, programId);
    } else {
      // Send payment confirmation
      await sendPaymentConfirmationEmail(studentId, amountPaid, newCount, tuitionSub.total_installments, paymentInterval);
    }
  }
  
  // Update student_subscriptions if exists
  await supabase
    .from('student_subscriptions')
    .update({
      weeks_paid: supabase.rpc ? undefined : undefined, // Increment handled separately
      last_payment_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('stripe_subscription_id', subscriptionId)
    .catch(() => {});
  
  // Increment weeks_paid
  const { data: studentSub } = await supabase
    .from('student_subscriptions')
    .select('weeks_paid')
    .eq('stripe_subscription_id', subscriptionId)
    .single();
  
  if (studentSub) {
    await supabase
      .from('student_subscriptions')
      .update({ weeks_paid: (studentSub.weeks_paid || 0) + 1 })
      .eq('stripe_subscription_id', subscriptionId);
  }
  
  // Check and cancel subscription if complete
  await checkAndCancelCompletedSubscription(subscriptionId);
  
  // Ensure access is active (in case it was suspended)
  await grantCourseAccess(studentId, programId, 'active');
}

/**
 * Send payment confirmation email
 */
async function sendPaymentConfirmationEmail(
  studentId: string,
  amount: number,
  paymentNumber: number,
  totalPayments: number,
  interval: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const { data: student } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', studentId)
    .single();

  if (!student?.email) return;

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: 'Elevate for Humanity <billing@elevateforhumanity.org>',
    to: student.email,
    subject: `Payment Received - ${paymentNumber} of ${totalPayments}`,
    html: `
      <h2>Payment Confirmed</h2>
      <p>Hi ${student.full_name || 'Student'},</p>
      <p>We've received your ${interval}ly tuition payment of <strong>$${amount.toFixed(2)}</strong>.</p>
      <p><strong>Payment Progress:</strong> ${paymentNumber} of ${totalPayments} payments completed</p>
      <p>Remaining: ${totalPayments - paymentNumber} payments</p>
      <p>Thank you for staying on track with your education!</p>
      <p>- Elevate for Humanity</p>
    `,
  }).catch(err => logger.error('Failed to send payment confirmation:', err));
}

/**
 * Send payment completion email
 */
async function sendPaymentCompletionEmail(studentId: string, programId: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const { data: student } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', studentId)
    .single();

  const { data: program } = await supabase
    .from('programs')
    .select('title')
    .eq('id', programId)
    .single();

  if (!student?.email) return;

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: 'Elevate for Humanity <billing@elevateforhumanity.org>',
    to: student.email,
    subject: 'Congratulations! Tuition Paid in Full',
    html: `
      <h2>🎉 Tuition Paid in Full!</h2>
      <p>Hi ${student.full_name || 'Student'},</p>
      <p>Congratulations! You have successfully completed all tuition payments for <strong>${program?.title || 'your program'}</strong>.</p>
      <p>Your dedication to your education is inspiring. Keep up the great work!</p>
      <p>If you have any questions, please don't hesitate to reach out.</p>
      <p>- Elevate for Humanity</p>
    `,
  }).catch(err => logger.error('Failed to send completion email:', err));
}

/**
 * INVOICE PAYMENT FAILED
 * - Suspend course access
 * - Send notification
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;
  
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Only handle tuition installments
  if (subscription.metadata.payment_type !== 'tuition_installment') return;
  
  const studentId = subscription.metadata.student_id;
  const programId = subscription.metadata.program_id;
  
  logger.info(`Payment failed for student ${studentId}`);
  
  // Record failed payment
  await supabase.from('tuition_payments').insert({
    student_id: studentId,
    program_id: programId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    payment_option: 'installment',
    amount_paid: 0,
    status: 'failed',
    created_at: new Date().toISOString(),
  });
  
  // Suspend access per INSTALLMENT_RULES
  if (INSTALLMENT_RULES.suspendOnFailure) {
    await suspendCourseAccess(studentId, programId, 'payment_failed');
    await updateEnrollmentStatus(studentId, programId, 'suspended', 'payment_failed');
  }
  
  // Update subscription status
  await supabase
    .from('tuition_subscriptions')
    .update({ 
      status: 'past_due',
      last_failed_date: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);
  
  // Send notification email to student
  try {
    await sendPaymentFailedEmail(studentId, programId);
  } catch (emailError) {
    logger.error('Failed to send payment failed email:', emailError);
  }
}

/**
 * SUBSCRIPTION DELETED
 * - Handle cancellation or completion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  if (subscription.metadata.payment_type !== 'tuition_installment') return;
  
  const studentId = subscription.metadata.student_id;
  const programId = subscription.metadata.program_id;
  
  const { data: sub } = await supabase
    .from('tuition_subscriptions')
    .select('installments_paid, total_installments, status')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (sub) {
    const isComplete = sub.installments_paid >= sub.total_installments;
    
    if (isComplete) {
      // Subscription completed successfully
      logger.info(`Subscription completed for student ${studentId}`);
      await supabase
        .from('tuition_subscriptions')
        .update({ status: 'completed' })
        .eq('stripe_subscription_id', subscription.id);
    } else {
      // Subscription cancelled before completion
      logger.info(`Subscription cancelled early for student ${studentId}`);
      await supabase
        .from('tuition_subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscription.id);
      
      // Suspend access if not paid in full
      await suspendCourseAccess(studentId, programId, 'subscription_cancelled');
      await updateEnrollmentStatus(studentId, programId, 'suspended', 'subscription_cancelled');
    }
  }
}

/**
 * Helper: Grant course access
 */
async function grantCourseAccess(
  studentId: string, 
  programId: string, 
  accessLevel: 'full' | 'active'
): Promise<void> {
  await supabase
    .from('program_enrollments')
    .update({ 
      access_status: accessLevel,
      access_granted_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('program_id', programId);
}

/**
 * Helper: Suspend course access
 */
async function suspendCourseAccess(
  studentId: string, 
  programId: string, 
  reason: string
): Promise<void> {
  await supabase
    .from('program_enrollments')
    .update({ 
      access_status: 'suspended',
      suspension_reason: reason,
      suspended_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('program_id', programId);
}

/**
 * Helper: Update enrollment status
 */
async function updateEnrollmentStatus(
  studentId: string, 
  programId: string, 
  status: string,
  paymentStatus: string
): Promise<void> {
  await supabase
    .from('program_enrollments')
    .update({ 
      status,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('program_id', programId);
}
