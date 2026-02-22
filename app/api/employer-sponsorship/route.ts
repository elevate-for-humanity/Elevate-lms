/**
 * Employer Sponsorship API
 * 
 * Manages employer sponsorship records with post-hire reimbursement tracking.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  validateEmployerSponsorshipTerms,
  handleEmployerSeparation 
} from '@/lib/enrollment/funding-enforcement';
import { EMPLOYER_SPONSORSHIP_CONSTRAINTS } from '@/types/enrollment';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET: List sponsorships (admin) or get specific sponsorship
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sponsorshipId = searchParams.get('id');
  const status = searchParams.get('status');
  const employerName = searchParams.get('employer');

  let query = db
    .from('employer_sponsorships')
    .select(`
      *,
      enrollments (
        id,
        program_id,
        status,
        programs (name)
      )
    `);

  if (sponsorshipId) {
    query = query.eq('id', sponsorshipId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (employerName) {
    query = query.ilike('employer_name', `%${employerName}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ sponsorships: data });
}

// POST: Create new sponsorship
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const {
    enrollmentId,
    userId,
    employerName,
    employerContactName,
    employerContactEmail,
    employerContactPhone,
    monthlyReimbursement,
    termMonths,
  } = body;

  // Validate required fields
  if (!enrollmentId || !userId || !employerName) {
    return NextResponse.json({ 
      error: 'Missing required fields: enrollmentId, userId, employerName' 
    }, { status: 400 });
  }

  // Validate terms
  const reimbursement = monthlyReimbursement || 300;
  const term = termMonths || 16;
  
  const validation = validateEmployerSponsorshipTerms(reimbursement, term);
  if (!validation.valid) {
    return NextResponse.json({ 
      error: 'Invalid sponsorship terms',
      details: validation.errors 
    }, { status: 400 });
  }

  const { data, error } = await db
    .from('employer_sponsorships')
    .insert({
      enrollment_id: enrollmentId,
      user_id: userId,
      employer_name: employerName,
      employer_contact_name: employerContactName,
      employer_contact_email: employerContactEmail,
      employer_contact_phone: employerContactPhone,
      total_tuition: EMPLOYER_SPONSORSHIP_CONSTRAINTS.DEFAULT_TUITION,
      monthly_reimbursement: reimbursement,
      term_months: term,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    sponsorshipId: data.id,
    message: 'Employer sponsorship created. Send agreement to employer.'
  });
}

// PATCH: Update sponsorship (status, hire confirmation, reimbursement, separation)
export async function PATCH(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { sponsorshipId, action, data: actionData } = body;

  if (!sponsorshipId || !action) {
    return NextResponse.json({ error: 'sponsorshipId and action required' }, { status: 400 });
  }

  let updateData: Record<string, any> = {};

  switch (action) {
    case 'send_agreement':
      updateData = {
        status: 'agreement_sent',
      };
      break;

    case 'sign_agreement':
      updateData = {
        agreement_signed: true,
        agreement_signed_at: new Date().toISOString(),
        agreement_document_url: actionData?.documentUrl,
        status: 'agreement_signed',
      };
      break;

    case 'confirm_hire':
      if (!actionData?.hireDate) {
        return NextResponse.json({ error: 'Hire date required' }, { status: 400 });
      }
      
      // Calculate first reimbursement due date (first of next month after hire)
      const hireDate = new Date(actionData.hireDate);
      const nextMonth = new Date(hireDate.getFullYear(), hireDate.getMonth() + 1, 1);
      
      updateData = {
        hire_date: actionData.hireDate,
        hire_confirmed: true,
        hire_confirmed_at: new Date().toISOString(),
        next_reimbursement_due: nextMonth.toISOString().split('T')[0],
        status: 'active',
      };

      // Activate the enrollment
      const { data: sponsorship } = await db
        .from('employer_sponsorships')
        .select('enrollment_id')
        .eq('id', sponsorshipId)
        .single();

      if (sponsorship) {
        await db
          .from('program_enrollments')
          .update({ status: 'active', payment_status: 'paid' })
          .eq('id', sponsorship.enrollment_id);
      }
      break;

    case 'record_reimbursement':
      if (!actionData?.amount) {
        return NextResponse.json({ error: 'Reimbursement amount required' }, { status: 400 });
      }

      // Get current sponsorship data
      const { data: current } = await db
        .from('employer_sponsorships')
        .select('reimbursements_received, total_reimbursed, term_months, total_tuition')
        .eq('id', sponsorshipId)
        .single();

      if (!current) {
        return NextResponse.json({ error: 'Sponsorship not found' }, { status: 404 });
      }

      const newReimbursementsReceived = (current.reimbursements_received || 0) + 1;
      const newTotalReimbursed = (current.total_reimbursed || 0) + actionData.amount;
      
      // Calculate next due date
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      nextDue.setDate(1);

      updateData = {
        reimbursements_received: newReimbursementsReceived,
        total_reimbursed: newTotalReimbursed,
        last_reimbursement_at: new Date().toISOString(),
        next_reimbursement_due: nextDue.toISOString().split('T')[0],
      };

      // Check if completed
      if (newTotalReimbursed >= current.total_tuition || 
          newReimbursementsReceived >= current.term_months) {
        updateData.status = 'completed';
      }
      break;

    case 'separation':
      if (!actionData?.reason) {
        return NextResponse.json({ error: 'Separation reason required' }, { status: 400 });
      }

      const result = await handleEmployerSeparation(sponsorshipId, actionData.reason);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Employment separation recorded. Reimbursement stopped.' 
      });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error } = await db
    .from('employer_sponsorships')
    .update(updateData)
    .eq('id', sponsorshipId);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Action '${action}' completed` });
}
