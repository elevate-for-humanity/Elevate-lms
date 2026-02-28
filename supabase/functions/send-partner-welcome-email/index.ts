/**
 * Send Partner Welcome Email Edge Function
 * Sends welcome email when student is enrolled in external LMS partner
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface WelcomeEmailRequest {
  enrollment_id: string;
  provider_id: string;
  student_id: string;
}

function getPartnerWelcomeEmail(data: {
  studentName: string;
  providerName: string;
  providerType: string;
  enrollmentUrl?: string;
  promoCode?: string;
  loginInstructions?: string;
  contactEmail?: string;
  contactPhone?: string;
  programName?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${data.providerName} - Your Enrollment is Complete!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 2px solid #e5e7eb;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to ${data.providerName}!</h1>
  </div>

  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.studentName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! You've been successfully enrolled in <strong>${data.providerName}</strong>${data.programName ? ` as part of your <strong>${data.programName}</strong> program` : ''}.
    </p>

    ${data.enrollmentUrl ? `
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">🚀 Get Started</h2>
      <p style="margin-bottom: 15px;">Click the button below to access your courses:</p>
      <a href="${data.enrollmentUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Access ${data.providerName}</a>
    </div>
    ` : ''}

    ${data.promoCode ? `
    <div style="background: #f9fafb; border-left: 4px solid #e5e7eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #374151; font-size: 18px;">💰 Your Promo Code</h3>
      <p style="margin-bottom: 10px; color: #78350f;">Use this code during enrollment:</p>
      <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
        <code style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${data.promoCode}</code>
      </div>
    </div>
    ` : ''}

    ${data.loginInstructions ? `
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #3730a3; font-size: 18px;">📝 Login Instructions</h3>
      <p style="color: #4338ca; margin: 0;">${data.loginInstructions}</p>
    </div>
    ` : ''}

    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; font-size: 18px;">What's Next?</h3>
      <ol style="color: #4b5563; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Access the ${data.providerName} platform using the link above</li>
        <li style="margin-bottom: 10px;">Complete your profile and account setup</li>
        <li style="margin-bottom: 10px;">Browse available courses and certifications</li>
        <li style="margin-bottom: 10px;">Start learning and earning credentials!</li>
      </ol>
    </div>

    ${data.contactEmail || data.contactPhone ? `
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">💬 Need Help?</h3>
      <p style="color: #4b5563; margin-bottom: 10px;">If you have questions or need assistance:</p>
      ${data.contactEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${data.contactEmail}" style="color: #667eea;">${data.contactEmail}</a></p>` : ''}
      ${data.contactPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.contactPhone}</p>` : ''}
    </div>
    ` : ''}

  </div>

  <div style="text-align: center; padding: 30px 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">
      <strong>Elevate for Humanity</strong><br>
      Empowering Communities Through Education
    </p>
  </div>

</body>
</html>
  `;

  const text = `
Welcome to ${data.providerName}!

Hi ${data.studentName},

Great news! You've been successfully enrolled in ${data.providerName}${data.programName ? ` as part of your ${data.programName} program` : ''}.

${data.enrollmentUrl ? `GET STARTED\nAccess your courses here: ${data.enrollmentUrl}\n` : ''}
${data.promoCode ? `YOUR PROMO CODE\nUse this code during enrollment: ${data.promoCode}\n` : ''}
${data.loginInstructions ? `LOGIN INSTRUCTIONS\n${data.loginInstructions}\n` : ''}

WHAT'S NEXT?
1. Access the ${data.providerName} platform
2. Complete your profile and account setup
3. Browse available courses and certifications
4. Start learning and earning credentials!

${data.contactEmail || data.contactPhone ? `NEED HELP?\n${data.contactEmail ? `Email: ${data.contactEmail}\n` : ''}${data.contactPhone ? `Phone: ${data.contactPhone}` : ''}` : ''}

---
Elevate for Humanity
https://www.elevateforhumanity.org
  `;

  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { enrollment_id, provider_id, student_id }: WelcomeEmailRequest = await req.json();

    if (!enrollment_id || !provider_id || !student_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .select(`
        *,
        provider:partner_lms_providers(*),
        student:profiles(*),
        program:programs(*)
      `)
      .eq('id', enrollment_id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    // Prepare email data
    const emailData = {
      studentName: enrollment.student.full_name || enrollment.student.email,
      providerName: enrollment.provider.provider_name,
      providerType: enrollment.provider.provider_type,
      enrollmentUrl: enrollment.provider.enrollment_url,
      promoCode: enrollment.provider.promo_code,
      loginInstructions: enrollment.provider.login_instructions,
      contactEmail: enrollment.provider.contact_email,
      contactPhone: enrollment.provider.contact_phone,
      programName: enrollment.program?.title,
    };

    const { subject, html, text } = getPartnerWelcomeEmail(emailData);

    // Queue email for sending
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert({
        recipient: enrollment.student.email,
        subject,
        html,
        text,
        from_email: 'noreply@www.elevateforhumanity.org',
        user_id: student_id,
        status: 'pending',
        metadata: {
          type: 'partner_welcome',
          enrollment_id,
          provider_id,
        },
      });

    if (queueError) {
      throw queueError;
    }

    // Update enrollment to mark welcome email sent
    await supabase
      .from('partner_lms_enrollments')
      .update({ welcome_email_sent: true })
      .eq('id', enrollment_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email queued' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
