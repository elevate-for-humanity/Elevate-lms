// PUBLIC ROUTE: public certificate verification

// app/api/verify/certificate/[certificateId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ certificateId: string }> };

async function _GET(_req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(_req, 'api');
    if (rateLimited) return rateLimited;

    const { certificateId } = await params;
    const supabase = await createClient();

    // Get certificate details
    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .select(`
        id,
        user_id,
        course_id,
        issued_at,
        certificate_number,
        verification_code,
        is_revoked
      `)
      .eq("id", certificateId)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: "Certificate not found", valid: false },
        { status: 404 }
      );
    }

    if (certificate.is_revoked) {
      return NextResponse.json(
        { error: "Certificate has been revoked", valid: false },
        { status: 200 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", certificate.user_id)
      .single();

    // Get course details
    const { data: course } = await supabase
      .from("training_courses")
      .select("title, description")
      .eq("id", certificate.course_id)
      .single();

    const response = {
      valid: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificate_number,
        verificationCode: certificate.verification_code,
        issuedAt: certificate.issued_at,
        recipientName: profile?.full_name || "Unknown",
        recipientEmail: profile?.email || null,
        courseName: course?.title || "Unknown Course",
        courseDescription: course?.description || null,
        issuer: "Elevate For Humanity",
        issuerWebsite: process.env.NEXT_PUBLIC_SITE_URL || "https://www.elevateforhumanity.org",
      },
    };

    return NextResponse.json(response);
  } catch (error) { 
    logger.error("[Certificate Verification Error]:", error);
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/verify/certificate/[certificateId]', _GET);
