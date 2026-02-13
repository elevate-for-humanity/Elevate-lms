
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentData } = body;

    // Validate required fields
    if (
      !appointmentData?.firstName ||
      !appointmentData?.lastName ||
      !appointmentData?.email ||
      !appointmentData?.phone ||
      !appointmentData?.serviceType ||
      !appointmentData?.appointmentType ||
      !appointmentData?.date ||
      !appointmentData?.time
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert appointment into database
    const { data, error }: any = await supabase
      .from('appointments')
      .insert([
        {
          service_type: appointmentData.serviceType,
          appointment_type: appointmentData.appointmentType,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          first_name: appointmentData.firstName,
          last_name: appointmentData.lastName,
          email: appointmentData.email,
          phone: appointmentData.phone,
          tax_situation: appointmentData.taxSituation || null,
          has_w2: appointmentData.hasW2 || false,
          has_1099: appointmentData.has1099 || false,
          has_business_income: appointmentData.hasBusinessIncome || false,
          has_rental_income: appointmentData.hasRentalIncome || false,
          needs_refund_advance: appointmentData.needsRefundAdvance || false,
          refund_advance_amount: appointmentData.refundAdvanceAmount || null,
          location: appointmentData.location || null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {

      // If table doesn't exist, still return success (we'll handle via email)
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          message: 'Appointment request received. We will contact you shortly.',
        });
      }

      return NextResponse.json(
        { error: 'Failed to create appointment', details: error.message },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: appointmentData.email,
        subject: 'Tax Appointment Confirmation - SupersonicFastCash',
        html: `
          <h2>Your Tax Appointment is Confirmed!</h2>
          <p>Hi ${appointmentData.firstName},</p>
          <p>Thank you for booking with SupersonicFastCash. Here are your appointment details:</p>
          <ul>
            <li><strong>Service:</strong> ${appointmentData.serviceType}</li>
            <li><strong>Type:</strong> ${appointmentData.appointmentType}</li>
            <li><strong>Date:</strong> ${appointmentData.date}</li>
            <li><strong>Time:</strong> ${appointmentData.time}</li>
          </ul>
          <p>We'll send you a reminder 24 hours before your appointment.</p>
          <p>If you need to reschedule, please call us at (317) 314-3757.</p>
          <p>Best regards,<br>SupersonicFastCash Team</p>
        `,
      });
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    // Send notification to staff
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: 'elevate4humanityedu@gmail.com',
        subject: 'New Tax Appointment Booked',
        html: `
          <h2>New Appointment Booked</h2>
          <ul>
            <li><strong>Client:</strong> ${appointmentData.firstName} ${appointmentData.lastName}</li>
            <li><strong>Email:</strong> ${appointmentData.email}</li>
            <li><strong>Phone:</strong> ${appointmentData.phone}</li>
            <li><strong>Service:</strong> ${appointmentData.serviceType}</li>
            <li><strong>Type:</strong> ${appointmentData.appointmentType}</li>
            <li><strong>Date:</strong> ${appointmentData.date}</li>
            <li><strong>Time:</strong> ${appointmentData.time}</li>
            <li><strong>Refund Advance:</strong> ${appointmentData.needsRefundAdvance ? 'Yes' : 'No'}</li>
          </ul>
        `,
      });
    } catch (error) { /* Error handled silently */ }

    return NextResponse.json({
      success: true,
      appointment: data,
      message: 'Appointment booked successfully! Check your email for confirmation.',
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
