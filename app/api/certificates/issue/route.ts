
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCertificateNumber, generateCertificatePDF } from "@/lib/certificates/generator";
import { applyRateLimit } from '@/lib/api/withRateLimit';

async function parseBody<T>(request: NextRequest): Promise<T> {
  return request.json() as Promise<T>;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);
    const { studentId, programId, studentName, programName, programHours } = body;

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

    // Generate certificate number
    const certificateNumber = generateCertificateNumber();
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
        student_name: studentName,
        program_name: programName,
        completion_date: completionDate,
        program_hours: programHours,
        pdf_url: urlData.publicUrl,
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
