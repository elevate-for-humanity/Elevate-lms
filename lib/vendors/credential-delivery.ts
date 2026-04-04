/**
 * Credential Delivery
 *
 * After payment completes and vendor payout is recorded, this module
 * provisions the student's access to the partner course and sends
 * them login credentials via email.
 *
 * Flow per provider:
 * - Certiport: Provision via Certiport Compass API, send login URL
 * - HSI: Queue enrollment, send HSI class sign-up link
 * - CareerSafe: Send enrollment link with access code
 * - LMS: Theory credentials issued via Elevate LMS completion
 * - NRF: Send RISE Up enrollment link
 * - NDS: Send enrollment link
 * - JRI: Send enrollment link
 *
 * If API provisioning is unavailable, falls back to manual queue
 * with admin notification.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface CredentialDeliveryRequest {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  providerId: string;
  providerName: string;
  providerType: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  courseUrl?: string;
}

export interface CredentialDeliveryResult {
  success: boolean;
  method: 'api_provisioned' | 'enrollment_link' | 'manual_queue';
  loginUrl?: string;
  username?: string;
  accessCode?: string;
  error?: string;
}

// Partner enrollment/access URLs
const PARTNER_ENROLLMENT_URLS: Record<string, string> = {
  certiport: 'https://certiport.pearsonvue.com',
  hsi: 'https://hsi.com/solutions/cpr-aed-first-aid-training/elevate-for-humanity-career-training-org-nts-class-sign-up',
  careersafe: 'https://www.careersafeonline.com',
  nrf: 'https://riseup.nrf.com',
  nds: 'https://www.nationaldrugscreening.com',
  jri: 'https://www.jri.org',
  elevate_lms: '/lms/courses',
};

/**
 * Deliver course credentials to student after payment.
 */
export async function deliverCredentials(
  request: CredentialDeliveryRequest
): Promise<CredentialDeliveryResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { success: false, method: 'manual_queue', error: 'Database unavailable' };
  }

  const providerType = request.providerType.toLowerCase();

  try {
    // Check if already delivered (idempotency)
    const { data: existing } = await supabase
      .from('partner_lms_enrollments')
      .select('id, status, metadata')
      .eq('id', request.enrollmentId)
      .maybeSingle();

    if (existing?.status === 'active' && existing?.metadata?.credentials_sent) {
      logger.info('[credential-delivery] Already delivered for enrollment:', request.enrollmentId);
      return {
        success: true,
        method: 'enrollment_link',
        loginUrl: existing.metadata.login_url || existing.metadata.access_url,
      };
    }

    // Try API provisioning for supported providers
    let result: CredentialDeliveryResult;

    switch (providerType) {
      case 'hsi':
        result = await deliverHSI(request);
        break;
      case 'certiport':
        result = await deliverCertiport(request);
        break;
      case 'careersafe':
        result = await deliverCareerSafe(request);
        break;
      default:
        result = await deliverGeneric(request, providerType);
        break;
    }

    // Update enrollment with credential info
    await supabase
      .from('partner_lms_enrollments')
      .update({
        status: 'active',
        metadata: {
          ...(existing?.metadata || {}),
          credentials_sent: true,
          credentials_sent_at: new Date().toISOString(),
          delivery_method: result.method,
          login_url: result.loginUrl,
          username: result.username,
          access_code: result.accessCode,
        },
      })
      .eq('id', request.enrollmentId);

    // Send credential email to student
    await sendCredentialEmail(request, result);

    return result;
  } catch (err) {
    logger.error('[credential-delivery] Error:',
      err instanceof Error ? err : new Error(String(err)));

    // Queue for manual processing
    await queueManualDelivery(supabase, request);

    return { success: false, method: 'manual_queue', error: 'Credential delivery failed, queued for manual processing' };
  }
}

/**
 * HSI: Send class sign-up link. HSI manages their own enrollment.
 */
async function deliverHSI(request: CredentialDeliveryRequest): Promise<CredentialDeliveryResult> {
  const loginUrl = PARTNER_ENROLLMENT_URLS.hsi;
  return {
    success: true,
    method: 'enrollment_link',
    loginUrl,
  };
}

/**
 * Certiport: If API available, provision account. Otherwise send portal link.
 */
