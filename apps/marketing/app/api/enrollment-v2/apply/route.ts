import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy init — null when env vars absent, so we fail safely instead of using fake data
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Active statuses for duplicate detection — excludes completed/denied/withdrawn
const ACTIVE_STATUSES = ['draft','submitted','under_review','interview_pending',
  'documents_pending','funding_pending','orientation_pending','approved'];

function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EFH-${year}-${random}`;
}

// Send confirmation email — non-blocking, failures logged but do NOT block the application
async function sendConfirmationEmail(email: string, firstName: string, programName: string, refNumber: string, interviewLink: string) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) { console.warn('[enrollment-v2] SENDGRID_API_KEY not set — skipping email'); return; }
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: 'admissions@elevateforhumanity.org' },
        subject: `Application Received — ${refNumber}`,
        content: [{ type: 'text/html', value: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
            <h1 style="color:#1e3a5f">Application Received!</h1>
            <p>Hi ${firstName},</p>
            <p>We've received your application for <strong>${programName}</strong>.</p>
            <p><strong>Reference:</strong> ${refNumber}</p>
            <p>Next step: Complete your admissions interview with Paris AI.</p>
            <a href="${interviewLink}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Start Your Interview</a>
            <p>Questions? Call (317) 314-3757 or email admissions@elevateforhumanity.org</p>
            <hr/><p style="color:#666;font-size:12px">Elevate for Humanity · Indianapolis, IN</p>
          </div>
        ` }],
      }),
    });
  } catch (err) {
    console.error('[enrollment-v2] Email error (will retry via outbox):', err);
    // Queue for retry via outbox table
  }
}

