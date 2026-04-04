/**
 * Barber Apprenticeship Onboarding Email
 *
 * Sent to barber/beauty applicants. These do NOT go through WorkOne —
 * they have a separate onboarding flow through the shop partner.
 */

export interface BarberOnboardingData {
  firstName: string;
  programName: string;
  applicantEmail: string;
  calendlyLink?: string;
}

const baseStyles = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937;`;
const buttonStyle = `display: inline-block; padding: 14px 28px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;`;

export function barberOnboardingEmail(data: BarberOnboardingData) {
  const calendlyLink = data.calendlyLink || 'https://calendly.com/elevate4humanityedu/30min';

  return {
    subject: `Next Steps for Your ${data.programName} Application — Elevate for Humanity`,
    html: `
<div style="${baseStyles} max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: #1e293b; padding: 28px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Elevate for Humanity</h1>
    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Barber &amp; Beauty Apprenticeship Program</p>
  </div>

  <!-- Body -->
  <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi ${data.firstName},</p>

    <p>Thank you for applying to the <strong>${data.programName}</strong> program at Elevate for Humanity. We received your application and are excited to help you start your career in the beauty industry.</p>

    <p>Our barber and beauty programs operate as <strong>DOL Registered Apprenticeships</strong>. That means you will earn while you learn — getting paid training hours at a licensed shop while completing your theory coursework online.</p>

    <!-- Steps Box -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">Your Next Steps</h3>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 1: Schedule Your Getting Started Orientation</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Book a 30-minute orientation call using the scheduling link below. We will walk you through the program structure, answer your questions, and explain the apprenticeship model. This is required before we can move forward.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 2: Complete Your Enrollment Paperwork</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">After orientation, we will send you enrollment documents to sign. You will need a valid government-issued ID and your Social Security number for apprenticeship registration.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 3: Get Matched with a Training Shop</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">We will connect you with one of our licensed partner barbershops for your on-the-job training hours. You will be a W-2 employee of the shop during your apprenticeship.</p>
      </div>

      <div>
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Step 4: Begin Theory Training (Elevate LMS)</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Your online theory coursework is in the Elevate LMS — included at no cost. Access unlocks after enrollment is complete.</p>
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
        <strong>Important:</strong> Please respond to this email or call us to confirm you received this message. If we do not hear from you within 48 hours, we will follow up to make sure you still want to move forward.
      </p>
    </div>

    <p>If you have questions or need help, contact us:</p>

    <ul style="color: #4b5563; font-size: 14px;">
      <li>Phone: <strong>(317) 314-3757</strong></li>
      <li>Email: <a href="mailto:info@elevateforhumanity.org" style="color: #ea580c;">info@elevateforhumanity.org</a></li>
      <li>Text: (317) 314-3757</li>
    </ul>

    <p>We look forward to working with you.</p>

    <p style="margin-top: 24px;">
      <strong>Elizabeth Greene, CEO</strong><br>
      <span style="font-size: 14px; color: #64748b;">Elevate for Humanity Career &amp; Technical Institute</span>
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
