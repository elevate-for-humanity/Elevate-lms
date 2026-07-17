// PUBLIC ROUTE: cosmetology apprenticeship application
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { submitSalonHostShopApplication } from '@/lib/partners/submit-salon-host-shop-application';

async function _POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      salonLegalName,
      salonDbaName,
      ownerName,
      contactName,
      contactEmail,
      contactPhone,
      salonAddressLine1,
      salonAddressLine2,
      salonCity,
      salonState,
      salonZip,
      indianaSalonLicenseNumber,
      supervisorName,
      supervisorLicenseNumber,
      supervisorYearsLicensed,
      compensationModel,
      numberOfEmployees,
      workersCompStatus,
      hasGeneralLiability,
      canSuperviseAndVerify,
      documentReadiness,
      documentSupportNeeded,
      mouAcknowledged,
      consentAcknowledged,
      notes,
      shopLicenseFileData,
      shopLicenseFileName,
      insuranceFileData,
      insuranceFileName,
    } = body;

    if (
      !salonLegalName ||
      !contactEmail ||
      !contactPhone ||
      !indianaSalonLicenseNumber ||
      !supervisorName ||
      !supervisorLicenseNumber
    ) {
      return safeError('Missing required fields', 400);
    }
    if (!mouAcknowledged || !consentAcknowledged) {
      return safeError('Acknowledgments are required', 400);
    }
    if (!shopLicenseFileData || !shopLicenseFileName) {
      return safeError('Please upload your Indiana salon license.', 400);
    }
    if (hasGeneralLiability !== 'yes') {
      return safeError('General liability insurance is required for host salons.', 400);
    }
    if (workersCompStatus === 'none') {
      return safeError("Workers' compensation coverage or a valid exemption is required.", 400);
    }

    const db = await requireAdminClient();
    if (!db) {
      return safeInternalError(new Error('DB unavailable'), 'Service temporarily unavailable');
    }

    const result = await submitSalonHostShopApplication(db, 'cosmetology', {
      salonLegalName,
      salonDbaName,
      ownerName,
      contactName,
      contactEmail,
      contactPhone,
      salonAddressLine1,
      salonAddressLine2,
      salonCity,
      salonState,
      salonZip,
      indianaSalonLicenseNumber,
      supervisorName,
      supervisorLicenseNumber,
      supervisorYearsLicensed,
      compensationModel,
      numberOfEmployees,
      workersCompStatus,
      hasGeneralLiability,
      canSuperviseAndVerify,
      documentReadiness,
      documentSupportNeeded,
      mouAcknowledged,
      consentAcknowledged,
      notes,
      shopLicenseFileData,
      shopLicenseFileName,
      insuranceFileData,
      insuranceFileName,
    });

    return NextResponse.json({ success: true, partnerId: result.partnerId }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
      return safeError(
        'An application already exists for this email address. Please log in to continue your onboarding.',
        409,
      );
    }
    logger.error('Cosmetology salon apply error:', error);
    return safeInternalError(error, 'Failed to process application');
  }
}

export const POST = withRuntime(_POST);