// Queue a notification for retry — uses existing notification_outbox table
async function queueNotification(supabase: ReturnType<typeof createClient>, notification: {
  type: string; recipient_email: string; applicant_name: string;
  program_name: string; reference_number: string; interview_link?: string;
}) {
  try {
    await supabase.from('notification_outbox').insert({
      type: notification.type,
      recipient_email: notification.recipient_email,
      subject: `Elevate Application — ${notification.reference_number}`,
      metadata: notification,
      attempts: 0,
      max_attempts: 5,
      entity_type: 'application',
      entity_id: null,
    });
  } catch (err) {
    console.error('[enrollment-v2] Outbox insert error:', err);
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  // Fail safely — never report success when DB is unavailable
  if (!supabase) {
    console.error('[enrollment-v2] FATAL: Supabase not configured — cannot accept application');
    return NextResponse.json(
      { error: 'Application system temporarily unavailable. Please call (317) 314-3757 to apply by phone.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      programSlug, programName, firstName, lastName, email, phone,
      dateOfBirth, addressLine1, addressCity, addressState, addressZip,
      fundingSource, goals, howHeard, preferredStartDate, educationLevel,
      employmentStatus, emergencyContactName, emergencyContactRelationship,
      emergencyContactPhone, consentAcknowledged,
    } = body;

    // Required field validation
    const missing: string[] = [];
    if (!programSlug) missing.push('program');
    if (!firstName) missing.push('first name');
    if (!lastName) missing.push('last name');
    if (!email) missing.push('email');
    if (!consentAcknowledged) missing.push('consent acknowledgment');

    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Normalize for duplicate check
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone?.replace(/[^0-9]/g, '') || null;

    // Duplicate check — look for active application with same email + program
    const { data: existing } = await supabase
      .from('applications')
      .select('id, reference_number, application_status')
      .eq('email', normalizedEmail)
      .eq('program_slug', programSlug)
      .in('application_status', ACTIVE_STATUSES)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: 'You already have an active application for this program.',
        application_id: existing.id,
        reference_number: existing.reference_number,
        duplicate: true,
      }, { status: 409 });
    }

    const refNumber = generateRefNumber();
    const now = new Date().toISOString();
    const interviewLink = `/paris/interview?application=${refNumber}`;

    // Determine initial statuses based on funding source
    const isFunded = fundingSource && fundingSource !== 'self_pay' && fundingSource !== 'self';
    const initialStatus = 'submitted';
    const initialParisStatus = 'pending';
    const initialFundingStatus = isFunded ? 'screening' : 'not_applicable';

    // Insert into canonical applications table
    const { data: app, error: appError } = await supabase
      .from('applications')
      .insert({
        reference_number: refNumber,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        date_of_birth: dateOfBirth || null,
        address_line1: addressLine1 || null,
        address_city: addressCity || null,
        address_state: addressState || null,
        address_zip: addressZip || null,
        program_slug: programSlug,
        program_name: programName || programSlug,
        preferred_start_date: preferredStartDate || null,
        education_level: educationLevel || null,
        employment_status: employmentStatus || null,
        funding_source: fundingSource || 'self_pay',
        application_status: initialStatus,
        paris_interview_status: initialParisStatus,
        funding_status: initialFundingStatus,
        document_status: 'not_started',
        orientation_status: 'not_started',
        enrollment_status: 'not_started',
        goals: goals?.trim() || null,
        emergency_contact_name: emergencyContactName?.trim() || null,
        emergency_contact_relationship: emergencyContactRelationship?.trim() || null,
        emergency_contact_phone: emergencyContactPhone?.replace(/[^0-9]/g, '') || null,
        source: 'website_enrollment_v2',
        utm_campaign: howHeard || null,
        submitted_at: now,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        user_agent: req.headers.get('user-agent') || null,
      })
      .select('id, reference_number')
      .single();

    if (appError) {
      console.error('[enrollment-v2] Application insert error:', appError);
      return NextResponse.json({ error: 'Failed to submit application. Please try again or call (317) 314-3757.' }, { status: 500 });
    }

    // Queue PARIS interview session creation
    try {
      await supabase.from('paris_interviews').insert({
        application_id: app.id,
        reference_number: refNumber,
        status: 'pending',
        created_at: now,
      });
    } catch (parisErr) {
      console.error('[enrollment-v2] PARIS interview queue error:', parisErr);
      // Non-critical — admin can create manually
    }

    // Queue applicant confirmation email
    await sendConfirmationEmail(
      normalizedEmail, firstName,
      programName || programSlug, refNumber,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}${interviewLink}`
    );

    // Queue staff notification
    await queueNotification(supabase, {
      type: 'application_received',
      recipient_email: 'admissions@elevateforhumanity.org',
      applicant_name: `${firstName} ${lastName}`,
      program_name: programName || programSlug,
      reference_number: refNumber,
      interview_link: interviewLink,
    });

    // Audit log
    try {
      await supabase.from('audit_log').insert({
        entity_type: 'application',
        entity_id: app.id,
        action: 'created',
        actor_type: 'applicant',
        actor_id: normalizedEmail,
        metadata: { source: 'enrollment_v2', funding_source: fundingSource, program_slug: programSlug },
        created_at: now,
      });
    } catch { /* non-critical */ }

    return NextResponse.json({
      success: true,
      applicationId: app.id,
      referenceNumber: refNumber,
      nextStep: interviewLink,
      confirmationUrl: `/enrollment-v2/confirmation?confirmation=${refNumber}&program=${encodeURIComponent(programName || programSlug)}&firstName=${encodeURIComponent(firstName)}`,
    });

  } catch (err) {
    console.error('[enrollment-v2] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error. Please call (317) 314-3757.' }, { status: 500 });
  }
}

// GET — look up by reference number or email
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Application system temporarily unavailable.' }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');
    const email = searchParams.get('email');

    if (!ref && !email) {
      return NextResponse.json({ error: 'ref or email parameter required' }, { status: 400 });
    }

    let query = supabase.from('applications').select(`
      id, reference_number, first_name, last_name, email, phone,
      program_slug, program_name, funding_source,
      application_status, paris_interview_status, funding_status,
      document_status, orientation_status, enrollment_status,
      submitted_at, created_at, updated_at
    `);

    if (ref) query = query.eq('reference_number', ref.toUpperCase().trim());
    else if (email) query = query.eq('email', email.toLowerCase().trim());

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('[enrollment-v2] Lookup error:', error);
      return NextResponse.json({ error: 'Could not load application.' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[enrollment-v2] GET error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
