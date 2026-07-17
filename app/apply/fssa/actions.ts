'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { headers } from 'next/headers';

export interface FssaApplicationData {
  // Personal
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  // Benefits
  receivesSnap: boolean;
  receivesTanf: boolean;
  snapCaseNumber: string;
  tanfCaseNumber: string;
  // Case manager
  hasCaseManager: boolean;
  caseManagerName: string;
  caseManagerAgency: string;
  caseManagerPhone: string;
  caseManagerEmail: string;
  // Program
  programInterest: string;
  educationLevel: string;
  employed: boolean;
  employerName: string;
  // Barriers
  transportation: string;
  childcare: boolean;
  housingStable: boolean;
  additionalBarriers: string;
  // Consent
  consentTruth: boolean;
  consentContact: boolean;
  consentRelease: boolean;
  signature: string;
}

export async function submitFssaApplication(
  data: FssaApplicationData,
): Promise<{ success: boolean; error?: string; applicationId?: string }> {
  try {
    // Rate limit: max 3 submissions per 5 minutes per IP
    const headersList = await headers();
    const syntheticRequest = new Request('https://elevateforhumanity.org/apply/fssa', {
      headers: headersList,
    });
    const rateLimited = await applyRateLimit(syntheticRequest, 'contact');
    if (rateLimited) {
      return { success: false, error: 'Too many submissions. Please wait a few minutes and try again.' };
    }

    const supabase = await requireAdminClient();

    const fssaRef = `EFH-${Date.now().toString(36).toUpperCase()}`;
    const normalizedFssaEmail = data.email.toLowerCase().trim();

    // Resolve program_id from slug
    const fssaProgramSlug = data.programInterest.toLowerCase().replace(/\s+/g, '-').trim();
    const { data: fssaProgramRow } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', fssaProgramSlug)
      .maybeSingle();

    const { data: inserted, error } = await supabase
      .from('applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        normalized_email: normalizedFssaEmail,
        normalized_phone: data.phone.replace(/\D/g, ''),
        date_of_birth: data.dateOfBirth || null,
        address: data.streetAddress,
        city: data.city,
        state: data.state || 'IN',
        zip: data.zipCode,             // NOT NULL column
        zip_code: data.zipCode,        // nullable alias
        program_interest: data.programInterest,
        program_id: fssaProgramRow?.id || null,
        reference_number: fssaRef,
        funding_source: 'fssa_impact',
        funding_type: 'fssa',
        application_type: 'fssa',
        type: 'student',
        source: 'fssa-form',
        status: 'submitted',           // matches applications_status_check constraint
        metadata: {
          receivesSnap: data.receivesSnap,
          receivesTanf: data.receivesTanf,
          snapCaseNumber: data.snapCaseNumber,
          tanfCaseNumber: data.tanfCaseNumber,
          hasCaseManager: data.hasCaseManager,
          caseManagerName: data.caseManagerName,
          caseManagerAgency: data.caseManagerAgency,
          caseManagerPhone: data.caseManagerPhone,
          caseManagerEmail: data.caseManagerEmail,
          educationLevel: data.educationLevel,
          employed: data.employed,
          employerName: data.employerName,
          transportation: data.transportation,
          childcare: data.childcare,
          housingStable: data.housingStable,
          additionalBarriers: data.additionalBarriers,
          signature: data.signature,
          submittedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error) {
      logger.error('[fssa-apply] DB error', { message: error.message, code: error.code });
      return { success: false, error: 'Submission failed. Please try again or call us.' };
    }

    const applicationDetails = `
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}
Program: ${data.programInterest}
SNAP: ${data.receivesSnap ? 'Yes' : 'No'}${data.snapCaseNumber ? ` (Case: ${data.snapCaseNumber})` : ''}
TANF: ${data.receivesTanf ? 'Yes' : 'No'}${data.tanfCaseNumber ? ` (Case: ${data.tanfCaseNumber})` : ''}
Case Manager: ${data.hasCaseManager ? `${data.caseManagerName} — ${data.caseManagerAgency} | ${data.caseManagerPhone} | ${data.caseManagerEmail}` : 'None listed'}
Education: ${data.educationLevel}
Transportation: ${data.transportation}
Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET
    `.trim();

    // Notify Elevate admin
    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      subject: `New FSSA IMPACT Application — ${data.firstName} ${data.lastName}`,
      html: `<pre style="font-family:monospace;font-size:14px">${applicationDetails}</pre><br><a href="https://www.elevateforhumanity.org/admin/applications">Review in Admin →</a>`,
      text: `${applicationDetails}\n\nReview at: https://www.elevateforhumanity.org/admin/applications`,
    }).catch((err) => logger.error('[fssa-apply] Failed to send admin notification email', { error: String(err) }));

    // FSSA/DFR IMPACT 50 mailbox notification — archived 2026-07
    // Direct email to IMPACT50@fssa.IN.gov is no longer sent.
    // Elevate coordinates with FSSA case managers directly after eligibility review.

    // Confirm receipt to applicant
    if (data.email) {
      await sendEmail({
        to: data.email,
        subject: 'Application Received — FSSA IMPACT Program | Elevate for Humanity',
        html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#1e293b">Application Received</h2>
  <p>Hi ${data.firstName},</p>
  <p>We received your application for the <strong>FSSA IMPACT</strong> workforce training program. Here's what happens next:</p>
  <ol>
    <li><strong>Eligibility review</strong> — Our team will review your application and verify your SNAP/TANF status.</li>
    <li><strong>Case manager coordination</strong> — If you have an IMPACT case manager, we will contact them to confirm funding authorization.</li>
    <li><strong>Enrollment decision</strong> — You will hear from us within <strong>1–2 business days</strong> by phone or email.</li>
  </ol>
  <p>If you have questions in the meantime, call us at <a href="tel:+13175594999">(317) 559-4999</a> or email <a href="mailto:enroll@elevateforhumanity.org">enroll@elevateforhumanity.org</a>.</p>
  <p style="color:#64748b;font-size:13px">This application does not guarantee enrollment. Final acceptance is based on eligibility, funding approval, and program capacity.</p>
  <p>— Elevate for Humanity</p>
</div>
        `.trim(),
        text: `Hi ${data.firstName},\n\nWe received your FSSA IMPACT application. Here's what happens next:\n\n1. Eligibility review — Our team will review your application and verify your SNAP/TANF status.\n2. Case manager coordination — If you have an IMPACT case manager, we will contact them to confirm funding authorization.\n3. Enrollment decision — You will hear from us within 1–2 business days by phone or email.\n\nQuestions? Call (317) 559-4999 or email enroll@elevateforhumanity.org.\n\nThis application does not guarantee enrollment.\n\n— Elevate for Humanity`,
      }).catch((err) => logger.error('[fssa-apply] Failed to send applicant confirmation email', { email: data.email, error: String(err) }));
    }

    return { success: true, applicationId: inserted.id };
  } catch (err) {
    logger.error('[fssa-apply] Unexpected error', { error: String(err) });
    return { success: false, error: 'An unexpected error occurred. Please call us at (317) 559-4999.' };
  }
}
