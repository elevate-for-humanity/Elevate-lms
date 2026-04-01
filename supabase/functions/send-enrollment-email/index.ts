import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EmailRequest {
  enrollmentId: string;
  type: 'payment_confirmation' | 'enrollment_complete' | 'course_access';
}

serve(async (req) => {
  try {
    const { enrollmentId, type }: EmailRequest = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('hsi_enrollment_queue')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    let subject = '';
    let htmlContent = '';

    const courseNames: Record<string, string> = {
      'cpr-aed': 'Adult CPR/AED',
      'first-aid': 'Adult First Aid',
      'cpr-first-aid': 'Adult CPR/AED + First Aid',
      'bls': 'BLS for Healthcare Providers',
    };

    const courseName = courseNames[enrollment.course_type] || enrollment.course_type;

    switch (type) {
      case 'payment_confirmation':
        subject = `Payment Confirmed - ${courseName}`;
        htmlContent = `
          <h2>Payment Confirmed!</h2>
          <p>Hi ${enrollment.student_name},</p>
          <p>Thank you for your payment of $${enrollment.amount_paid.toFixed(2)} for the <strong>${courseName}</strong> course.</p>
          <p>Your enrollment is being processed and you will receive course access details within 24 hours.</p>
          <h3>What's Next?</h3>
          <ul>
            <li>We're setting up your HSI account</li>
            <li>You'll receive an email with your login credentials</li>
            <li>Complete the online training at your own pace</li>
            <li>Schedule your Remote Skills Verification session</li>
          </ul>
          <p>If you have any questions, please contact us at support@www.elevateforhumanity.org</p>
          <p>Best regards,<br>Elevate for Humanity Career Training Institute</p>
        `;
        break;

      case 'enrollment_complete':
        subject = `Course Access Ready - ${courseName}`;
        htmlContent = `
          <h2>Your Course is Ready!</h2>
          <p>Hi ${enrollment.student_name},</p>
          <p>Great news! Your enrollment for <strong>${courseName}</strong> is complete.</p>
          <h3>Access Your Course</h3>
          <p><a href="${enrollment.hsi_enrollment_link}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Your Training</a></p>
          ${enrollment.hsi_student_id ? `<p>Your HSI Student ID: <strong>${enrollment.hsi_student_id}</strong></p>` : ''}
          <h3>Course Details</h3>
          <ul>
            <li>Complete online training modules</li>
            <li>Pass the knowledge assessment</li>
            <li>Schedule your Remote Skills Verification (RSV) session</li>
            <li>Receive your certification upon completion</li>
          </ul>
          <p>Need help? Contact us at support@www.elevateforhumanity.org</p>
          <p>Best regards,<br>Elevate for Humanity Career Training Institute</p>
        `;
        break;

      case 'course_access':
        subject = `Important: Complete Your ${courseName} Training`;
        htmlContent = `
          <h2>Don't Forget to Complete Your Training!</h2>
          <p>Hi ${enrollment.student_name},</p>
          <p>This is a friendly reminder to complete your <strong>${courseName}</strong> course.</p>
          <p><a href="${enrollment.hsi_enrollment_link}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Continue Training</a></p>
          <p>Your certification is waiting! Complete the course to receive your official certificate.</p>
          <p>Questions? We're here to help at support@www.elevateforhumanity.org</p>
          <p>Best regards,<br>Elevate for Humanity Career Training Institute</p>
        `;
        break;
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Elevate for Humanity <noreply@www.elevateforhumanity.org>',
        to: [enrollment.student_email],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailData = await emailResponse.json();

    // Log email in queue
    await supabase.from('email_queue').insert({
      recipient_email: enrollment.student_email,
      subject,
      body: htmlContent,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        enrollment_id: enrollmentId,
        type,
        resend_id: emailData.id,
      },
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
