import { NextResponse } from "next/server";
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendApplicationWelcomeEmail } from '@/lib/email/application-welcome';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding';
import { insertWithPreAuthCheck } from '@/lib/pre-auth-guard';

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    try { const rl = await applyRateLimit(req, 'strict'); if (rl) return rl; } catch {}

    // Accept both form data and JSON
    const contentType = req.headers.get('content-type') || '';
    let program: string, funding: string, name: string, email: string, phone: string;
    if (contentType.includes('application/json')) {
      const json = await req.json();
      program = json.program; funding = json.funding; name = json.name; email = json.email; phone = json.phone;
    } else {
      const data = await req.formData();
      program = data.get('program') as string; funding = data.get('funding') as string;
      name = data.get('name') as string; email = data.get('email') as string; phone = data.get('phone') as string;
    }

    // WIOA-style prescreen
    const eligible = funding !== "Self Pay" && program !== "Not Sure";

    let supabase: Awaited<ReturnType<typeof getAdminClient>> | null = null;
    try { supabase = await getAdminClient(); } catch {}

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Resolve program_id so the review page can approve without guessing
    let resolvedProgramId: string | null = null;
    if (program) {
      const { data: matchedProgram } = await supabase
        .from('programs')
        .select('id')
        .or(`slug.ilike.%${program}%,title.ilike.%${program}%`)
        .maybeSingle();
      resolvedProgramId = matchedProgram?.id ?? null;
    }

    // Split name into first/last — applications table has NOT NULL on both
    const nameParts = (name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    // @preAuthWrite table=applications mode=reconcile
    const { error } = await insertWithPreAuthCheck(supabase, 'applications', {
      first_name: firstName,
      last_name: lastName,
      name,
      email,
      phone,
      program_interest: program,
      program_id: resolvedProgramId,
      funding_type: funding,
      source: 'simple_form',
      notes: eligible ? "Prescreen passed — WIOA eligible" : "Needs review",
      status: 'submitted',
      // Required NOT NULL columns — simple form doesn't collect address
      city: 'Unknown',
      zip: '00000',
      state: 'IN',
    });

    if (error) {
      return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
    }

    // Welcome and onboarding emails fire when application moves to 'in_review'
    // via the transition route — not on submission.

    return NextResponse.redirect(
      new URL("/apply/success", req.url),
      { status: 303 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/apply/simple', _POST);
