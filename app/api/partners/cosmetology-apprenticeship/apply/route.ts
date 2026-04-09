import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      salonLegalName, salonDbaName, ownerName,
      contactName, contactEmail, contactPhone,
      salonAddressLine1, salonAddressLine2, salonCity, salonState, salonZip,
      indianaSalonLicenseNumber,
      supervisorName, supervisorLicenseNumber, supervisorYearsLicensed,
      compensationModel, numberOfEmployees,
      workersCompStatus, hasGeneralLiability, canSuperviseAndVerify,
      mouAcknowledged, consentAcknowledged, notes,
    } = body;

    if (!salonLegalName || !contactEmail || !contactPhone || !indianaSalonLicenseNumber || !supervisorName || !supervisorLicenseNumber) {
      return safeError('Missing required fields', 400);
    }
    if (!mouAcknowledged || !consentAcknowledged) {
      return safeError('Acknowledgments are required', 400);
    }

    const db = await getAdminClient();

    // Insert partner application
    const { data: partner, error: partnerError } = await db
      .from('partners')
      .insert({
        name: salonDbaName || salonLegalName,
        legal_name: salonLegalName,
        owner_name: ownerName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address_line1: salonAddressLine1,
        address_line2: salonAddressLine2,
        city: salonCity,
        state: salonState || 'IN',
        zip: salonZip,
        partner_type: 'salon',
        program_type: 'cosmetology',
        status: 'pending',
        license_number: indianaSalonLicenseNumber,
        supervisor_name: supervisorName,
        supervisor_license_number: supervisorLicenseNumber,
        supervisor_years_licensed: supervisorYearsLicensed ? parseInt(supervisorYearsLicensed) : null,
        compensation_model: compensationModel,
        number_of_employees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
        workers_comp_status: workersCompStatus,
        has_general_liability: hasGeneralLiability === 'yes',
        can_supervise_and_verify: canSuperviseAndVerify === 'yes',
        mou_acknowledged: mouAcknowledged,
        notes,
        applied_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (partnerError) {
      logger.error('Cosmetology salon application insert error:', partnerError);
      return safeInternalError(partnerError, 'Failed to submit application');
    }

    logger.info(`Cosmetology salon application submitted: ${partner.id} — ${salonLegalName}`);

    return NextResponse.json({ success: true, partnerId: partner.id }, { status: 201 });
  } catch (error) {
    logger.error('Cosmetology salon apply error:', error);
    return safeInternalError(error, 'Failed to process application');
  }
}

export const POST = withRuntime(_POST);
