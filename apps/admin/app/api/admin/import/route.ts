import { logger } from '@/lib/logger';
/**
 * Admin Data Import API
 * Handles CSV file uploads and parses them for import
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** CSV is loaded entirely into memory — cap file size and row count. */
const MAX_CSV_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_CSV_ROWS = 25_000;

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted values with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.replace(/^["']|["']$/g, '') || '';
    });
    records.push(record);
  }

  return records;
}

async function importStudents(
  supabase: any,
  tenantId: string,
  records: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { success: true, imported: 0, failed: 0, errors: [] };

  for (const record of records) {
    try {
      const email = record.email?.toLowerCase();
      if (!email) {
        result.failed++;
        result.errors.push('Missing email field');
        continue;
      }

      const fullName =
        record.full_name ||
        [record.first_name, record.last_name].filter(Boolean).join(' ') ||
        email.split('@')[0];

      // Check if profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existing) {
        // Update existing profile
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: record.phone || null,
            external_id: record.external_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        result.imported++;
      } else {
        // Create new profile (without auth user for CSV import)
        const { error } = await supabase.from('profiles').insert({
          id: crypto.randomUUID(),
          email,
          full_name: fullName,
          phone: record.phone || null,
          role: 'student',
          tenant_id: tenantId,
          external_id: record.external_id || null,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        result.imported++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(
        `${record.email || 'Unknown'}: ${error instanceof Error ? 'Import failed: see logs' : 'Import failed'}`,
      );
    }
  }

  result.success = result.failed === 0;
  return result;
}

async function importCourses(
  supabase: any,
  tenantId: string,
  records: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { success: true, imported: 0, failed: 0, errors: [] };

  for (const record of records) {
    try {
      const name = record.name || record.course_name;
      if (!name) {
        result.failed++;
        result.errors.push('Missing name field');
        continue;
      }

      const code =
        record.code ||
        record.course_code ||
        name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);

      // Check if course exists in canonical table
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', code.toLowerCase().replace(/_/g, '-'))
        .maybeSingle();

      const slug = code.toLowerCase().replace(/_/g, '-');

      if (existing) {
        await supabase
          .from('courses')
          .update({
            title: name,
            description: record.description || '',
            is_active: record.is_active !== 'false',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('courses').insert({
          id: crypto.randomUUID(),
          slug,
          title: name,
          description: record.description || '',
          status: 'draft',
          is_active: record.is_active !== 'false',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `${record.name || 'Unknown'}: ${error instanceof Error ? 'Import failed: see logs' : 'Import failed'}`,
      );
    }
  }

  result.success = result.failed === 0;
  return result;
}

async function importEnrollments(
  supabase: any,
  tenantId: string,
  records: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { success: true, imported: 0, failed: 0, errors: [] };

  for (const record of records) {
    try {
      const studentEmail = record.student_email?.toLowerCase();
      const courseCode = record.course_code;

      if (!studentEmail || !courseCode) {
        result.failed++;
        result.errors.push('Missing student_email or course_code');
        continue;
      }

      // Find student
      const { data: student } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', studentEmail)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (!student) {
        result.failed++;
        result.errors.push(`Student not found: ${studentEmail}`);
        continue;
      }

      // Find course in canonical table
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseCode.toLowerCase().replace(/_/g, '-'))
        .maybeSingle();

      if (!course) {
        result.failed++;
        result.errors.push(`Course not found: ${courseCode}`);
        continue;
      }

      // Check existing enrollment
      const { data: existing } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', student.id)
        .eq('course_id', course.id)
        .maybeSingle();

      const enrollmentData = {
        user_id: student.id,
        course_id: course.id,
        status: record.status || 'active',
        progress: parseInt(record.progress) || 0,
        enrolled_at: record.enrolled_at || new Date().toISOString(),
        tenant_id: tenantId,
      };

      if (existing) {
        await supabase.from('program_enrollments').update(enrollmentData).eq('id', existing.id);
      } else {
        await supabase.from('program_enrollments').insert({
          ...enrollmentData,
          id: crypto.randomUUID(),
        });
      }
      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `${record.student_email || 'Unknown'}: ${error instanceof Error ? 'Import failed: see logs' : 'Import failed'}`,
      );
    }
  }

  result.success = result.failed === 0;
  return result;
}

async function importEmployers(
  supabase: any,
  tenantId: string,
  records: Record<string, string>[],
): Promise<ImportResult> {
  const result: ImportResult = { success: true, imported: 0, failed: 0, errors: [] };

  for (const record of records) {
    try {
      const companyName = record.company_name || record.name;
      if (!companyName) {
        result.failed++;
        result.errors.push('Missing company_name field');
        continue;
      }

      // Check if employer exists
      const { data: existing } = await supabase
        .from('employers')
        .select('id')
        .eq('company_name', companyName)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const employerData = {
        company_name: companyName,
        contact_name: record.contact_name || null,
        contact_email: record.contact_email?.toLowerCase() || null,
        phone: record.phone || null,
        address: record.address || null,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('employers').update(employerData).eq('id', existing.id);
      } else {
        await supabase.from('employers').insert({
          ...employerData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        });
      }
      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `${record.company_name || 'Unknown'}: ${error instanceof Error ? 'Import failed: see logs' : 'Import failed'}`,
      );
    }
  }

  result.success = result.failed === 0;
  return result;
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;

    const supabase = await createClient();

    // Get current tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', auth.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const tenantId = profile.tenant_id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type parameter' }, { status: 400 });
    }

    if (file.size > MAX_CSV_BYTES) {
      return NextResponse.json(
        { error: `CSV exceeds ${Math.round(MAX_CSV_BYTES / (1024 * 1024))} MB limit` },
        { status: 413 },
      );
    }

    // Read and parse CSV
    const content = await file.text();
    const records = parseCSV(content);

    if (records.length > MAX_CSV_ROWS) {
      return NextResponse.json(
        {
          error: `CSV exceeds ${MAX_CSV_ROWS.toLocaleString()} row limit (${records.length} rows parsed)`,
        },
        { status: 413 },
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, imported: 0, failed: 0, errors: ['No valid records found in CSV'] },
        { status: 400 },
      );
    }

    // Import based on type
    let result: ImportResult;
    switch (type) {
      case 'students':
        result = await importStudents(supabase, tenantId, records);
        break;
      case 'courses':
        result = await importCourses(supabase, tenantId, records);
        break;
      case 'enrollments':
        result = await importEnrollments(supabase, tenantId, records);
        break;
      case 'employers':
        result = await importEmployers(supabase, tenantId, records);
        break;
      default:
        return NextResponse.json({ error: `Unknown import type: ${type}` }, { status: 400 });
    }

    await logAdminAudit({
      action: AdminAction.BULK_IMPORT_EXECUTED,
      actorId: auth.id,
      entityType: type,
      entityId: BULK_ENTITY_ID,
      metadata: {
        import_type: type,
        total_records: records.length,
        imported: result.imported,
        failed: result.failed,
        file_name: file.name,
      },
      req: request,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Import error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? 'Import failed: see logs' : 'Import failed'],
      },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit(
  '/api/admin/import',
  _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>,
);
