import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Rate limiting
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const { ok } = await checkRateLimit({
      key: `wioa-apply:${ip}`,
      limit: 3,
      windowSeconds: 60,
    });

    if (!ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Generate reference number
    const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

    // Build comprehensive notes
    const notes = [
      `Reference: ${referenceNumber}`,
      `\n=== ELIGIBILITY ===`,
      `Age 18+: ${body.isOver18 ? 'Yes' : 'No'}`,
      `HS Diploma: ${body.hasHighSchoolDiploma ? 'Yes' : 'No'}`,
      `Work Auth: ${body.hasWorkAuthorization ? 'Yes' : 'No'}`,
      `IN Resident: ${body.isIndianaResident ? 'Yes' : 'No'}`,
      `Can Commit: ${body.canCommitToSchedule ? 'Yes' : 'No'}`,
      `\n=== DEMOGRAPHICS ===`,
      `DOB: ${body.dateOfBirth}`,
      `Race: ${Array.isArray(body.race) ? body.race.join(', ') : 'Not specified'}`,
      `Gender: ${body.gender}`,
      `Education: ${body.educationLevel}`,
      `Veteran: ${body.isVeteran ? 'Yes' : 'No'}`,
      `\n=== WIOA ELIGIBILITY ===`,
      `Employment: ${body.employmentStatus}`,
      `Income: ${body.annualIncome}`,
      `Dependents: ${body.numberOfDependents}`,
      `Public Assistance: ${Array.isArray(body.receivesPublicAssistance) ? body.receivesPublicAssistance.join(', ') : 'None'}`,
      `Housing: ${body.housingStatus}`,
      `Justice Involvement: ${body.hasJusticeInvolvement ? 'Yes' : 'No'}`,
      `\n=== AUTHORIZATION ===`,
      `Work Auth Doc: ${body.workAuthDocument}`,
      body.documentExpirationDate
        ? `Expires: ${body.documentExpirationDate}`
        : '',
      `Barriers: ${Array.isArray(body.barriers) ? body.barriers.join(', ') : 'None'}`,
      body.otherBarrier ? `Other Barrier: ${body.otherBarrier}` : '',
      `Case Manager: ${body.hasCaseManager ? 'Yes' : 'No'}`,
      body.caseManagerAgency ? `Agency: ${body.caseManagerAgency}` : '',
      body.supportNeeds ? `Support Needs: ${body.supportNeeds}` : '',
      `\n=== CONSENTS ===`,
      `Background Check: ${body.consentBackgroundCheck ? 'Yes' : 'No'}`,
      `Photo/Video: ${body.consentPhotoVideo ? 'Yes' : 'No'}`,
      `Data Sharing: ${body.consentDataSharing ? 'Yes' : 'No'}`,
      `Text Messages: ${body.consentTextMessages ? 'Yes' : 'No'}`,
    ]
      .filter(Boolean)
      .join('\n');

    // Insert into applications table
    const { data, error }: any = await db
      .from('applications')
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone || '',
        city: body.city || 'Indianapolis',
        zip: body.zip || '00000',
        program_interest: body.program || 'Not specified',
        status: 'pending',
        support_notes: notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            'Failed to save application. Please call 317-314-3757 for assistance.',
          details:
            process.env.NODE_ENV === 'development' ? 'Internal server error' : undefined,
        },
        { status: 500 }
      );
    }

    // Send confirmation email to applicant
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: body.email,
          subject: `Application Received [Ref: ${referenceNumber}] - Elevate for Humanity`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ea580c;">Application Received!</h2>
              <p>Hi ${body.firstName},</p>
              <p>We've received your WIOA application for our <strong>${body.program}</strong> program.</p>

              <div style="background: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Reference Number:</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #0f172a;">${referenceNumber}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Save this number to check your application status</p>
              </div>

              <h3 style="color: #0f172a;">What Happens Next?</h3>
              <ol style="line-height: 1.8;">
                <li>We review your application and verify WIOA eligibility</li>
                <li>An advisor will contact you within 1-2 business days via ${body.preferredContact}</li>
                <li>We'll discuss program details, funding confirmation, and next steps</li>
              </ol>

              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ea580c;">Want to Talk Sooner?</h3>
                <p>Schedule your advisor call now:</p>
                <a href="https://calendly.com/elevate-for-humanity/advisor-call" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Schedule Call Now</a>
              </div>

              <p>Questions? Call us at <a href="tel:3173143757" style="color: #ea580c; font-weight: bold;">317-314-3757</a></p>
              <p>Best regards,<br><strong>Elevate for Humanity Team</strong></p>
            </div>
          `,
        }),
      });
    } catch { /* non-fatal */ }

    // Send notification to admin
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'info@elevateforhumanity.org',
          subject: `New WIOA Application [${referenceNumber}]: ${body.firstName} ${body.lastName}`,
          html: `
            <h2>New WIOA Application Received</h2>
            <p><strong>Reference:</strong> ${referenceNumber}</p>
            <p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Phone:</strong> ${body.phone}</p>
            <p><strong>Program:</strong> ${body.program}</p>
            <p><strong>Location:</strong> ${body.city}, ${body.zip}</p>
            <p><strong>Income:</strong> ${body.annualIncome}</p>
            <p><strong>Employment:</strong> ${body.employmentStatus}</p>
            <p><strong>Public Assistance:</strong> ${Array.isArray(body.receivesPublicAssistance) ? body.receivesPublicAssistance.join(', ') : 'None'}</p>
            <p><strong>Justice Involvement:</strong> ${body.hasJusticeInvolvement ? 'Yes' : 'No'}</p>
            <p><strong>Barriers:</strong> ${Array.isArray(body.barriers) ? body.barriers.join(', ') : 'None'}</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/applications">View in Admin Portal</a></p>
          `,
        }),
      });
    } catch { /* non-fatal */ }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        referenceNumber: referenceNumber,
      },
      { status: 200 }
    );
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
