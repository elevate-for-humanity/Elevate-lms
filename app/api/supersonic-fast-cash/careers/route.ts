import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface CareerApplicationBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position?: string;
  experience?: string;
  hasPTIN?: boolean;
  hasEFIN?: boolean;
  availability?: string;
  resumeUrl?: string;
  coverLetter?: string;
}

/**
 * Handle career application
 */
export async function POST(request: NextRequest) {
  try {
    const body: CareerApplicationBody = await request.json();
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
      .from('career_applications')
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        position: body.position || 'Tax Preparer',
        experience_years: parseInt(body.experience, 10) || 0,
        has_ptin: body.hasPTIN || false,
        has_efin: body.hasEFIN || false,
        availability: body.availability || 'full-time',
        resume_url: body.resumeUrl,
        cover_letter: body.coverLetter,
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
        subject: 'Career Application Received - SupersonicFastCash',
        html: `
          <h2>Thank You for Applying, ${body.firstName}!</h2>
          <p>We've received your application for the ${body.position || 'Tax Preparer'} position.</p>

          <h3>Application Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${body.firstName} ${body.lastName}</li>
            <li><strong>Position:</strong> ${body.position || 'Tax Preparer'}</li>
            <li><strong>Experience:</strong> ${body.experience || 0} years</li>
            <li><strong>Application ID:</strong> ${application.id}</li>
          </ul>

          <h3>Next Steps:</h3>
          <ol>
            <li>We'll review your application within 3-5 business days</li>
            <li>Qualified candidates will be contacted for an interview</li>
            <li>Interviews are conducted via video call or in-person</li>
          </ol>

          <h3>What We Offer:</h3>
          <ul>
            <li>💰 Competitive pay: $15-$25/hour</li>
            <li>📅 Flexible schedule</li>
            <li>🏠 Work from home options</li>
            <li>📈 Performance bonuses</li>
            <li>🎓 Free training and certification</li>
          </ul>

          <p>Questions? Call us at (317) 314-3757</p>

          <p>
            Best regards,<br>
            SupersonicFastCash HR Team
          </p>
        `,
      });
    } catch (error) { /* Error handled silently */ }

    // Send notification to admin
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: 'careers@www.elevateforhumanity.org',
        subject: `New Career Application: ${body.firstName} ${body.lastName} - ${body.position || 'Tax Preparer'}`,
        html: `
          <h2>New Career Application</h2>

          <h3>Applicant Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${body.firstName} ${body.lastName}</li>
            <li><strong>Email:</strong> ${body.email}</li>
            <li><strong>Phone:</strong> ${body.phone}</li>
          </ul>

          <h3>Position Details:</h3>
          <ul>
            <li><strong>Position:</strong> ${body.position || 'Tax Preparer'}</li>
            <li><strong>Experience:</strong> ${body.experience || 0} years</li>
            <li><strong>Has PTIN:</strong> ${body.hasPTIN ? 'Yes' : 'No'}</li>
            <li><strong>Has EFIN:</strong> ${body.hasEFIN ? 'Yes' : 'No'}</li>
            <li><strong>Availability:</strong> ${body.availability || 'full-time'}</li>
          </ul>

          ${body.coverLetter ? `
            <h3>Cover Letter:</h3>
            <p>${body.coverLetter}</p>
          ` : ''}

          <h3>Application ID:</h3>
          <p>${application.id}</p>

          <p>
            <a href="https://www.elevateforhumanity.org/admin/careers"
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
      message: 'Application submitted successfully! We will contact you within 3-5 business days.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get application status - requires admin auth or matching email verification
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
    
    // Verify caller is admin or owns the application
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let isAdmin = false;
    let userEmail: string | null = null;
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userEmail = user.email || null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
      }
    }
    
    // Non-admins can only query their own email
    if (!isAdmin) {
      if (!email) {
        return NextResponse.json(
          { error: 'Email required for non-admin queries' },
          { status: 400 }
        );
      }
      // Verify the queried email matches the authenticated user
      if (userEmail && userEmail.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Forbidden: can only query own applications' },
          { status: 403 }
        );
      }
      // For unauthenticated users, only return limited status info
      if (!userEmail) {
        const { data, error } = await supabase
          .from('career_applications')
          .select('id, status, created_at')
          .eq('email', email.toLowerCase())
          .order('created_at', { ascending: false });
        
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
      }
    }

    let query = supabase
      .from('career_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('id', applicationId);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
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
