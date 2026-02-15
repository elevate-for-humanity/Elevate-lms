import { logger } from '@/lib/logger';
/**
 * Workforce Referral API
 * 
 * Manages workforce agency referrals with automated status reporting.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { WorkforceAgencyType, WorkforceReferralStatus } from '@/types/enrollment';

// GET: List referrals or get specific referral
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check staff role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'advisor', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const referralId = searchParams.get('id');
  const agencyName = searchParams.get('agency');
  const status = searchParams.get('status');

  let query = supabase
    .from('workforce_referrals')
    .select(`
      *,
      enrollments (
        id,
        status,
        program_id,
        programs (name)
      )
    `);

  if (referralId) {
    query = query.eq('id', referralId);
  }
  if (agencyName) {
    query = query.ilike('agency_name', `%${agencyName}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ referrals: data });
}

// POST: Create new referral
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    userId,
    agencyName,
    agencyType,
    caseManagerName,
    caseManagerEmail,
    caseManagerPhone,
    fundingType,
    voucherNumber,
    fundingAmount,
  } = body;

  // Validate required fields
  if (!userId || !agencyName || !agencyType) {
    return NextResponse.json({ 
      error: 'Missing required fields: userId, agencyName, agencyType' 
    }, { status: 400 });
  }

  // Validate agency type
  const validAgencyTypes: WorkforceAgencyType[] = [
    'american_job_center',
    'workforce_board',
    'vocational_rehabilitation',
    'wioa',
    'jri',
    'snap_et',
    'fssa',
    'other'
  ];

  if (!validAgencyTypes.includes(agencyType)) {
    return NextResponse.json({ error: 'Invalid agency type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('workforce_referrals')
    .insert({
      user_id: userId,
      agency_name: agencyName,
      agency_type: agencyType,
      case_manager_name: caseManagerName,
      case_manager_email: caseManagerEmail,
      case_manager_phone: caseManagerPhone,
      funding_type: fundingType,
      voucher_number: voucherNumber,
      funding_amount: fundingAmount,
      status: 'referred',
      referral_date: new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    referralId: data.id,
    message: 'Workforce referral created'
  });
}

// PATCH: Update referral status
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check staff role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'advisor', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const body = await request.json();
  const { referralId, action, data: actionData } = body;

  if (!referralId || !action) {
    return NextResponse.json({ error: 'referralId and action required' }, { status: 400 });
  }

  let updateData: Record<string, any> = {};

  switch (action) {
    case 'update_status':
      const validStatuses: WorkforceReferralStatus[] = [
        'referred',
        'intake_started',
        'enrolled',
        'active',
        'completed',
        'withdrawn',
        'cancelled'
      ];

      if (!actionData?.status || !validStatuses.includes(actionData.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      updateData = {
        status: actionData.status,
      };
      break;

    case 'approve_funding':
      updateData = {
        funding_approved: true,
        funding_approved_at: new Date().toISOString(),
        funding_amount: actionData?.amount || null,
      };
      break;

    case 'link_enrollment':
      if (!actionData?.enrollmentId) {
        return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
      }

      updateData = {
        enrollment_id: actionData.enrollmentId,
        status: 'enrolled',
      };
      break;

    case 'send_status_update':
      // Get referral with case manager info
      const { data: referral } = await supabase
        .from('workforce_referrals')
        .select('*, enrollments(status, programs(name))')
        .eq('id', referralId)
        .single();

      if (!referral || !referral.case_manager_email) {
        return NextResponse.json({ 
          error: 'Referral not found or no case manager email' 
        }, { status: 400 });
      }

      // Send status update email (implement email sending)
      // For now, just log the update
      updateData = {
        last_status_update_sent_at: new Date().toISOString(),
      };

      // Send status update email
      if (referral.case_manager_email) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: referral.case_manager_email,
              subject: `Referral Status Update - ${referral.participant_name}`,
              template: 'referral-status-update',
              data: { referral, status: updateData }
            })
          });
        } catch (emailError) {
          logger.error('Failed to send status email:', emailError);
        }
      }
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error } = await supabase
    .from('workforce_referrals')
    .update(updateData)
    .eq('id', referralId);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Action '${action}' completed` });
}

// Automated status update endpoint (for cron jobs)
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  // This endpoint is for automated status updates
  // Should be called by a cron job
  
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all referrals with status update enabled that haven't been updated in 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: referrals } = await supabase
    .from('workforce_referrals')
    .select(`
      *,
      enrollments (
        status,
        programs (name)
      )
    `)
    .eq('status_update_email_enabled', true)
    .not('case_manager_email', 'is', null)
    .or(`last_status_update_sent_at.is.null,last_status_update_sent_at.lt.${sevenDaysAgo.toISOString()}`);

  if (!referrals || referrals.length === 0) {
    return NextResponse.json({ message: 'No updates needed', count: 0 });
  }

  let sentCount = 0;

  for (const referral of referrals) {
    // Send status update email
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: referral.case_manager_email,
          subject: `Weekly Status Update - ${referral.participant_name}`,
          template: 'referral-weekly-update',
          data: { referral }
        })
      });
    } catch (emailError) {
      logger.error('Failed to send email to:', referral.case_manager_email, emailError);
    }
    
    await supabase
      .from('workforce_referrals')
      .update({ last_status_update_sent_at: new Date().toISOString() })
      .eq('id', referral.id);
    
    sentCount++;
  }

  return NextResponse.json({ 
    success: true, 
    message: `Sent ${sentCount} status updates`,
    count: sentCount 
  });
}
