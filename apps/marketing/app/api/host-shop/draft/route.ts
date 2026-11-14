import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { provisionHostShopDraft } from '@/lib/partners/provision-host-shop-draft';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PROGRAMS = new Set(['barber', 'cosmetology', 'esthetician', 'nail']);

function clean(value: unknown, max = 500): string {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const allowed = new Set(
    [
      process.env.NEXT_PUBLIC_SITE_URL,
      PLATFORM_DEFAULTS.siteUrl,
      'https://www.elevateforhumanity.org',
    ].filter(Boolean),
  );
  return allowed.has(origin);
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Origin not allowed.' }, { status: 403 });
  }
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  let savedApplicationId: string | null = null;
  try {
    const body = await request.json();
    const legalBusinessName = clean(body.legalBusinessName || body.businessName, 255);
    const businessName = clean(body.dbaName || body.businessName || legalBusinessName, 255);
    const ownerName = clean(body.ownerName, 255);
    const contactName = clean(body.contactName || ownerName, 255);
    const email = clean(body.email, 254).toLowerCase();
    const phone = clean(body.phone, 50);
    const address1 = clean(body.address1, 255);
    const address2 = clean(body.address2, 255);
    const city = clean(body.city, 120);
    const state = clean(body.state || 'Indiana', 80);
    const zip = clean(body.zip, 20);
    const businessType = clean(body.industryType || 'salon', 50);
    const rawPrograms: unknown[] = Array.isArray(body.programs) ? body.programs : [];
    const programs: string[] = [
      ...new Set(
        rawPrograms.map((value) => clean(value, 80)).filter((value) => PROGRAMS.has(value)),
      ),
    ];

    if (
      !legalBusinessName ||
      !businessName ||
      !ownerName ||
      !contactName ||
      !email ||
      !phone ||
      !address1 ||
      !city ||
      !state ||
      !zip ||
      programs.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Enter the business name, owner, contact information, full address, and at least one program before saving the draft.',
        },
        { status: 400 },
      );
    }
    if (!validEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'Enter a valid email address.' },
        { status: 400 },
      );
    }

    const db = await requireAdminClient();
    const emailPattern = email.replace(/[\\%_]/g, '\\$&');
    const fullAddress = [address1, address2, city, state, zip].filter(Boolean).join(', ');
    const now = new Date().toISOString();
    const { data: existing, error: lookupError } = await db
      .from('host_shop_applications')
      .select('id,status,intake')
      .ilike('email', emailPattern)
      .not('status', 'in', '("rejected")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const { data: existingPartner, error: partnerLookupError } = await db
      .from('partners').select('id').ilike('contact_email', emailPattern).limit(1).maybeSingle();
    if (partnerLookupError) throw partnerLookupError;
    if (existing || existingPartner) {
      return NextResponse.json({
        ok: false,
        error: 'An application or Host Shop account already exists. Sign in to finish your saved onboarding. Use password setup or a secure magic link if you do not have a password.',
      }, { status: 409 });
    }

    const intake = {
      legalBusinessName,
      dbaName: businessName === legalBusinessName ? null : businessName,
      contactName,
      programs,
      source: 'host-shop-save-and-finish-later',
      draftSavedAt: now,
      missingRequirements: [
        'business_license',
        'supervisor_information',
        'liability_insurance',
        'workers_compensation_or_exemption',
        'supervisor_license',
        'ein_or_w9',
        'authorized_signature_and_acknowledgements',
      ],
    };
    const applicationPayload = {
      shop_name: businessName,
      owner_name: ownerName,
      email,
      phone,
      address: fullAddress,
      contact_email: email,
      business_name: legalBusinessName,
      status: 'drafted',
      license_info: {},
      intake,
      updated_at: now,
    };

    const { data: saved, error: saveError } = await db
      .from('host_shop_applications').insert(applicationPayload).select('id').single();
    if (saveError || !saved?.id) throw saveError || new Error('HOST_SHOP_DRAFT_NOT_CREATED');
    const applicationId = saved.id as string;

    savedApplicationId = applicationId;
    const provisioned = await provisionHostShopDraft({
      db,
      applicationId,
      legalBusinessName,
      businessName,
      ownerName,
      contactName,
      email,
      phone,
      address1,
      address2: address2 || null,
      city,
      state,
      zip,
      businessType,
      programs,
    });

    const accessLink = provisioned.accessLink || provisioned.portalUrl;
    const deliveryResults = await Promise.allSettled([
      sendEmail({
        to: email,
        subject: 'Finish Your Host Shop Application | Elevate for Humanity',
        html: `<p>Hello ${escapeHtml(contactName)},</p><p>Your Host Shop application for <strong>${escapeHtml(businessName)}</strong> is saved.</p><p><strong>Reference:</strong> ${applicationId}</p><p>Your conditional Host Shop portal is ready. Use the secure link below to continue onboarding and upload the remaining compliance items.</p><p><a href="${accessLink}">Open Host Shop Onboarding</a></p><p>Your shop is not approved and no apprentice can be assigned until Elevate verifies the required licenses, insurance, workers' compensation/exemption, supervisor credential, EIN/W-9 record, acknowledgements, and signature.</p>`,
      }),
      // Drafts require an administrative inbox alert as well as dashboard visibility.
      sendEmail({
        to: 'elevate4humanityedu@gmail.com',
        subject: `[HOST SHOP DRAFT] ${businessName} — follow-up required`,
        html: `<p>A host shop application draft was saved but not submitted.</p><p><strong>${escapeHtml(businessName)}</strong> — ${escapeHtml(contactName)}</p><p>Application reference: ${applicationId}</p><p>Review in the Admin host shop application queue and follow up on missing documents.</p>`,
      }),
      db.from('staff_notifications').insert({
        type: 'host_shop_draft_saved',
        title: `Host Shop draft saved: ${businessName}`,
        message: `${contactName} saved a Host Shop application draft and received conditional onboarding access.`,
        severity: 'info',
        metadata: { application_id: applicationId, partner_id: provisioned.partnerId, email },
      }),
    ]);

    const applicantDelivery = deliveryResults[0];
    const accessEmailSent = applicantDelivery.status === 'fulfilled' && applicantDelivery.value.success === true;
    if (!accessEmailSent) logger.warn('[host-shop/draft] Applicant access email was not confirmed', { applicationId });

    return NextResponse.json(
      {
        ok: true,
        accessEmailSent,
        applicationId,
        referenceNumber: applicationId,
        status: applicationPayload.status,
        portalUrl: provisioned.portalUrl,
        nextStepUrl: provisioned.portalUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('[host-shop/draft] failed', error instanceof Error ? error : undefined);
    if (savedApplicationId) {
      try {
        const db = await requireAdminClient();
        await db.from('staff_notifications').insert({ type: 'host_shop_provisioning_failed', title: 'Saved Host Shop draft needs portal setup', message: `Application ${savedApplicationId} is saved, but portal setup did not complete. Resolve owner access and contact the applicant.`, severity: 'error', metadata: { application_id: savedApplicationId } });
      } catch (notificationError) { logger.error('[host-shop/draft] Follow-up alert failed', notificationError); }
    }
    return NextResponse.json(
      {
        ok: false,
        error: savedApplicationId ? `Your application is saved (reference ${savedApplicationId}), but portal setup needs assistance. Please call ${PLATFORM_DEFAULTS.mainPhone}; do not submit another application.` : `We could not save the Host Shop draft. Please call ${PLATFORM_DEFAULTS.mainPhone}.`,
      },
      { status: 500 },
    );
  }
}
