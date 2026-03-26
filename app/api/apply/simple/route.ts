import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendApplicationWelcomeEmail } from '@/lib/email/application-welcome';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding';

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

    const { error } = await supabase.from("applications").insert({
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      program,
      funding,
      eligible,
      notes: eligible ? "Prescreen passed" : "Needs review",
    });

    if (error) throw error;

    // Send detailed welcome email (non-blocking)
    const applicantName = (data.get("name") as string) || '';
    const applicantEmail = (data.get("email") as string) || '';
    if (applicantEmail) {
      sendApplicationWelcomeEmail({
        to: applicantEmail,
        firstName: applicantName.split(' ')[0] || applicantName,
        programSlug: program,
      }).catch(() => {});

      // Send onboarding email with Calendly link and next steps (BCC admin)
      sendOnboardingEmail({
        email: applicantEmail,
        name: applicantName,
        program,
      }).catch(() => {});
    }

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
