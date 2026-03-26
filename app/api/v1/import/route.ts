import { logger } from '@/lib/logger';
/**
 * Data Import API for License Holders
 * Allows bulk import of students, courses, and enrollments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateApiKey } from '@/lib/licensing';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface ImportStudent {
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  external_id?: string;
}

interface ImportCourse {
  name: string;
  code?: string;
  description?: string;
  duration_weeks?: number;
  external_id?: string;
}

interface ImportEnrollment {
  student_email: string;
  course_code: string;
  status?: 'pending' | 'active' | 'completed';
  enrolled_at?: string;
  progress?: number;
}

interface ImportRequest {
  type: 'students' | 'courses' | 'enrollments';
  data: ImportStudent[] | ImportCourse[] | ImportEnrollment[];
  options?: {
    upsert?: boolean;
    skip_errors?: boolean;
  };
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Include x-api-key header.' },
        { status: 401 }
      );
    }

    const validation = await validateApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    const tenantId = validation.tenantId;
    const body: ImportRequest = await request.json();

    if (!body.type || !body.data || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: 'Invalid request. Required: type (students|courses|enrollments) and data array' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    switch (body.type) {
      case 'students':
        await importStudents(supabase, tenantId!, body.data as ImportStudent[], results, body.options);
        break;
      case 'courses':
        await importCourses(supabase, tenantId!, body.data as ImportCourse[], results, body.options);
        break;
      case 'enrollments':
        await importEnrollments(supabase, tenantId!, body.data as ImportEnrollment[], results, body.options);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown import type: ${body.type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      imported: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit error messages
      total_errors: results.errors.length,
    });

  } catch (error) {
    logger.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function importStudents(
  supabase: any,
  tenantId: string,
  students: ImportStudent[],
  results: { success: number; failed: number; errors: string[] },
  options?: { upsert?: boolean; skip_errors?: boolean }
) {
  for (const student of students) {
    try {
      if (!student.email) {
        results.failed++;
        results.errors.push(`Missing email for student`);
        continue;
      }

      const fullName = student.full_name || 
        [student.first_name, student.last_name].filter(Boolean).join(' ') ||
        student.email.split('@')[0];

      // Check if user exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', student.email)
        .eq('tenant_id', tenantId)
        .single();

      if (existing && !options?.upsert) {
        results.failed++;
        results.errors.push(`Student ${student.email} already exists`);
        continue;
      }

      if (existing) {
        // Update existing
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: student.phone,
            external_id: student.external_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: generateTempPassword(),
          email_confirm: true,
          user_metadata: { full_name: fullName, tenant_id: tenantId },
        });

        if (authError) throw authError;

        // Create profile
        await supabase.from('profiles').insert({
          id: authUser.user.id,
          email: student.email,
          full_name: fullName,
          phone: student.phone,
          role: 'student',
          tenant_id: tenantId,
          external_id: student.external_id,
          created_at: new Date().toISOString(),
        });
      }

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${student.email}: ${'Internal server error'}`);
      if (!options?.skip_errors) throw error;
    }
  }
}

async function importCourses(
  supabase: any,
  tenantId: string,
  courses: ImportCourse[],
  results: { success: number; failed: number; errors: string[] },
  options?: { upsert?: boolean; skip_errors?: boolean }
) {
  for (const course of courses) {
    try {
      if (!course.name) {
        results.failed++;
        results.errors.push(`Missing name for course`);
        continue;
      }

      const courseCode = course.code || course.name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);

      // Check if course exists
      const { data: existing } = await supabase
        .from('training_courses')
        .select('id')
        .eq('course_code', courseCode)
        .eq('tenant_id', tenantId)
        .single();

      if (existing && !options?.upsert) {
        results.failed++;
        results.errors.push(`Course ${courseCode} already exists`);
        continue;
      }

      const courseData = {
        course_name: course.name,
        course_code: courseCode,
        description: course.description || '',
        duration_weeks: course.duration_weeks || 8,
        tenant_id: tenantId,
        is_active: true,
        external_id: course.external_id,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('training_courses').update(courseData).eq('id', existing.id);
      } else {
        await supabase.from('training_courses').insert({
          ...courseData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        });
      }

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${course.name}: ${'Internal server error'}`);
      if (!options?.skip_errors) throw error;
    }
  }
}

async function importEnrollments(
  supabase: any,
  tenantId: string,
  enrollments: ImportEnrollment[],
  results: { success: number; failed: number; errors: string[] },
  options?: { upsert?: boolean; skip_errors?: boolean }
) {
  for (const enrollment of enrollments) {
    try {
      if (!enrollment.student_email || !enrollment.course_code) {
        results.failed++;
        results.errors.push(`Missing student_email or course_code`);
        continue;
      }

      // Find student
      const { data: student } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', enrollment.student_email)
        .eq('tenant_id', tenantId)
        .single();

      if (!student) {
        results.failed++;
        results.errors.push(`Student not found: ${enrollment.student_email}`);
        continue;
      }

      // Find course
      const { data: course } = await supabase
        .from('training_courses')
        .select('id')
        .eq('course_code', enrollment.course_code)
        .eq('tenant_id', tenantId)
        .single();

      if (!course) {
        results.failed++;
        results.errors.push(`Course not found: ${enrollment.course_code}`);
        continue;
      }

      // Check existing enrollment
      const { data: existing } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', student.id)
        .eq('course_id', course.id)
        .single();

      if (existing && !options?.upsert) {
        results.failed++;
        results.errors.push(`Enrollment already exists: ${enrollment.student_email} in ${enrollment.course_code}`);
        continue;
      }

      const enrollmentData = {
        user_id: student.id,
        course_id: course.id,
        status: enrollment.status || 'active',
        progress: enrollment.progress || 0,
        enrolled_at: enrollment.enrolled_at || new Date().toISOString(),
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

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${enrollment.student_email}: ${'Internal server error'}`);
      if (!options?.skip_errors) throw error;
    }
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!';
}

// GET endpoint for import status/documentation
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    name: 'Elevate LMS Import API',
    version: '1.0',
    endpoints: {
      'POST /api/v1/import': {
        description: 'Bulk import data',
        headers: {
          'x-api-key': 'Your API key (required)',
          'Content-Type': 'application/json',
        },
        body: {
          type: 'students | courses | enrollments',
          data: 'Array of records to import',
          options: {
            upsert: 'Update existing records (default: false)',
            skip_errors: 'Continue on errors (default: false)',
          },
        },
        examples: {
          students: {
            type: 'students',
            data: [
              { email: 'john.doe@elevateforhumanity.org', first_name: 'John', last_name: 'Doe', phone: '317-314-3757' },
            ],
          },
          courses: {
            type: 'courses',
            data: [
              { name: 'CNA Training', code: 'CNA101', duration_weeks: 8 },
            ],
          },
          enrollments: {
            type: 'enrollments',
            data: [
              { student_email: 'john.doe@elevateforhumanity.org', course_code: 'CNA101', status: 'active' },
            ],
          },
        },
      },
    },
  });
}
export const GET = withApiAudit('/api/v1/import', _GET);
export const POST = withApiAudit('/api/v1/import', _POST);
