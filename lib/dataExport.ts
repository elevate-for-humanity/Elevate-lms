import { createClient } from '@/lib/supabase/server';

// =====================================================
// CSV EXPORT
// =====================================================
// PDF export: POST /api/internal/cert-pdf
// to keep heavy PDF libraries out of the main Next.js server handler

export interface ExportColumn {
  key: string;
  label: string;
  format?: (data: any) => string;
}

export interface ExportOptions {
  filename?: string;
  columns?: ExportColumn[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], columns?: ExportColumn[]): string {
  if (data.length === 0) return '';

  // Determine columns
  const cols: ExportColumn[] = columns || Object.keys(data[0]).map((key: any) => ({ key, label: key }));

  // Create header row
  const headers = cols.map((col) => escapeCSVValue(col.label)).join(',');

  // Create data rows
  const rows = data.map((row: any) => {
    return cols
      .map((col) => {
        const value = row[col.key];
        const formatted = value == null ? '' : col.format ? col.format(value) : value;
        return escapeCSVValue(formatted);
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Escape CSV values
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';

  const raw = String(value);
  const str = typeof value === 'string' && /^[\t\r\n ]*[=+@-]/.test(raw) ? `'${raw}` : raw;

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string = 'export.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =====================================================
// DATABASE EXPORT FUNCTIONS
// =====================================================

/**
 * Export students data
 */
export async function exportStudents(options: ExportOptions = {}): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone, created_at, role')
    .eq('role', 'student');

  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Apply sorting
  if (options.sortBy) {
    query = query.order(options.sortBy, {
      ascending: options.sortOrder === 'asc',
    });
  }

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Export courses data
 */
function applyExportOptions(query: any, options: ExportOptions) {
  for (const [key, value] of Object.entries(options.filters ?? {})) query = query.eq(key, value);
  if (options.sortBy) query = query.order(options.sortBy, { ascending: options.sortOrder === 'asc' });
  if (options.limit) query = query.limit(options.limit);
  return query;
}

async function exportRowsById(db: Awaited<ReturnType<typeof createClient>>, table: string, fields: string, ids: unknown[]) {
  const keys = [...new Set(ids.filter(Boolean))];
  if (!keys.length) return [] as any[];
  const { data, error } = await db.from(table).select(fields).in('id', keys);
  if (error) throw error;
  return (data ?? []) as any[];
}

function exportedPersonName(profile: any, fallback?: string) {
  return profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || fallback || 'N/A';
}

export async function exportCourses(options: ExportOptions = {}): Promise<any[]> {
  const db = await createClient();
  const { data, error } = await applyExportOptions(db.from('lms_courses')
    .select('id,title,description,duration:duration_hours,status,created_at,program_id'), options);
  if (error) throw error;
  const rows = data ?? [];
  const [programs, assignmentResult] = await Promise.all([
    exportRowsById(db, 'programs', 'id,category,tuition', rows.map((row: any) => row.program_id)),
    rows.length ? db.from('instructor_assignments').select('course_id,instructor_id').in('course_id', rows.map((row: any) => row.id)).eq('active', true) : { data: [], error: null },
  ]);
  if (assignmentResult.error) throw assignmentResult.error;
  const assignments = assignmentResult.data ?? [];
  const instructors = await exportRowsById(db, 'profiles', 'id,full_name,first_name,last_name,email', assignments.map(row => row.instructor_id));
  const programById = new Map(programs.map(row => [row.id, row]));
  const instructorById = new Map(instructors.map(row => [row.id, row]));
  return rows.map((row: any) => {
    const program = programById.get(row.program_id);
    const assigned = assignments.filter(assignment => assignment.course_id === row.id).map(assignment => instructorById.get(assignment.instructor_id)).filter(Boolean);
    const price = program?.tuition == null ? null : Number(program.tuition);
    return { ...row, category: program?.category ?? null, level: null, price: price != null && Number.isFinite(price) ? price : null,
      instructor_name: assigned.length ? assigned.map(profile => exportedPersonName(profile)).join('; ') : 'N/A',
      instructor_email: assigned.map(profile => profile.email).filter(Boolean).join('; ') || 'N/A' };
  });
}

export async function exportEnrollments(options: ExportOptions = {}): Promise<any[]> {
  const db = await createClient();
  const { data, error } = await applyExportOptions(db.from('program_enrollments')
    .select('id,enrolled_at,completed_at,progress:progress_percent,status,user_id,course_id,program_id,full_name,email'), options);
  if (error) throw error;
  const rows = data ?? [];
  const [students, courses, programs] = await Promise.all([
    exportRowsById(db, 'profiles', 'id,full_name,first_name,last_name,email', rows.map((row: any) => row.user_id)),
    exportRowsById(db, 'lms_courses', 'id,title', rows.map((row: any) => row.course_id)),
    exportRowsById(db, 'programs', 'id,title,category', rows.map((row: any) => row.program_id)),
  ]);
  const studentById = new Map(students.map(row => [row.id, row]));
  const courseById = new Map(courses.map(row => [row.id, row]));
  const programById = new Map(programs.map(row => [row.id, row]));
  return rows.map((row: any) => ({ ...row, student_name: exportedPersonName(studentById.get(row.user_id), row.full_name),
    student_email: studentById.get(row.user_id)?.email || row.email || 'N/A',
    course_title: courseById.get(row.course_id)?.title || programById.get(row.program_id)?.title || 'N/A',
    course_category: programById.get(row.program_id)?.category ?? 'N/A' }));
}

export async function exportAssignments(options: ExportOptions = {}): Promise<any[]> {
  const db = await createClient();
  const { data, error } = await applyExportOptions(db.from('assignments')
    .select('id,title,description,due_date,points:max_points,created_at,course_id'), options);
  if (error) throw error;
  const rows = data ?? [];
  const courses = await exportRowsById(db, 'lms_courses', 'id,title', rows.map((row: any) => row.course_id));
  const courseById = new Map(courses.map(row => [row.id, row]));
  return rows.map((row: any) => ({ ...row, course_title: courseById.get(row.course_id)?.title || 'N/A' }));
}

export async function exportGrades(options: ExportOptions = {}): Promise<any[]> {
  const db = await createClient();
  const { data, error } = await applyExportOptions(db.from('assignment_submissions')
    .select('id,submitted_at,grade,feedback,status,user_id,student_id,assignment_id,course_id'), options);
  if (error) throw error;
  const rows = data ?? [];
  const [students, assignments] = await Promise.all([
    exportRowsById(db, 'profiles', 'id,full_name,first_name,last_name,email', rows.map((row: any) => row.user_id || row.student_id)),
    exportRowsById(db, 'assignments', 'id,title,max_points,course_id', rows.map((row: any) => row.assignment_id)),
  ]);
  const courses = await exportRowsById(db, 'lms_courses', 'id,title', [...rows.map((row: any) => row.course_id), ...assignments.map(row => row.course_id)]);
  const studentById = new Map(students.map(row => [row.id, row]));
  const assignmentById = new Map(assignments.map(row => [row.id, row]));
  const courseById = new Map(courses.map(row => [row.id, row]));
  return rows.map((row: any) => {
    const student = studentById.get(row.user_id || row.student_id);
    const assignment = assignmentById.get(row.assignment_id);
    return { ...row, student_name: exportedPersonName(student), student_email: student?.email || 'N/A',
      assignment_title: assignment?.title || 'N/A', assignment_points: assignment?.max_points ?? null,
      course_title: courseById.get(assignment?.course_id || row.course_id)?.title || 'N/A' };
  });
}

export async function exportAnalytics(
  type: 'course' | 'student' | 'instructor',
  id: string,
  options: ExportOptions = {},
): Promise<any[]> {
  const supabase = await createClient();

  // Implementation depends on your analytics schema
  // This is a Content
  const { data, error }: any = await supabase
    .from('analytics_events')
    .select('*')
    .eq('entity_type', type)
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(options.limit || 1000);

  if (error) throw error;

  return data || [];
}

// =====================================================
// PREDEFINED EXPORT TEMPLATES
// =====================================================

export const EXPORT_TEMPLATES = {
  students: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      {
        key: 'created_at',
        label: 'Registered',
        format: (v: string) => new Date(v).toLocaleDateString(),
      },
    ],
  },
  courses: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Course Title' },
      { key: 'category', label: 'Category' },
      { key: 'level', label: 'Level' },
      { key: 'duration', label: 'Duration (hours)' },
      {
        key: 'price',
        label: 'Price',
        format: (v: number) => `$${v.toFixed(2)}`,
      },
      { key: 'instructor_name', label: 'Instructor' },
      { key: 'status', label: 'Status' },
    ],
  },
  enrollments: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'student_name', label: 'Student' },
      { key: 'student_email', label: 'Email' },
      { key: 'course_title', label: 'Course' },
      {
        key: 'enrolled_at',
        label: 'Enrolled',
        format: (v: string) => new Date(v).toLocaleDateString(),
      },
      {
        key: 'progress',
        label: 'Progress (%)',
        format: (v: number) => `${v}%`,
      },
      { key: 'grade', label: 'Grade' },
      { key: 'status', label: 'Status' },
    ],
  },
  grades: {
    columns: [
      { key: 'student_name', label: 'Student' },
      { key: 'course_title', label: 'Course' },
      { key: 'assignment_title', label: 'Assignment' },
      { key: 'assignment_points', label: 'Max Points' },
      { key: 'grade', label: 'Grade' },
      {
        key: 'submitted_at',
        label: 'Submitted',
        format: (v: string) => new Date(v).toLocaleDateString(),
      },
      { key: 'status', label: 'Status' },
    ],
  },
};

// =====================================================
// BATCH EXPORT
// =====================================================

export interface BatchExportOptions {
  format: 'csv' | 'pdf';
  tables: string[];
  filters?: Record<string, Record<string, any>>;
}

/**
 * Export multiple tables at once
 */
export async function batchExport(options: BatchExportOptions): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const table of options.tables) {
    const filters = options.filters?.[table] || {};

    switch (table) {
      case 'students':
        results[table] = await exportStudents({ filters });
        break;
      case 'courses':
        results[table] = await exportCourses({ filters });
        break;
      case 'enrollments':
        results[table] = await exportEnrollments({ filters });
        break;
      case 'assignments':
        results[table] = await exportAssignments({ filters });
        break;
      case 'grades':
        results[table] = await exportGrades({ filters });
        break;
    }
  }

  return results;
}
