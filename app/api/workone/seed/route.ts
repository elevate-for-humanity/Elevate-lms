import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STEPS = [
  { key: 'efh_inquiry', label: 'Complete EFH Inquiry Form' },
  { key: 'icc_account', label: 'Create IndianaCareerConnect account' },
  {
    key: 'workone_appt_booked',
    label: 'Book WorkOne appointment with an advisor',
  },
  {
    key: 'tell_efh',
    label: 'Tell advisor: "I\'m here for Elevate for Humanity training"',
  },
  { key: 'save_appt_details', label: 'Save your appointment date/time' },
  {
    key: 'upload_docs',
    label: 'Upload eligibility documents if requested',
  },
  {
    key: 'confirm_pathway',
    label: 'Confirm funding pathway (WIOA/WRG/JRI/etc.)',
  },
  {
    key: 'call_efh_back',
    label: 'Call EFH back or schedule intake appointment',
  },
  { key: 'attend_appt', label: 'Attend WorkOne appointment' },
  { key: 'enrollment_final', label: 'EFH enrollment finalized' },
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get user's organization
    const { data: profile } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id || user.id;

    const inserts = STEPS.map((s) => ({
      organization_id: profile.organization_id,
      user_id: targetUserId,
      step_key: s.key,
      step_label: s.label,
      status: 'todo',
    }));

    // Upsert by (user_id, step_key)
    const { error } = await adminClient
      .from('workone_checklist')
      .upsert(inserts, { onConflict: 'user_id,step_key' });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : String(error)) ||
          'Internal server err',
      },
      { status: 500 }
    );
  }
}
