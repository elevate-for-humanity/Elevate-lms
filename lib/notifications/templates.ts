/**
 * Email Templates for Notification System
 * 
 * Concise, compliant templates with HTML + text fallback.
 * Do not imply licensure approval; include disclaimer where relevant.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export type TemplateKey =
  | 'inquiry_received'
  | 'apprentice_submission_received'
  | 'hostshop_submission_received'
  | 'document_rejected'
  | 'document_verified'
  | 'hostshop_decision'
  | 'apprentice_decision'
  | 'transfer_evaluated'
  | 'match_assigned'
  | 'employer_application_received'
  | 'employer_decision'
  | 'employer_activated'
  | 'partner_approved';

const BRAND_COLOR = '#7c3aed';
const SUPPORT_EMAIL = 'support@elevateforhumanity.org';
const SUPPORT_PHONE = '(317) 314-3757';

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${content}
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">
    Questions? Reply to this email or call ${SUPPORT_PHONE}<br>
    Elevate for Humanity | Indianapolis, IN
  </p>
</body>
</html>
`;
}

function button(text: string, url: string): string {
  return `
<p style="text-align: center; margin: 24px 0;">
  <a href="${url}" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">${text}</a>
</p>
`;
}

export function getTemplate(key: TemplateKey, data: Record<string, any>): EmailTemplate {
  switch (key) {
    case 'inquiry_received':
      return {
        subject: 'We received your inquiry',
        html: baseTemplate(`
          <h2 style="color: ${BRAND_COLOR};">We received your inquiry</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thanks for reaching out! We received your ${data.inquiry_type || 'inquiry'} and will get back to you within 1-2 business days.</p>
          <p>In the meantime, you can explore our programs at <a href="${data.site_url}">${data.site_url}</a></p>
        `),
        text: `We received your inquiry

Hi ${data.name || 'there'},

Thanks for reaching out! We received your ${data.inquiry_type || 'inquiry'} and will get back to you within 1-2 business days.

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'apprentice_submission_received':
      return {
        subject: 'We received your application',
        html: baseTemplate(`
          <h2 style="color: ${BRAND_COLOR};">We received your application</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thanks — we received your apprenticeship application.</p>
          <p><strong>Next step:</strong> Upload required documents so we can verify and move your application forward.</p>
          ${button('Continue Application →', data.continue_url)}
          <p style="font-size: 14px; color: #666;">If you have questions, reply to this email.</p>
        `),
        text: `We received your application

Hi ${data.name || 'there'},

Thanks — we received your apprenticeship application.

Next step: Upload required documents so we can verify and move your application forward.

Continue here: ${data.continue_url}

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'hostshop_submission_received':
      return {
        subject: 'We received your host shop application',
        html: baseTemplate(`
          <h2 style="color: ${BRAND_COLOR};">We received your application</h2>
          <p>Hi,</p>
          <p>Thanks — we received your host shop application for <strong>${data.shop_name}</strong>.</p>
          <p><strong>Next step:</strong> Upload required documents (licenses, MOU) so we can verify and move your application forward.</p>
          ${button('Continue Application →', data.continue_url)}
          <p style="font-size: 14px; color: #666;">If you have questions, reply to this email.</p>
        `),
        text: `We received your host shop application

Hi,

Thanks — we received your host shop application for ${data.shop_name}.

Next step: Upload required documents (licenses, MOU) so we can verify and move your application forward.

Continue here: ${data.continue_url}

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'document_rejected':
      return {
        subject: 'Action needed: document re-upload',
        html: baseTemplate(`
          <h2 style="color: #dc2626;">Action needed: document re-upload</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>We reviewed your document and it needs to be re-uploaded.</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Document:</strong> ${data.document_type}</p>
            <p style="margin: 8px 0 0;"><strong>Reason:</strong> ${data.rejection_reason}</p>
          </div>
          ${button('Re-upload Document →', data.reupload_url)}
          <p style="font-size: 14px; color: #666;">This link expires in 7 days. If you have questions, reply to this email.</p>
        `),
        text: `Action needed: document re-upload

Hi ${data.name || 'there'},

We reviewed your document and it needs to be re-uploaded.

Document: ${data.document_type}
Reason: ${data.rejection_reason}

Re-upload here: ${data.reupload_url}

This link expires in 7 days. Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'document_verified':
      return {
        subject: 'Documents verified',
        html: baseTemplate(`
          <h2 style="color: #16a34a;">Documents verified</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>Your <strong>${data.document_type}</strong> has been verified.</p>
          <p><strong>Next step:</strong> ${data.next_step}</p>
          ${data.continue_url ? button('Continue →', data.continue_url) : ''}
        `),
        text: `Documents verified

Hi ${data.name || 'there'},

Your ${data.document_type} has been verified.

Next step: ${data.next_step}

${data.continue_url ? `Continue here: ${data.continue_url}` : ''}

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'hostshop_decision':
      if (data.approved) {
        return {
          subject: 'Host shop approved',
          html: baseTemplate(`
            <h2 style="color: #16a34a;">Host shop approved</h2>
            <p>Congratulations!</p>
            <p>Your shop <strong>${data.shop_name}</strong> has been approved to participate as a Host Shop in our apprenticeship program.</p>
            <p><strong>Next step:</strong> Complete onboarding details to start hosting apprentices.</p>
            ${button('Complete Onboarding →', data.onboarding_url)}
          `),
          text: `Host shop approved

Congratulations!

Your shop ${data.shop_name} has been approved to participate as a Host Shop in our apprenticeship program.

Next step: Complete onboarding details to start hosting apprentices.

Complete onboarding here: ${data.onboarding_url}

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
        };
      } else {
        return {
          subject: 'Host shop application update',
          html: baseTemplate(`
            <h2 style="color: #dc2626;">Application not approved</h2>
            <p>Hi,</p>
            <p>After review, we were unable to approve your host shop application for <strong>${data.shop_name}</strong> at this time.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>If you believe this was in error or have questions, please reply to this email.</p>
          `),
          text: `Host shop application update

Hi,

After review, we were unable to approve your host shop application for ${data.shop_name} at this time.

${data.reason ? `Reason: ${data.reason}` : ''}

If you believe this was in error or have questions, please reply to this email or call ${SUPPORT_PHONE}`,
        };
      }

    case 'apprentice_decision':
      if (data.approved) {
        return {
          subject: 'Enrollment approved - Start Your Theory Training',
          html: baseTemplate(`
            <h2 style="color: #16a34a;">Enrollment Approved!</h2>
            <p>Hi ${data.name || 'there'},</p>
            <p>Your apprenticeship enrollment has been approved. You now have full access to the student portal and can begin your training.</p>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: ${BRAND_COLOR}; margin-top: 0;">Start Your Theory Training (Milady RISE)</h3>
              <p style="margin-bottom: 16px;">Your theory training through Milady RISE is included in your program. This is required coursework for your apprenticeship.</p>
              <p style="margin-bottom: 8px;"><strong>To access Milady:</strong></p>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Go to your Student Dashboard</li>
                <li>Click "Open Milady RISE" on the purple card</li>
                <li>Create your Milady account or sign in</li>
                <li>Begin your theory coursework</li>
              </ol>
              <p style="margin-top: 16px;"><strong>Direct Milady Login:</strong> <a href="https://www.miladytraining.com/users/sign_in" style="color: ${BRAND_COLOR};">miladytraining.com/users/sign_in</a></p>
            </div>
            
            ${button('Access Student Portal →', data.portal_url)}
            <p style="font-size: 12px; color: #666;">Note: This approval is for program enrollment. Licensure eligibility is determined by the Indiana Professional Licensing Agency (IPLA) based on completion of all program requirements.</p>
          `),
          text: `Enrollment Approved - Start Your Theory Training

Hi ${data.name || 'there'},

Your apprenticeship enrollment has been approved. You now have full access to the student portal and can begin your training.

START YOUR THEORY TRAINING (MILADY RISE)
Your theory training through Milady RISE is included in your program. This is required coursework for your apprenticeship.

To access Milady:
1. Go to your Student Dashboard
2. Click "Open Milady RISE" on the purple card
3. Create your Milady account or sign in
4. Begin your theory coursework

Direct Milady Login: https://www.miladytraining.com/users/sign_in

Access portal here: ${data.portal_url}

Note: This approval is for program enrollment. Licensure eligibility is determined by the Indiana Professional Licensing Agency (IPLA) based on completion of all program requirements.

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
        };
      } else {
        return {
          subject: 'Enrollment application update',
          html: baseTemplate(`
            <h2 style="color: #dc2626;">Application not approved</h2>
            <p>Hi ${data.name || 'there'},</p>
            <p>After review, we were unable to approve your apprenticeship enrollment at this time.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>If you believe this was in error or have questions, please reply to this email.</p>
          `),
          text: `Enrollment application update

Hi ${data.name || 'there'},

After review, we were unable to approve your apprenticeship enrollment at this time.

${data.reason ? `Reason: ${data.reason}` : ''}

If you believe this was in error or have questions, please reply to this email or call ${SUPPORT_PHONE}`,
        };
      }

    case 'transfer_evaluated':
      return {
        subject: 'Transfer hours evaluated',
        html: baseTemplate(`
          <h2 style="color: ${BRAND_COLOR};">Transfer hours evaluated</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>We evaluated your submitted transfer hours.</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Accepted hours credited:</strong> ${data.accepted_hours}</p>
            <p style="margin: 8px 0 0;"><strong>Hours remaining toward program requirement:</strong> ${data.remaining_hours}</p>
          </div>
          <p>If anything looks incorrect, reply to this email.</p>
        `),
        text: `Transfer hours evaluated

Hi ${data.name || 'there'},

We evaluated your submitted transfer hours.

Accepted hours credited: ${data.accepted_hours}
Hours remaining toward program requirement: ${data.remaining_hours}

If anything looks incorrect, reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'match_assigned':
      if (data.recipient_type === 'apprentice') {
        return {
          subject: 'You have been matched with a host shop',
          html: baseTemplate(`
            <h2 style="color: ${BRAND_COLOR};">You have been matched!</h2>
            <p>Hi ${data.name || 'there'},</p>
            <p>You have been matched with a host shop for your apprenticeship training.</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Host Shop:</strong> ${data.shop_name}</p>
              <p style="margin: 8px 0 0;"><strong>Start Date:</strong> ${data.start_date}</p>
            </div>
            <p>Your host shop will contact you with additional details. If you have questions, reply to this email.</p>
          `),
          text: `You have been matched with a host shop

Hi ${data.name || 'there'},

You have been matched with a host shop for your apprenticeship training.

Host Shop: ${data.shop_name}
Start Date: ${data.start_date}

Your host shop will contact you with additional details. Questions? Reply to this email or call ${SUPPORT_PHONE}`,
        };
      } else {
        return {
          subject: 'New apprentice assigned to your shop',
          html: baseTemplate(`
            <h2 style="color: ${BRAND_COLOR};">New apprentice assigned</h2>
            <p>Hi,</p>
            <p>A new apprentice has been assigned to <strong>${data.shop_name}</strong>.</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Apprentice:</strong> ${data.apprentice_name}</p>
              <p style="margin: 8px 0 0;"><strong>Start Date:</strong> ${data.start_date}</p>
            </div>
            <p>Please reach out to the apprentice to coordinate their first day. If you have questions, reply to this email.</p>
          `),
          text: `New apprentice assigned to your shop

Hi,

A new apprentice has been assigned to ${data.shop_name}.

Apprentice: ${data.apprentice_name}
Start Date: ${data.start_date}

Please reach out to the apprentice to coordinate their first day. Questions? Reply to this email or call ${SUPPORT_PHONE}`,
        };
      }

    case 'employer_application_received':
      return {
        subject: 'Application Received — Elevate for Humanity Employer Partnership',
        html: baseTemplate(`
          <h2 style="color: ${BRAND_COLOR};">Application Received</h2>
          <p>Dear ${data.contact_name},</p>
          <p>Thank you for applying to become an employer partner with Elevate for Humanity. We received your application for <strong>${data.business_name}</strong>.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What happens next</h3>
            <ol style="padding-left: 20px;">
              <li>Our team reviews your application (typically 2–3 business days)</li>
              <li>If approved, you'll receive an onboarding email with required documents</li>
              <li>Complete onboarding to activate your employer portal</li>
            </ol>
          </div>

          <h3>Documents you'll need ready</h3>
          <ul>
            <li>Signed Employer Partnership Agreement (MOU)</li>
            <li>Certificate of Insurance — General Liability</li>
            <li>Workers' Compensation proof (if hosting apprentices)</li>
            <li>Business license or registration</li>
            <li>Tax ID (EIN)</li>
            <li>Supervisor/mentor designation</li>
          </ul>

          <h3>Employer partner benefits</h3>
          <ul>
            <li>Access pre-screened, trained candidates at no recruitment cost</li>
            <li>OJT wage reimbursement pathways (WIOA, apprenticeship)</li>
            <li>Work Opportunity Tax Credits (WOTC) — $2,400 to $9,600 per qualified hire</li>
            <li>Dedicated employer portal for hours tracking, compliance, and reporting</li>
            <li>Apprenticeship program support and DOL alignment</li>
          </ul>

          <p>Questions? Reply to this email or call ${SUPPORT_PHONE}.</p>
        `),
        text: `Application Received

Dear ${data.contact_name},

Thank you for applying to become an employer partner with Elevate for Humanity. We received your application for ${data.business_name}.

What happens next:
1. Our team reviews your application (typically 2-3 business days)
2. If approved, you'll receive an onboarding email with required documents
3. Complete onboarding to activate your employer portal

Documents you'll need ready:
- Signed Employer Partnership Agreement (MOU)
- Certificate of Insurance — General Liability
- Workers' Compensation proof (if hosting apprentices)
- Business license or registration
- Tax ID (EIN)
- Supervisor/mentor designation

Employer partner benefits:
- Access pre-screened, trained candidates at no recruitment cost
- OJT wage reimbursement pathways (WIOA, apprenticeship)
- Work Opportunity Tax Credits (WOTC) — $2,400 to $9,600 per qualified hire
- Dedicated employer portal for hours tracking, compliance, and reporting
- Apprenticeship program support and DOL alignment

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'employer_activated':
      return {
        subject: 'Welcome to Elevate for Humanity — Your Employer Portal Is Live',
        html: baseTemplate(`
          <h2 style="color: #16a34a;">Welcome to Elevate for Humanity</h2>
          <p>Dear ${data.contact_name},</p>
          <p>Congratulations! <strong>${data.business_name}</strong> has completed all onboarding requirements. Your employer portal is now fully activated.</p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0;">What you can do now</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Employer Dashboard</strong> — View hiring activity, apprentice placements, and compliance status</li>
              <li><strong>Hours Tracking</strong> — Review and approve apprentice OJL hours</li>
              <li><strong>Post Jobs</strong> — List open positions for pre-screened candidates</li>
              <li><strong>Documents</strong> — Manage insurance, agreements, and compliance files</li>
              <li><strong>Reports</strong> — Access workforce outcome and retention data</li>
            </ul>
          </div>

          ${button('Go to Your Dashboard →', 'https://www.elevateforhumanity.org/employer/dashboard')}

          <h3>Employer Partner Benefits</h3>
          <ul>
            <li>Pre-screened, trained candidates at no recruitment cost</li>
            <li>OJT wage reimbursement pathways (WIOA, apprenticeship)</li>
            <li>Work Opportunity Tax Credits (WOTC) — $2,400 to $9,600 per qualified hire</li>
            <li>Dedicated support from the Elevate team</li>
          </ul>

          <p>Thank you for partnering with Elevate for Humanity. Together, we are building real career pathways.</p>
          <p style="font-size: 13px; color: #666;">Questions? Reply to this email or call ${SUPPORT_PHONE}.</p>
        `),
        text: `Welcome to Elevate for Humanity

Dear ${data.contact_name},

Congratulations! ${data.business_name} has completed all onboarding requirements. Your employer portal is now fully activated.

What you can do now:
- Employer Dashboard — View hiring activity, apprentice placements, and compliance status
- Hours Tracking — Review and approve apprentice OJL hours
- Post Jobs — List open positions for pre-screened candidates
- Documents — Manage insurance, agreements, and compliance files
- Reports — Access workforce outcome and retention data

Go to your dashboard: https://www.elevateforhumanity.org/employer/dashboard

Employer Partner Benefits:
- Pre-screened, trained candidates at no recruitment cost
- OJT wage reimbursement pathways (WIOA, apprenticeship)
- Work Opportunity Tax Credits (WOTC) — $2,400 to $9,600 per qualified hire
- Dedicated support from the Elevate team

Thank you for partnering with Elevate for Humanity.

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };

    case 'employer_decision':
      if (data.approved) {
        return {
          subject: 'Approved — Complete Your Employer Onboarding',
          html: baseTemplate(`
            <h2 style="color: #16a34a;">Application Approved</h2>
            <p>Dear ${data.contact_name},</p>
            <p>Your employer partnership application for <strong>${data.business_name}</strong> has been approved.</p>

            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0;">Complete these steps to activate your portal</h3>
              <ol style="padding-left: 20px;">
                <li><strong>Sign the Employer Partnership Agreement</strong> — Review and e-sign your MOU</li>
                <li><strong>Upload Insurance Documents</strong> — General Liability COI and Workers' Comp (if applicable)</li>
                <li><strong>Verify Business Information</strong> — EIN, business license, worksite address</li>
                <li><strong>Designate a Supervisor</strong> — Name the person who will oversee apprentices/trainees</li>
              </ol>
            </div>

            ${button('Start Onboarding →', data.onboarding_url)}

            <p style="font-size: 13px; color: #666;">Your portal will be fully activated once all required documents are submitted and verified. This typically takes 1–2 business days after submission.</p>
          `),
          text: `Application Approved

Dear ${data.contact_name},

Your employer partnership application for ${data.business_name} has been approved.

Complete these steps to activate your portal:
1. Sign the Employer Partnership Agreement (MOU)
2. Upload Insurance Documents — General Liability COI and Workers' Comp
3. Verify Business Information — EIN, business license, worksite address
4. Designate a Supervisor for apprentices/trainees

Start onboarding: ${data.onboarding_url}

Your portal will be fully activated once all required documents are submitted and verified.

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
        };
      } else {
        return {
          subject: 'Application Update — Elevate for Humanity',
          html: baseTemplate(`
            <h2 style="color: #dc2626;">Application Not Approved</h2>
            <p>Dear ${data.contact_name},</p>
            <p>After review, we are unable to approve the employer partnership application for <strong>${data.business_name}</strong> at this time.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>If you believe this was in error or your circumstances have changed, please contact us to discuss next steps.</p>
          `),
          text: `Application Not Approved

Dear ${data.contact_name},

After review, we are unable to approve the employer partnership application for ${data.business_name} at this time.
${data.reason ? `Reason: ${data.reason}` : ''}

If you believe this was in error or your circumstances have changed, please contact us.

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
        };
      }

    case 'partner_approved':
      return {
        subject: 'Partner Onboarding \u2014 You\'re Approved',
        html: baseTemplate(`
          <h2 style="color: #16a34a;">Welcome to the Elevate Apprenticeship Network</h2>
          <p>Hi ${data.owner_name || 'there'},</p>
          <p>Your partner application has been <strong>approved</strong>. Your shop is now an authorized training site in the Elevate for Humanity Barber Apprenticeship Program.</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: ${BRAND_COLOR}; margin-top: 0;">Onboarding Checklist</h3>
            <p style="margin-bottom: 12px;">Complete these steps to begin receiving apprentices:</p>
            <ol style="margin: 0; padding-left: 20px; line-height: 2;">
              <li><strong>Sign in to your Partner Portal</strong> using the link below</li>
              <li><strong>Upload your Certificate of Insurance (COI)</strong> &mdash; must show Commercial General Liability ($1M/$2M) with &quot;Elevate for Humanity&quot; as Certificate Holder</li>
              <li><strong>Sign the Memorandum of Understanding (MOU)</strong> &mdash; available in your portal</li>
              <li><strong>Confirm your supervising barber</strong> &mdash; name, license number, and availability</li>
              <li><strong>Set your apprentice capacity</strong> &mdash; how many apprentices your shop can host at once</li>
            </ol>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Insurance requirement:</strong> Your COI must be on file and approved before apprentices can be placed at your shop. Ask your insurance agent for an ACORD 25 certificate naming &quot;Elevate for Humanity&quot; as Certificate Holder.</p>
          </div>

          ${button('Sign In to Partner Portal \u2192', data.login_link || 'https://www.elevateforhumanity.org/login')}

          <p><strong>What happens next:</strong></p>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li>Once onboarding is complete, your shop will be listed as an active training site</li>
            <li>We will match apprentices to your shop based on location and capacity</li>
            <li>You will receive a notification when an apprentice is assigned</li>
          </ul>

          <p style="font-size: 14px; color: #666;">If you have questions about onboarding, insurance requirements, or the program, reply to this email or call ${SUPPORT_PHONE}.</p>
        `),
        text: `Partner Onboarding \u2014 You're Approved\n\nHi ${data.owner_name || 'there'},\n\nYour partner application has been approved. Your shop is now an authorized training site in the Elevate for Humanity Barber Apprenticeship Program.\n\nONBOARDING CHECKLIST\n1. Sign in to your Partner Portal: ${data.login_link || 'https://www.elevateforhumanity.org/login'}\n2. Upload your Certificate of Insurance (COI) \u2014 Commercial General Liability ($1M/$2M) with "Elevate for Humanity" as Certificate Holder\n3. Sign the Memorandum of Understanding (MOU)\n4. Confirm your supervising barber\n5. Set your apprentice capacity\n\nINSURANCE REQUIREMENT: Your COI must be on file and approved before apprentices can be placed. Ask your insurance agent for an ACORD 25 certificate naming "Elevate for Humanity" as Certificate Holder.\n\nQuestions? Reply to this email or call ${SUPPORT_PHONE}\n\nElevate for Humanity | Indianapolis, IN`,
      };

    default:
      return {
        subject: 'Notification from Elevate for Humanity',
        html: baseTemplate(`
          <p>You have a new notification. Please log in to view details.</p>
        `),
        text: `You have a new notification. Please log in to view details.

Questions? Reply to this email or call ${SUPPORT_PHONE}`,
      };
  }
}
