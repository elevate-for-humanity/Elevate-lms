/**
 * Testing Booking Confirmation Email
 */

import { TESTING_CENTER } from '@/lib/testing/testing-config';

export function getTestingBookingEmailHtml(params: {
  firstName: string;
  confirmationCode: string;
  examName: string;
  calendlyLink: string;
  amount: number;
}): string {
  const { firstName, confirmationCode, examName, calendlyLink, amount } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testing Appointment Scheduled</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#1e40af;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">Elevate Testing Center</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">${TESTING_CENTER.phone}</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Hi ${firstName},</h2>
              
              <p style="margin:0 0 20px;color:#4b5563;font-size:16px;line-height:1.6;">
                Great news! Your testing payment has been received and your appointment is ready to schedule.
              </p>
              
              <!-- Details Card -->
              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <strong style="color:#6b7280;">Exam:</strong>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;">
                      ${examName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <strong style="color:#6b7280;">Confirmation:</strong>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;font-family:monospace;">
                      ${confirmationCode}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <strong style="color:#6b7280;">Amount Paid:</strong>
                    </td>
                    <td style="padding:8px 0;text-align:right;color:#059669;font-weight:bold;">
                      $${(amount / 100).toFixed(2)}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${calendlyLink}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-size:18px;font-weight:bold;">
                  📅 Schedule Your Appointment →
                </a>
              </div>
              
              <p style="margin:20px 0;color:#6b7280;font-size:14px;text-align:center;">
                This is a single-use link — it expires after you book your appointment.
              </p>
              
              <!-- Location -->
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;">
                <p style="margin:0 0 8px;color:#92400e;font-weight:bold;font-size:14px;">📍 Location</p>
                <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">
                  ${TESTING_CENTER.name}<br>
                  ${TESTING_CENTER.address}<br>
                  Indianapolis, IN 46240
                </p>
              </div>
              
              <!-- What to Bring -->
              <div style="margin:20px 0;">
                <h3 style="margin:0 0 12px;color:#1f2937;font-size:16px;">What to Bring:</h3>
                <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                  <li>Valid government-issued photo ID</li>
                  <li>Arrive 10 minutes early</li>
                  <li>No phones, notes, or outside materials in the testing room</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                Questions? Call us at <a href="tel:${TESTING_CENTER.phoneTel}" style="color:#1e40af;">${TESTING_CENTER.phone}</a><br>
                or email <a href="mailto:${TESTING_CENTER.email}" style="color:#1e40af;">${TESTING_CENTER.email}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getTestingBookingEmailText(params: {
  firstName: string;
  confirmationCode: string;
  examName: string;
  calendlyLink: string;
  amount: number;
}): string {
  const { firstName, confirmationCode, examName, calendlyLink, amount } = params;

  return `
Hi ${firstName},

Great news! Your testing payment has been received and your appointment is ready to schedule.

EXAM: ${examName}
CONFIRMATION CODE: ${confirmationCode}
AMOUNT PAID: $${(amount / 100).toFixed(2)}

📅 SCHEDULE YOUR APPOINTMENT:
${calendlyLink}

This is a single-use link — it expires after you book.

📍 LOCATION:
${TESTING_CENTER.name}
${TESTING_CENTER.address}
Indianapolis, IN 46240

WHAT TO BRING:
• Valid government-issued photo ID
• Arrive 10 minutes early
• No phones, notes, or outside materials in the testing room

Questions? Call ${TESTING_CENTER.phone} or email ${TESTING_CENTER.email}

---
Elevate Testing Center
${TESTING_CENTER.phone}
${TESTING_CENTER.email}
  `.trim();
}