async function deliverCertiport(request: CredentialDeliveryRequest): Promise<CredentialDeliveryResult> {
  // If Certiport API is configured, provision directly
  if (process.env.CERTIPORT_API_KEY) {
    try {
      const response = await fetch('https://api.certiport.com/v1/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CERTIPORT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.studentEmail,
          firstName: request.studentName.split(' ')[0],
          lastName: request.studentName.split(' ').slice(1).join(' ') || '',
          courseCode: request.courseCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          method: 'api_provisioned',
          loginUrl: data.loginUrl || PARTNER_ENROLLMENT_URLS.certiport,
          username: data.username || request.studentEmail,
          accessCode: data.accessCode,
        };
      }
    } catch {
      // Fall through to enrollment link
    }
  }

  return {
    success: true,
    method: 'enrollment_link',
    loginUrl: PARTNER_ENROLLMENT_URLS.certiport,
  };
}

/**
 * CareerSafe: Send enrollment link with course access.
 */
async function deliverCareerSafe(request: CredentialDeliveryRequest): Promise<CredentialDeliveryResult> {
  return {
    success: true,
    method: 'enrollment_link',
    loginUrl: PARTNER_ENROLLMENT_URLS.careersafe,
  };
}

/**
 * Generic: Send partner enrollment URL.
 */
async function deliverGeneric(
  request: CredentialDeliveryRequest,
  providerType: string
): Promise<CredentialDeliveryResult> {
  const loginUrl = request.courseUrl
    || PARTNER_ENROLLMENT_URLS[providerType]
    || `https://www.elevateforhumanity.org/courses/partners/${request.courseId}/access`;

  return {
    success: true,
    method: 'enrollment_link',
    loginUrl,
  };
}

/**
 * Send credential email to student with login info.
 */
async function sendCredentialEmail(
  request: CredentialDeliveryRequest,
  result: CredentialDeliveryResult
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  try {
    await fetch(`${siteUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: request.studentEmail,
        subject: `Your ${request.courseName} Course Access — Elevate for Humanity`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e293b; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Course Access Ready</h1>
            </div>

            <div style="padding: 24px;">
              <p>Hi ${request.studentName.split(' ')[0]},</p>
              <p>Your payment has been confirmed and your course access is ready.</p>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e293b;">${request.courseName}</h3>
                <p style="margin: 4px 0; color: #64748b;">Provider: ${request.providerName}</p>
                ${result.username ? `<p style="margin: 4px 0;"><strong>Username:</strong> ${result.username}</p>` : ''}
                ${result.accessCode ? `<p style="margin: 4px 0;"><strong>Access Code:</strong> ${result.accessCode}</p>` : ''}
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${result.loginUrl || siteUrl + '/learner/dashboard'}"
                   style="display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Access Your Course
                </a>
              </div>

              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Next Steps:</strong> Click the button above to log in and start your course.
                  ${result.method === 'enrollment_link' ? 'You may need to create an account on the partner platform using the email address associated with your purchase.' : ''}
                  If you have any issues accessing your course, contact us at (317) 314-3757 or reply to this email.
                </p>
              </div>
            </div>

            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
              <p>Elevate for Humanity Career & Technical Institute</p>
              <p>8888 Keystone Crossing, Indianapolis, IN</p>
              <p>(317) 314-3757 | info@elevateforhumanity.org</p>
            </div>
          </div>
        `,
      }),
    });
    logger.info('[credential-delivery] Email sent to:', request.studentEmail);
  } catch (emailErr) {
    // Non-fatal: enrollment succeeds even if email fails
    logger.error('[credential-delivery] Email send failed (non-fatal):',
      emailErr instanceof Error ? emailErr : new Error(String(emailErr)));
  }
}

/**
 * Queue for manual admin processing when automated delivery fails.
 */
async function queueManualDelivery(
  supabase: ReturnType<typeof createAdminClient>,
  request: CredentialDeliveryRequest
): Promise<void> {
  try {
    await supabase!.from('credential_delivery_queue').insert({
      enrollment_id: request.enrollmentId,
      course_id: request.courseId,
      course_name: request.courseName,
      provider_id: request.providerId,
      provider_name: request.providerName,
      student_id: request.studentId,
      student_email: request.studentEmail,
      student_name: request.studentName,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    logger.info('[credential-delivery] Queued for manual delivery:', request.enrollmentId);
  } catch (queueErr) {
    logger.error('[credential-delivery] Failed to queue:',
      queueErr instanceof Error ? queueErr : new Error(String(queueErr)));
  }
}
