export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimitNew as rateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

interface ApplicationData {
  shopLegalName: string;
  shopDbaName?: string;
  ownerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  shopAddressLine1: string;
  shopAddressLine2?: string;
  shopCity: string;
  shopState: string;
  shopZip: string;
  indianaShopLicenseNumber: string;
  supervisorName: string;
  supervisorLicenseNumber: string;
  supervisorYearsLicensed?: string;
  employmentModel: string;
  hasWorkersComp: string;
  canSuperviseAndVerify: string;
  mouAcknowledged: boolean;
  consentAcknowledged: boolean;
  notes?: string;
  honeypot?: string;
}

const REQUIRED_FIELDS = [
  'shopLegalName',
  'ownerName',
  'contactName',
  'contactEmail',
  'contactPhone',
  'shopAddressLine1',
  'shopCity',
  'shopZip',
  'indianaShopLicenseNumber',
  'supervisorName',
  'supervisorLicenseNumber',
  'employmentModel',
  'hasWorkersComp',
  'canSuperviseAndVerify',
] as const;

const VALID_EMPLOYMENT_MODELS = ['hourly', 'commission', 'hybrid', 'not_sure'];

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^[\d\s\-()\\+]{10,}$/.test(phone);
}

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_HASH_SALT || 'efh-salt').digest('hex').slice(0, 16);
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const identifier = getClientIdentifier(req.headers);
    const rateLimitResult = await rateLimit(`barbershop-partner:${identifier}`, RATE_LIMITS.APPLICATION_FORM);

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body: ApplicationData = await req.json();

    // Honeypot check
    if (body.honeypot) {
      return NextResponse.json({ success: true }); // Silent fail for bots
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email
    if (!validateEmail(body.contactEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Validate phone
    if (!validatePhone(body.contactPhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Validate employment model
    if (!VALID_EMPLOYMENT_MODELS.includes(body.employmentModel)) {
      return NextResponse.json({ error: 'Invalid employment model' }, { status: 400 });
    }

    // Validate acknowledgments
    if (!body.mouAcknowledged || !body.consentAcknowledged) {
      return NextResponse.json(
        { error: 'You must acknowledge both the MOU and consent checkboxes' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      logger.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Check for duplicate submissions (same email + license in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('barbershop_partner_applications')
      .select('id')
      .eq('contact_email', body.contactEmail.toLowerCase())
      .eq('indiana_shop_license_number', body.indianaShopLicenseNumber)
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'An application with this email and license number was already submitted recently. Please contact us if you need to update your application.' },
        { status: 400 }
      );
    }

    // Insert application
    const { data, error } = await supabase
      .from('barbershop_partner_applications')
      .insert({
        shop_legal_name: body.shopLegalName.trim(),
        shop_dba_name: body.shopDbaName?.trim() || null,
        owner_name: body.ownerName.trim(),
        contact_name: body.contactName.trim(),
        contact_email: body.contactEmail.toLowerCase().trim(),
        contact_phone: body.contactPhone.trim(),
        shop_address_line1: body.shopAddressLine1.trim(),
        shop_address_line2: body.shopAddressLine2?.trim() || null,
        shop_city: body.shopCity.trim(),
        shop_state: body.shopState || 'IN',
        shop_zip: body.shopZip.trim(),
        indiana_shop_license_number: body.indianaShopLicenseNumber.trim(),
        supervisor_name: body.supervisorName.trim(),
        supervisor_license_number: body.supervisorLicenseNumber.trim(),
        supervisor_years_licensed: body.supervisorYearsLicensed ? parseInt(body.supervisorYearsLicensed) : null,
        employment_model: body.employmentModel,
        has_workers_comp: body.hasWorkersComp === 'yes',
        can_supervise_and_verify: body.canSuperviseAndVerify === 'yes',
        mou_acknowledged: body.mouAcknowledged,
        consent_acknowledged: body.consentAcknowledged,
        notes: body.notes?.trim() || null,
        source_url: req.headers.get('referer') || null,
        user_agent: req.headers.get('user-agent') || null,
        ip_hash: hashIP(identifier),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to insert barbershop partner application', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // Send internal notification email
    const internalEmailHtml = `
      <h2>New Barbershop Partner Application</h2>
      <p><strong>Shop:</strong> ${body.shopLegalName}${body.shopDbaName ? ` (DBA: ${body.shopDbaName})` : ''}</p>
      <p><strong>Owner:</strong> ${body.ownerName}</p>
      <p><strong>Contact:</strong> ${body.contactName}</p>
      <p><strong>Email:</strong> ${body.contactEmail}</p>
      <p><strong>Phone:</strong> ${body.contactPhone}</p>
      <p><strong>Address:</strong> ${body.shopAddressLine1}${body.shopAddressLine2 ? ', ' + body.shopAddressLine2 : ''}, ${body.shopCity}, ${body.shopState} ${body.shopZip}</p>
      <p><strong>Shop License #:</strong> ${body.indianaShopLicenseNumber}</p>
      <p><strong>Supervisor:</strong> ${body.supervisorName} (License: ${body.supervisorLicenseNumber}, ${body.supervisorYearsLicensed || 'N/A'} years)</p>
      <p><strong>Employment Model:</strong> ${body.employmentModel}</p>
      <p><strong>Workers' Comp:</strong> ${body.hasWorkersComp}</p>
      <p><strong>Can Supervise:</strong> ${body.canSuperviseAndVerify}</p>
      ${body.notes ? `<p><strong>Notes:</strong> ${body.notes}</p>` : ''}
      <hr>
      <p><small>Application ID: ${data.id}</small></p>
    `;

    await sendEmail({
      to: process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com',
      subject: `New Barbershop Partner Application: ${body.shopLegalName}`,
      html: internalEmailHtml,
    }).catch(err => logger.error('Failed to send internal notification', err));

    // Send confirmation email to applicant
    const confirmationEmailHtml = `
      <h2>Application Received</h2>
      <p>Dear ${body.contactName},</p>
      <p>Thank you for applying to become a barbershop partner for the Indiana Barber Apprenticeship program. We have received your application for <strong>${body.shopLegalName}</strong>.</p>
      
      <h3>What Happens Next</h3>
      <ol>
        <li><strong>Verification (1-3 business days):</strong> We'll verify your shop license and supervisor credentials.</li>
        <li><strong>MOU Review:</strong> We'll send you the official Memorandum of Understanding for signature.</li>
        <li><strong>Site Approval:</strong> Once verified and MOU signed, your shop becomes an approved worksite.</li>
        <li><strong>Apprentice Matching:</strong> We'll work with you to match qualified apprentice candidates.</li>
      </ol>
      
      <p>In the meantime, you can review the MOU template here:<br>
      <a href="https://www.elevateforhumanity.org/docs/Indiana-Barbershop-Apprenticeship-MOU">View MOU Template</a></p>
      
      <p>If you have questions, contact us at:</p>
      <ul>
        <li>Phone: (317) 314-3757</li>
        <li>Email: info@elevateforhumanity.org</li>
      </ul>
      
      <p>Thank you for your interest in developing the next generation of licensed barbers!</p>
      
      <p>Best regards,<br>
      Elevate for Humanity<br>
      Apprenticeship Programs</p>
    `;

    await sendEmail({
      to: body.contactEmail,
      subject: 'Barbershop Partner Application Received - Elevate for Humanity',
      html: confirmationEmailHtml,
    }).catch(err => logger.error('Failed to send confirmation email', err));

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: data.id,
    });

  } catch (error) {
    logger.error('Barbershop partner application error', error as Error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/partners/barbershop-apprenticeship/apply', _POST);
