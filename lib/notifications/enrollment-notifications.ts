/**
 * Enrollment Status Notification Service
 * Sends notifications on enrollment status changes
 */

import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type EnrollmentStatus = 
  | 'applied'
  | 'waitlisted'
  | 'onboarding'
  | 'orientation'
  | 'enrolled'
  | 'active'
  | 'pending_funding_verification'
  | 'payment_required'
  | 'suspended'
  | 'revoked'
  | 'withdrawn'
  | 'completed'
  | 'graduated'
  | 'placed';

interface NotificationContext {
  userId: string;
  email: string;
  firstName: string;
  programName: string;
  enrollmentId: string;
  previousStatus?: EnrollmentStatus;
  newStatus: EnrollmentStatus;
  additionalData?: Record<string, unknown>;
}

const STATUS_MESSAGES: Record<EnrollmentStatus, { subject: string; message: string }> = {
  applied: {
    subject: 'Application Received - Next Steps',
    message: `Hi {{firstName}},

Thank you for applying to {{programName}} at {{orgName}}!

We've received your application and our admissions team will review it within 1-2 business days.

What happens next:
1. We'll review your application and funding eligibility
2. You may receive a call to discuss your goals
3. Once approved, you'll be matched with a host shop/salon
4. Orientation will be scheduled

Questions? Reply to this email or call {{supportPhone}}.

Best,
The {{orgName}} Team`,
  },
  waitlisted: {
    subject: 'Application Waitlisted - Keep Watching',
    message: `Hi {{firstName}},

Your application for {{programName}} has been placed on our waitlist.

This usually means we're currently at capacity, but spots often open up. We'll contact you as soon as a spot becomes available.

In the meantime:
• Keep checking your email
• Continue preparing for the program
• Reach out if your situation changes

Thank you for your patience!

Best,
The {{orgName}} Team`,
  },
  onboarding: {
    subject: 'Congratulations! You\'re Accepted - Start Your Journey',
    message: `Hi {{firstName}},

🎉 Congratulations! You've been accepted to {{programName}} at {{orgName}}!

Your next steps:
1. Confirm your enrollment (link in your dashboard)
2. Complete orientation
3. Upload required documents
4. Meet your mentor and host shop

Funding: {{fundingStatus}}

Questions? Your admissions advisor is here to help!

Let's get started!

Best,
The {{orgName}} Team`,
  },
  orientation: {
    subject: 'Orientation Scheduled - Complete Before Starting',
    message: `Hi {{firstName}},

It's time to complete your orientation for {{programName}}!

Orientation covers:
• Program expectations
• How the apprenticeship works
• Your rights and responsibilities
• Safety and compliance training
• Meet your classmates

Complete orientation in your dashboard: {{dashboardUrl}}

After orientation, you'll be ready to start training!

Best,
The {{orgName}} Team`,
  },
  enrolled: {
    subject: 'Documents Required - Complete Enrollment',
    message: `Hi {{firstName}},

You're almost fully enrolled in {{programName}}!

Please upload the following documents:
• Valid driver's license
• Social Security card
• High school diploma/GED (if not yet submitted)
• Any program-specific requirements

Upload in your dashboard: {{dashboardUrl}}

Once documents are verified, your training begins!

Questions? Contact your advisor.

Best,
The {{orgName}} Team`,
  },
  active: {
    subject: 'Training Active - Welcome to Your Journey!',
    message: `Hi {{firstName}},

🚀 Your training is now ACTIVE for {{programName}}!

You now have full access to:
• Your learning dashboard
• Course materials and lessons
• Support from instructors
• Real-world experience at your host shop

Welcome to the {{orgName}} family!

Track your progress: {{dashboardUrl}}

Best,
The {{orgName}} Team`,
  },
  pending_funding_verification: {
    subject: 'Funding Under Review - What to Expect',
    message: `Hi {{firstName}},

Your funding application for {{programName}} is being reviewed.

Timeline: Typically 1-3 business days for WIOA/Workforce Ready Grant verification.

What we're checking:
• Eligibility requirements
• Required documentation
• Voucher availability

In the meantime:
• Keep your documents ready
• Respond quickly to any requests
• Contact your WorkOne office if needed

Questions? Contact {{supportPhone}}.

Best,
The {{orgName}} Team`,
  },
  payment_required: {
    subject: 'Payment Needed to Activate Enrollment',
    message: `Hi {{firstName}},

To activate your enrollment in {{programName}}, we need to process payment.

Your balance: {{balance}}

Payment options:
• Pay in full
• Payment plan (weekly/monthly installments)
• BNPL options available

Complete payment here: {{paymentUrl}}

Questions about funding? Reply to this email.

Best,
The {{orgName}} Team`,
  },
  suspended: {
    subject: 'Enrollment Suspended - Action Required',
    message: `Hi {{firstName}},

Your enrollment in {{programName}} has been temporarily suspended.

This may be due to:
• Missing documentation
• Outstanding balance
• Attendance concerns

Please contact your advisor immediately to resolve this: {{supportPhone}}

We want to help you succeed and get back on track!

Best,
The {{orgName}} Team`,
  },
  revoked: {
    subject: 'Enrollment Status Update',
    message: `Hi {{firstName}},

We're sorry to inform you that your enrollment in {{programName}} has been revoked.

If you believe this is in error or would like to discuss options, please contact us: {{supportEmail}}

We're here to help explore alternatives.

Best,
The {{orgName}} Team`,
  },
  withdrawn: {
    subject: 'Withdrawal Confirmed',
    message: `Hi {{firstName}},

Your withdrawal from {{programName}} has been confirmed.

If you'd like to re-enroll in the future, you're welcome to apply again. We offer rolling admissions.

Questions? We're here to help.

Best,
The {{orgName}} Team`,
  },
  completed: {
    subject: 'Congratulations! Program Complete',
    message: `Hi {{firstName}},

🎓 Congratulations on completing {{programName}} at {{orgName}}!

You've demonstrated:
• Required training hours
• Competency in all skills
• Professional conduct

Next steps:
• Schedule your state licensing exam (if applicable)
• Receive your certificate
• Access career placement services

We're proud of your achievement!

Best,
The {{orgName}} Team`,
  },
  graduated: {
    subject: 'Graduation Day! - Celebrating Your Success',
    message: `Hi {{firstName}},

🎉 CONGRATULATIONS, GRADUATE! 🎉

You've officially graduated from {{programName}} at {{orgName}}!

Your certificate and official transcripts are available in your dashboard.

What's next:
• Career placement services (we're here to help!)
• Industry events and networking
• Alumni community access

Thank you for choosing {{orgName}}!

Best,
The {{orgName}} Team`,
  },
  placed: {
    subject: 'Placement Confirmed - Your Career Starts Now',
    message: `Hi {{firstName}},

🏆 Congratulations on your new position!

Through {{orgName}}'s career placement services, you've been successfully placed!

Your next chapter begins now. Remember:
• Keep networking with your cohort
• Continue learning and growing
• Reach out if you ever need support

We're cheering for your success!

Best,
The {{orgName}} Team`,
  },
};

