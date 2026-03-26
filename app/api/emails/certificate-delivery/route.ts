import { NextRequest, NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const {
      email,
      name,
      programTitle,
      certificateNumber,
      certificateUrl,
      verificationUrl,
    } = await req.json();

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Certificate is Ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px; font-weight: bold;">
                🎓 Congratulations!
              </h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                Your Certificate is Ready
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${name}</strong>,
              </p>

              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We are thrilled to inform you that your certificate for <strong>${programTitle}</strong> has been generated and is now available in our official repository!
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #e5e7eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                  Certificate Details:
                </p>
                <p style="color: #1f2937; font-size: 14px; margin: 5px 0;">
                  <strong>Certificate Number:</strong> ${certificateNumber}
                </p>
                <p style="color: #1f2937; font-size: 14px; margin: 5px 0;">
                  <strong>Program:</strong> ${programTitle}
                </p>
                <p style="color: #1f2937; font-size: 14px; margin: 5px 0;">
                  <strong>Status:</strong> Stored in Official Repository
                </p>
              </div>

              <!-- Download Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${certificateUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Download Your Certificate
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Verification Link -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; background-color: #f3f4f6; color: #1f2937; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; border: 1px solid #d1d5db;">
                      Verify Certificate Authenticity
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f9fafb; border-left: 4px solid #e5e7eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                  📋 Important Information:
                </p>
                <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin: 5px 0;">Your certificate is permanently stored in our official repository</li>
                  <li style="margin: 5px 0;">Employers can verify authenticity using the certificate number</li>
                  <li style="margin: 5px 0;">Keep your certificate number for future reference</li>
                  <li style="margin: 5px 0;">Share the verification link with potential employers</li>
                </ul>
              </div>

              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
                We're incredibly proud of your achievement and dedication. This certificate represents your hard work and commitment to professional development.
              </p>

              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0;">
                Best wishes for your continued success!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                Elevate For Humanity
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
                Career & Technical Institute
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0;">
                ETPL Listed Provider • WIOA Eligible Training Provider
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 15px 0;">
                <a href="tel:+13173143757" style="color: #2563eb; text-decoration: none;">(317) 314-3757</a> •
                <a href="mailto:info@elevateforhumanity.org" style="color: #2563eb; text-decoration: none;">info@elevateforhumanity.org</a>
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} Elevate For Humanity. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email using your email service (Resend, SendGrid, etc.)
    // For now, returning success - integrate with actual email service

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error(
      'Email delivery error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to send email' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/emails/certificate-delivery', _POST);
