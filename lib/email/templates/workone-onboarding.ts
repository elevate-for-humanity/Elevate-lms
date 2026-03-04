/**
 * WorkOne Program Onboarding Email
 *
 * Sent to applicants who applied for programs that go through WorkOne
 * (CNA, HVAC, CDL, Phlebotomy, Cybersecurity, Electrical, etc.)
 *
 * Purpose:
 * - Confirm their application was received
 * - Ensure they complete WorkOne eligibility steps
 * - Schedule onboarding Zoom orientation
 * - Welcome them to the program
 */

export interface WorkOneOnboardingData {
  firstName: string;
  programName: string;
  applicantEmail: string;
  calendlyLink?: string;
}

const baseStyles = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937;`;
const buttonStyle = `display: inline-block; padding: 14px 28px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;`;

export function workoneOnboardingEmail(data: WorkOneOnboardingData) {
  const calendlyLink = data.calendlyLink || 'https://calendly.com/elevate4humanityedu/30min';

  return {
    subject: `Next Steps for Your ${data.programName} Application — Elevate for Humanity`,
    html: `
<div style="${baseStyles} max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: #1e293b; padding: 28px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Elevate for Humanity</h1>
    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Career & Technical Institute — Indianapolis, IN</p>
  </div>

  <!-- Body -->
  <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi ${data.firstName},</p>

    <p>Thank you for applying to the <strong>${data.programName}</strong> program at Elevate for Humanity. We received your application and are excited to help you get started.</p>

    <p>Before we can enroll you in training, there are a few steps you need to complete through <strong>WorkOne</strong>. This is required for funded training programs.</p>

    <!-- Steps Box -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">Required Steps to Complete</h3>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 1: Register on Indiana Career Connect</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Create a free account at <a href="https://www.indianacareerconnect.com" style="color: #ea580c;">indianacareerconnect.com</a>. You will need your ID and Social Security number. This takes about 10 minutes.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 2: Schedule a WorkOne Appointment</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Call or visit your local <a href="https://www.in.gov/dwd/workone/workone-locations/" style="color: #ea580c;">WorkOne center</a> to schedule an eligibility meeting. Tell them you are enrolling in training with Elevate for Humanity and need WIOA or WRG eligibility determination.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 3: Complete Eligibility with Your Case Manager</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Your WorkOne case manager will review your eligibility for funded training. Bring your ID, proof of income, and any relevant documents. Once approved, your case manager will issue a training voucher or ITA (Individual Training Account).</p>
      </div>

      <div>
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 4: Schedule Your Onboarding Orientation</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Once your WorkOne steps are complete, schedule a 30-minute Getting Started orientation with us. We will walk you through the program, answer questions, and get you set up.</p>
      </div>
    </div>

    <!-- Orientation Scheduling -->
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin-top: 0; color: #92400e; font-size: 15px;">Schedule Your Orientation</h3>
      <p style="margin: 4px 0; font-size: 14px; color: #92400e;"><strong>Format:</strong> 30-minute Zoom video call</p>
      <p style="margin: 4px 0; font-size: 14px; color: #92400e;"><strong>Step 1:</strong> Pick a time that works for you</p>
      <p style="margin: 4px 0; font-size: 14px; color: #92400e;"><strong>Step 2:</strong> Join the Zoom meeting at your scheduled time</p>
      <p style="margin: 4px 0; font-size: 14px; color: #92400e;"><strong>Zoom Meeting ID:</strong> 167 4915 6017</p>
      <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="${calendlyLink}" style="${buttonStyle}">Schedule a Time</a>
        <a href="https://us06web.zoom.us/j/16749156017" style="${buttonStyle} background: #2563eb;">Join Zoom Meeting</a>
      </div>
    </div>

    <!-- Important Note -->
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>Important:</strong> Please complete Steps 1-3 with WorkOne <em>before</em> attending orientation. We need your WorkOne eligibility confirmation to finalize your enrollment. If you have already completed these steps, let us know and we will move you forward.
      </p>
    </div>

    <p>If you have questions or need help with any of these steps, contact us:</p>

    <ul style="color: #4b5563; font-size: 14px;">
      <li>Phone: <strong>(317) 314-3757</strong></li>
      <li>Email: <a href="mailto:info@elevateforhumanity.org" style="color: #ea580c;">info@elevateforhumanity.org</a></li>
      <li>Text: (317) 314-3757</li>
    </ul>

    <p>We look forward to working with you.</p>

    <p style="margin-top: 24px;">
      <strong>Elevate for Humanity</strong><br>
      <span style="font-size: 14px; color: #64748b;">Career & Technical Institute</span>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px;">
    <p style="margin: 0;">Elevate for Humanity | 8888 Keystone Crossing, Indianapolis, IN</p>
    <p style="margin: 4px 0 0;">(317) 314-3757 | info@elevateforhumanity.org</p>
    <p style="margin: 8px 0 0;"><a href="https://www.elevateforhumanity.org" style="color: #ea580c;">www.elevateforhumanity.org</a></p>
  </div>
</div>
    `.trim(),
  };
}
