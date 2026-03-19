
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { to, name, userId } = await request.json();

    // Email content
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { padding: 30px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #f9fafb; border-left: 4px solid #e5e7eb; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Elevate for Humanity!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>

      <p><strong>Congratulations!</strong> You've completed onboarding and your LMS access is now active.</p>

      <div class="info-box">
        <h3>📚 Your Access Links:</h3>
        <p><strong>Hub (Command Center):</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/hub">${process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '') || 'www.elevateforhumanity.org'}/hub</a></p>
        <p><strong>LMS Dashboard:</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/learner/dashboard">${process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '') || 'www.elevateforhumanity.org'}/learner/dashboard</a></p>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Password:</strong> The password you created during registration</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/hub" class="button">Go to Your Hub →</a>

      <h3>What's Next?</h3>
      <ul>
        <li>✅ Log in to your Hub (Command Center)</li>
        <li>✅ Access your courses in the Classroom</li>
        <li>✅ Track your progress on the Leaderboard</li>
        <li>✅ Connect with other members</li>
        <li>✅ Check the Calendar for upcoming events</li>
      </ul>

      <div class="info-box">
        <h3>📞 Need Help?</h3>
        <p><strong>Phone:</strong> (317) 314-3757</p>
        <p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</p>
      </div>

      <p><strong>Important:</strong> This is a WIOA/WRG/JRI-funded program. Your training is Funded. There is no cost to you.</p>

      <p>We're excited to have you in our program!</p>

      <p>Best regards,<br>
      <strong>Elevate for Humanity Team</strong></p>
    </div>
    <div class="footer">
      <p>Elevate for Humanity | Indianapolis, IN 46240</p>
      <p>An Equal Opportunity Employer/Program</p>
      <p>Funded by WIOA, WRG, and JRI programs</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using Resend (if configured) or log it
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { name: 'Elevate for Humanity', email: 'onboarding@elevateforhumanity.org' },
          subject: '🎉 Welcome! Your LMS Access is Ready',
          content: [{ type: 'text/html', value: emailHTML }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email via SendGrid');
      }

      return NextResponse.json({
        success: true,
        message: 'Welcome email sent',
      });
    } else {
      // Log email for development
      logger.info('=== WELCOME EMAIL ===');
      logger.info('To:', to);
      logger.info('Subject: Welcome! Your LMS Access is Ready');
      logger.info('Content:', emailHTML);
      logger.info('====================');

      return NextResponse.json({
        success: true,
        message: 'Email logged (Resend not configured)',
        dev: true,
      });
    }
  } catch (error) { 
    logger.error(
      'Send welcome email error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to send email' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/email/send-welcome', _POST);
