import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendApplicationWelcomeEmail } from '@/lib/email/application-welcome';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding';
import { insertWithPreAuthCheck } from '@/lib/pre-auth-guard';

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const data = await req.formData();

    const program = data.get("program") as string;
    const funding = data.get("funding") as string;

    // WIOA-style prescreen
    const eligible = funding !== "Self Pay" && program !== "Not Sure";

    const supabase = createAdminClient();

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
        .or(`slug.ilike.${program},title.ilike.${program}`)
        .maybeSingle();
      resolvedProgramId = matchedProgram?.id ?? null;
    }

    // @preAuthWrite table=applications mode=reconcile
    const { error } = await insertWithPreAuthCheck(supabase, 'applications', {
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      program,
      program_id: resolvedProgramId,
      funding,
      eligible,
      notes: eligible ? "Prescreen passed" : "Needs review",
    });

    if (error) throw error;

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
