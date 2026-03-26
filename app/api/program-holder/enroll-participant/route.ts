import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { checkMOUStatusServer } from '@/lib/mou-checks';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Example API endpoint that requires a fully executed MOU
 * This demonstrates how to gate functionality behind MOU completion
 */
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's program holder ID
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('program_holder_id')
    .eq('user_id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return Response.json(
      {
        error: 'No program holder assigned',
      },
      { status: 403 }
    );
  }

  // CHECK: MOU must be fully executed
  const mouStatus = await checkMOUStatusServer(
    supabase,
    prof.program_holder_id
  );

  if (!mouStatus.isValid) {
    return Response.json(
      {
        error: 'MOU_NOT_EXECUTED',
        message:
          'A fully executed MOU is required before enrolling participants.',
        currentStatus: mouStatus.status,
        requiresAction: true,
      },
      { status: 403 }
    );
  }

  // MOU is valid, proceed with enrollment logic
  const body = await req.json();
  const { participantName, programId } = body;

  // Your enrollment logic here...
  // For example:
  // const { data, error }: any = await supabase
  //   .from('cases')
  //   .insert({
  //     program_holder_id: prof.program_holder_id,
  //     participant_name: participantName,
  //     program_id: programId,
  //     status: 'enrolled'
  //   })
  //   .select()
  //   .single();

  return Response.json({
    success: true,
    message: 'Participant enrolled successfully',
  });
}
export const POST = withApiAudit('/api/program-holder/enroll-participant', _POST);
