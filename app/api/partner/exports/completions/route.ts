import { NextResponse } from 'next/server';
import { getMyPartnerContext } from '@/lib/partner/access';
import { getPartnerStudentsWithTraining } from '@/lib/partner/students';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const ctx = await getMyPartnerContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shopIds = ctx.shops.map((s) => s.shop_id).filter(Boolean);
  if (!shopIds.length) {
    return NextResponse.json({ error: 'No partner shops found' }, { status: 403 });
  }

  const students = await getPartnerStudentsWithTraining(shopIds);

  // Grant-report grade columns
  const header = [
    'Student Name',
    'Email',
    'Location',
    'Placement Start',
    'Course',
    'Progress %',
    'Status',
    'Enrollment Date',
    'Completion Date',
    'Credential ID',
    'Total Certificates',
  ].join(',');

  const rows: string[] = [];

  for (const s of students) {
    if (s.courses.length === 0) {
      rows.push(csvRow([
        s.student_name,
        s.student_email,
        s.shop_name,
        s.placement_start || '',
        'No enrollments',
        '0',
        s.placement_status,
        '',
        '',
        '',
        String(s.certificate_count),
      ]));
    } else {
      for (const c of s.courses) {
        rows.push(csvRow([
          s.student_name,
          s.student_email,
          s.shop_name,
          s.placement_start || '',
          c.course_title,
          String(c.progress),
          c.status,
          isoDate(c.enrolled_at),
          isoDate(c.completed_at),
          c.credential_id || '',
          String(s.certificate_count),
        ]));
      }
    }
  }

  const csv = [header, ...rows].join('\n');
  const exportTimestamp = new Date().toISOString();
  const filename = `partner-completions-${exportTimestamp.slice(0, 10)}.csv`;

  // Audit trail — log who exported, when, and how many rows
  logExportAudit(ctx.user.id, ctx.user.email, shopIds, rows.length, exportTimestamp);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/** ISO date string (YYYY-MM-DD) or empty */
function isoDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/** Escape a CSV field — wrap in quotes if it contains commas, quotes, or newlines */
function csvRow(fields: string[]): string {
  return fields
    .map((f) => {
      if (f.includes(',') || f.includes('"') || f.includes('\n')) {
        return `"${f.replace(/"/g, '""')}"`;
      }
      return f;
    })
    .join(',');
}

/** Write audit record to partner_export_logs (fire-and-forget) */
async function logExportAudit(
  userId: string,
  userEmail: string | undefined,
  shopIds: string[],
  rowCount: number,
  timestamp: string,
) {
  try {
    const supabase = await createClient();
    await supabase.from('partner_export_logs').insert({
      user_id: userId,
      user_email: userEmail || null,
      shop_ids: shopIds,
      row_count: rowCount,
      export_type: 'completions_csv',
      exported_at: timestamp,
    });
  } catch {
    // Fire-and-forget — audit failure must not block the export
  }
}
