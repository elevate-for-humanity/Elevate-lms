import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface ApplicationBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  amount?: string;
  purpose?: string;
  income?: string;
  employmentStatus?: string;
}

/**
 * Handle refund advance application
 */
export async function POST(request: NextRequest) {
  try {
    const body: ApplicationBody = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save application to database
    const { data: application, error: appError } = await supabase
      .from('refund_advance_applications')
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        requested_amount: parseFloat(body.amount) || 0,
        purpose: body.purpose,
        annual_income: parseFloat(body.income) || 0,
        employment_status: body.employmentStatus,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      return NextResponse.json(
        { error: 'Failed to save application', details: appError.message },
        { status: 500 }
      );
    }

    // Send confirmation email to applicant
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: body.email,
        subject: 'Refund Advance Application Received',
        html: `
          <h2>Thank You, ${body.firstName}!</h2>
          <p>We've received your refund advance application.</p>

          <h3>Application Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${body.firstName} ${body.lastName}</li>
            <li><strong>Requested Amount:</strong> $${body.amount}</li>
            <li><strong>Application ID:</strong> ${application.id}</li>
          </ul>

          <h3>Next Steps:</h3>
          <ol>
            <li>We'll review your application within 24 hours</li>
            <li>You'll receive an approval decision via email</li>
            <li>If approved, funds can be available same day</li>
          </ol>

          <p><strong>Refund Advance Terms:</strong></p>
          <ul>
            <li>Fee: 3.5% + $35</li>
            <li>Amount: $250 - $7,500</li>
            <li>Same-day funding available</li>
            <li>No credit check required</li>
          </ul>

          <p>Questions? Call us at (317) 314-3757</p>

          <p>
            Best regards,<br>
            SupersonicFastCash Team
          </p>
        `,
      });
    } catch (error) { /* Error handled silently */ }

    // Send notification to admin
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: 'supersonicfastcashllc@gmail.com',
        subject: `New Refund Advance Application: ${body.firstName} ${body.lastName}`,
        html: `
          <h2>New Refund Advance Application</h2>

          <h3>Applicant Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${body.firstName} ${body.lastName}</li>
            <li><strong>Email:</strong> ${body.email}</li>
            <li><strong>Phone:</strong> ${body.phone}</li>
          </ul>

          <h3>Application Details:</h3>
          <ul>
            <li><strong>Requested Amount:</strong> $${body.amount}</li>
            <li><strong>Purpose:</strong> ${body.purpose}</li>
            <li><strong>Annual Income:</strong> $${body.income}</li>
            <li><strong>Employment Status:</strong> ${body.employmentStatus}</li>
          </ul>

          <h3>Application ID:</h3>
          <p>${application.id}</p>

          <p>
            <a href="https://www.elevateforhumanity.org/admin/refund-advances"
               style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Review Application
            </a>
          </p>
        `,
      });
    } catch (error) { /* Error handled silently */ }

    return NextResponse.json({
      success: true,
      application: application,
      message: 'Application submitted successfully! We will contact you within 24 hours.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get application status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const applicationId = searchParams.get('id');

    if (!email && !applicationId) {
      return NextResponse.json(
        { error: 'Email or application ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('refund_advance_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('id', applicationId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applications: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
