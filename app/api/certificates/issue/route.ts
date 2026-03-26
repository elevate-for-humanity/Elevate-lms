
import { createAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { generateCertificateNumber, generateCertificatePDF } from "@/lib/certificates/generator";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function parseBody<T>(request: NextRequest): Promise<T> {
  return request.json() as Promise<T>;
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Auth: require admin or super_admin to issue certificates
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const authClient = await createServerClient();
    const { data: { session } } = await authClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminDb = createAdminClient();
    const authDb = adminDb || authClient;
    const { data: profile } = await authDb.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { studentId, programId, studentName, programName, programHours, courseId, skipCompletionCheck } = body;

    // Validate required fields
    if (!studentId || !programId || !studentName || !programName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check completion rules (admin can override with skipCompletionCheck)
    if (!skipCompletionCheck && courseId) {
      const { evaluateCompletion } = await import('@/lib/lms/completion-rules');
      const completionStatus = await evaluateCompletion(studentId, programId, courseId);
      if (!completionStatus.isComplete) {
        const unmet = completionStatus.ruleResults
          .filter(r => !r.passed)
          .map(r => r.detail)
          .join('; ');
        return NextResponse.json(
          { error: `Completion requirements not met: ${unmet}`, completionStatus },
          { status: 422 }
        );
      }
    }

    // Prevent duplicate issuance for same student + program
    const { data: existing } = await supabase
      .from("certificates")
      .select("id, certificate_number")
      .eq("student_id", studentId)
      .eq("program_id", programId)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Certificate already issued for this student and program", certificateNumber: existing.certificate_number },
        { status: 409 }
      );
    }

    // Generate certificate number and verification token
    const certificateNumber = generateCertificateNumber();
    const verificationToken = randomUUID();
    const completionDate = new Date().toISOString().split("T")[0];

    // Generate certificate PDF
    const certificateData = {
      studentName,
      courseName: programName,
      completionDate,
      certificateNumber,
      programHours,
    };

    const pdfBlob = await generateCertificatePDF(certificateData);

    // Convert blob to buffer for storage
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const filePath = `certificates/${certificateNumber}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload certificate" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("certificates")
      .getPublicUrl(filePath);

    // Save certificate record to database
    const { data: certRecord, error: dbError } = await supabase
      .from("certificates")
      .insert({
        student_id: studentId,
        program_id: programId,
        certificate_number: certificateNumber,
        verification_token: verificationToken,
        student_name: studentName,
        program_name: programName,
        completion_date: completionDate,
        program_hours: programHours,
        pdf_url: urlData.publicUrl,
        issued_by: session.user.id,
        issued_at: new Date().toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to save certificate record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certRecord.id,
        certificateNumber,
        verificationToken,
        verifyUrl: `/verify/${verificationToken}`,
        pdfUrl: urlData.publicUrl,
        issuedAt: certRecord.issued_at,
      },
    });
  } catch (error) { 
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/certificates/issue', _POST);
