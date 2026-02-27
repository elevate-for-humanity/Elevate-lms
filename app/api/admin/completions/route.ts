export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

const toDateString = (value: any) => {
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  }
  return "";
};

const _GET = withAuth(
  async (req: NextRequest, { user }) => {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");
    const format = url.searchParams.get("format") || "json";
    const days = daysParam ? Number(daysParam) : 7;

    const since = new Date();
    since.setDate(since.getDate() - (isNaN(days) ? 7 : days));

    const supabase = await getSupabaseServerClient();
  const db = supabase;

    const { data, error }: any = await db
      .from("partner_certificates")
      .select(`
        id,
        certificate_number,
        certificate_url,
        verification_url,
        issued_date,
        enrollment_id,
        partner_lms_enrollments!inner (
          id,
          program_id,
          provider_id,
          student_id,
          partner_lms_providers ( provider_name ),
          partner_courses ( course_name ),
          profiles ( full_name, email )
        )
      `)
      .gte("issued_date", since.toISOString())
      .order("issued_date", { ascending: false });

    if (error) {
      logger.error("[GET /api/admin/completions] error", error);
      return NextResponse.json({ completions: [], error: toErrorMessage(error) }, { status: 200 });
    }

    const completions = (data ?? []).map((row: any) => {
      const e = row.partner_lms_enrollments ?? {};
      const student = e.profiles ?? {};
      const provider = e.partner_lms_providers ?? {};
      const course = e.partner_courses ?? {};
      const fundingSource = "WIOA/WRG";

      return {
        id: row.id,
        certificateNumber: row.certificate_number ?? null,
        certificateUrl: row.certificate_url,
        verificationUrl: row.verification_url ?? null,
        issuedDate: row.issued_date,
        courseName: course.course_name ?? "Partner Course",
        partnerName: provider.provider_name ?? "Partner",
        studentName: student.full_name ?? "Student",
        studentEmail: student.email ?? "",
        programName: null,
        fundingSource,
      };
    });

    if (format === "csv") {
      const headers = [
        "Student Name",
        "Student Email",
        "Course Name",
        "Partner",
        "Funding Source",
        "Certificate Number",
        "Issued Date",
        "Certificate URL",
        "Verification URL",
      ];

      const rows = completions.map((c: any) => [
        c.studentName,
        c.studentEmail,
        c.courseName,
        c.partnerName,
        c.fundingSource,
        c.certificateNumber || "",
        toDateString(c.issuedDate),
        c.certificateUrl,
        c.verificationUrl || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row: any[]) =>
          row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="completions-${days}days-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ completions });
  },
  { roles: ['admin', 'super_admin'] }
);
export const GET = withApiAudit('/api/admin/completions', _GET);
