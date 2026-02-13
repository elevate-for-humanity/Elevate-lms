import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      serviceType,
      appointmentType,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      taxSituation,
      hasW2,
      has1099,
      hasBusinessIncome,
      hasRentalIncome,
      needsRefundAdvance,
      refundAdvanceAmount,
      location,
    } = body;

    // Validate required fields
    if (
      !serviceType ||
      !appointmentType ||
      !date ||
      !time ||
      !firstName ||
      !lastName ||
      !email ||
      !phone
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert appointment into database
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        service_type: serviceType,
        appointment_type: appointmentType,
        appointment_date: date,
        appointment_time: time,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        tax_situation: taxSituation,
        has_w2: hasW2,
        has_1099: has1099,
        has_business_income: hasBusinessIncome,
        has_rental_income: hasRentalIncome,
        needs_refund_advance: needsRefundAdvance,
        refund_advance_amount: refundAdvanceAmount,
        location,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    try {
      await resend.emails.send({
        from: 'Supersonic Fast Cash <noreply@www.elevateforhumanity.org>',
        to: email,
        subject: 'Appointment Confirmation - Supersonic Fast Cash',
        html: `
          <h1>Appointment Confirmed!</h1>
          <p>Hi ${firstName},</p>
          <p>Your appointment has been scheduled:</p>
          <ul>
            <li><strong>Service:</strong> ${serviceType}</li>
            <li><strong>Type:</strong> ${appointmentType}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${time}</li>
          </ul>
          <p>We'll send you a reminder 24 hours before your appointment.</p>
          <p>If you need to reschedule, please call us at (317) 314-3757.</p>
          <p>Thank you,<br>Supersonic Fast Cash Team</p>
        `,
      });

      // Mark confirmation as sent
      await supabase
        .from('appointments')
        .update({ confirmation_sent: true })
        .eq('id', appointment.id);
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    // Send notification to admin
    try {
      await resend.emails.send({
        from: 'Supersonic Fast Cash <noreply@www.elevateforhumanity.org>',
        to: 'supersonicfastcashllc@gmail.com',
        subject: 'New Appointment Booked',
        html: `
          <h1>New Appointment</h1>
          <p><strong>Customer:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Service:</strong> ${serviceType}</p>
          <p><strong>Type:</strong> ${appointmentType}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          ${needsRefundAdvance ? `<p><strong>Refund Advance:</strong> ${refundAdvanceAmount}</p>` : ''}
        `,
      });
    } catch (error) { /* Error handled silently */ }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch appointments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (email) {
      query = query.eq('email', email);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