export async function sendEnrollmentNotification(
  context: NotificationContext
): Promise<void> {
  const {
    email,
    firstName,
    programName,
    newStatus,
    previousStatus,
    additionalData = {},
  } = context;

  const statusConfig = STATUS_MESSAGES[newStatus];
  if (!statusConfig) {
    logger.warn('[notification] Unknown status', { status: newStatus });
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  
  // Build message with placeholders
  const message = statusConfig.message
    .replace(/\{\{firstName\}\}/g, firstName || 'there')
    .replace(/\{\{programName\}\}/g, programName)
    .replace(/\{\{orgName\}\}/g, PLATFORM_DEFAULTS.orgName)
    .replace(/\{\{supportPhone\}\}/g, PLATFORM_DEFAULTS.supportPhone)
    .replace(/\{\{supportEmail\}\}/g, PLATFORM_DEFAULTS.supportEmail || 'admissions@elevateforhumanity.org')
    .replace(/\{\{dashboardUrl\}\}/g, `${siteUrl}/lms/dashboard`)
    .replace(/\{\{paymentUrl\}\}/g, `${siteUrl}/lms/payments`)
    .replace(/\{\{balance\}\}/g, additionalData.balance ? `$${additionalData.balance}` : 'TBD')
    .replace(/\{\{fundingStatus\}\}/g, additionalData.fundingStatus as string || 'Contact admissions');

  // Log notification
  logger.info('[notification] Sending enrollment status email', {
    email,
    status: newStatus,
    previousStatus,
  });

  // Send email
  try {
    await sendEmail({
      to: email,
      subject: statusConfig.subject,
      html: `<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px;">
          <img src="${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="${PLATFORM_DEFAULTS.orgName}" style="max-width: 160px;">
        </div>
        <div style="padding: 20px; background: #f9f9f9; border-radius: 8px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>${PLATFORM_DEFAULTS.orgName}</p>
          <p>8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
          <p><a href="${siteUrl}">${PLATFORM_DEFAULTS.canonicalDomain}</a> | ${PLATFORM_DEFAULTS.supportPhone}</p>
        </div>
      </body></html>`,
    });
  } catch (error) {
    logger.error('[notification] Failed to send email', error);
  }
}

// Hook for enrollment status changes
export async function onEnrollmentStatusChange(
  context: NotificationContext
): Promise<void> {
  // Send notification to student
  await sendEnrollmentNotification(context);

  // Log status change for audit
  logger.info('[enrollment] Status changed', {
    userId: context.userId,
    enrollmentId: context.enrollmentId,
    from: context.previousStatus,
    to: context.newStatus,
  });
}
