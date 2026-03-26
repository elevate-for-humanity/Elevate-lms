import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      filingStatus,
      employmentType,
      estimatedIncome,
      hasW2,
      has1099,
      hasDependents,
      dependentCount,
      preferredContact,
      preferredTime,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !filingStatus || !employmentType || !estimatedIncome) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
 ${lastName}`,
        email,
        phone,
        filingStatus,
        employmentType,
        estimatedIncome,
        hasDependents,
        dependentCount,
        preferredContact,
        preferredTime,
        submittedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    // Try to save to database
    const { error } = await supabase.from('tax_applications').insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      filing_status: filingStatus,
      employment_type: employmentType,
      estimated_income: estimatedIncome,
      has_w2: hasW2,
      has_1099: has1099,
      has_dependents: hasDependents,
      dependent_count: dependentCount || null,
      preferred_contact: preferredContact,
      preferred_time: preferredTime || null,
      status: 'new',
      source: 'website',
    });

    if (error) {
      logger.error('Database error:', error);
      // Still return success - we don't want to block the user
      // Log the application for manual follow-up
      logger.info('Tax refund application (DB failed):', {
        name: `${firstName} ${lastName}`,
        email,
        phone,
        submittedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing tax application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/supersonic/apply', _POST);
