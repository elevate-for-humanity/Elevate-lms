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
  | 'match_assigned';

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
