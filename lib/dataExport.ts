import { createClient } from '@/lib/supabase/server';

// PDF types - jsPDF is dynamically imported to reduce bundle size
type jsPDFInstance = {
  setFontSize: (size: number) => void;
  setFont: (font: string, style: string) => void;
  text: (text: string, x: number, y: number) => void;
  setTextColor: (color: number) => void;
  getNumberOfPages: () => number;
  setPage: (page: number) => void;
  internal: { pageSize: { width: number; height: number } };
  output: (type: string) => ArrayBuffer;
  save: (filename: string) => void;
};

// =====================================================
// CSV EXPORT
// =====================================================

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
export function convertToCSV(
  data: any[],
  columns?: ExportColumn[]
): string {
  if (data.length === 0) return '';

  // Determine columns
  const cols =
    columns || Object.keys(data[0]).map((key: any) => ({ key, label: key }));

  // Create header row
  const headers = cols.map((col) => escapeCSVValue(col.label)).join(',');

  // Create data rows
  const rows = data.map((row: any) => {
    return cols
      .map((col) => {
        const value = row[col.key];
        const formatted = col.format
          ? col.format(value)
          : value;
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

  const str = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Download CSV file
 */
export function downloadCSV(
  csv: string,
  filename: string = 'export.csv'
): void {
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
// PDF EXPORT
// =====================================================

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  columns?: ExportColumn[];
  includeHeader?: boolean;
  includeFooter?: boolean;
  headerText?: string;
  footerText?: string;
}

/**
 * Export data to PDF
 */
export async function exportToPDF(
  data: any[],
  options: PDFExportOptions = {}
): Promise<jsPDFInstance> {
  const {
    title = 'Data Export',
    subtitle,
    orientation = 'portrait',
    pageSize = 'a4',
    columns,
    includeHeader = true,
    includeFooter = true,
    headerText,
    footerText,
  } = options;

  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  let yPosition = 20;

  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, yPosition);
    yPosition += 10;
  }

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, yPosition);
    yPosition += 8;
  }

  // Add export date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 10;

  // Determine columns
  const cols =
    columns || Object.keys(data[0] || {}).map((key: any) => ({ key, label: key }));

  // Prepare table data
  const headers = cols.map((col) => col.label);
  const rows = data.map((row) =>
    cols.map((col) => {
      const value = row[col.key];
      return col.format
        ? col.format(value)
        : String(value || '');
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPosition,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add footer
  if (includeFooter) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);

      const footerY = doc.internal.pageSize.height - 10;

      if (footerText) {
        doc.text(footerText, 14, footerY);
      }

      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        footerY
      );
    }
  }

  return doc;
}

/**
 * Download PDF file
 */
export function downloadPDF(doc: jsPDFInstance, filename: string = 'export.pdf'): void {
  doc.save(filename);
}

// =====================================================
// DATABASE EXPORT FUNCTIONS
// =====================================================

/**
 * Export students data
 */
export async function exportStudents(
  options: ExportOptions = {}
): Promise<any[]> {
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
export async function exportCourses(
  options: ExportOptions = {}
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase.from('courses').select(`
      id,
      title,
      description,
      category,
      level,
      duration,
      price,
      status,
      created_at,
      instructor:profiles!instructor_id(first_name, last_name, email)
    `);

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options.sortBy) {
    query = query.order(options.sortBy, {
      ascending: options.sortOrder === 'asc',
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Flatten instructor data
  return (data || []).map((course) => ({
    ...course,
    instructor_name: course.instructor
      ? `${course.instructor?.first_name} ${course.instructor?.last_name}`
      : 'N/A',
    instructor_email: (course.instructor as string)?.email || 'N/A',
  }));
}

/**
 * Export enrollments data
 */
export async function exportEnrollments(
  options: ExportOptions = {}
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase.from('enrollments').select(`
      id,
      enrolled_at,
      completed_at,
      progress,
      grade,
      status,
      student:profiles!user_id(first_name, last_name, email),
      course:courses(title, category)
    `);

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options.sortBy) {
    query = query.order(options.sortBy, {
      ascending: options.sortOrder === 'asc',
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Flatten nested data
  return (data || []).map((enrollment) => ({
    ...enrollment,
    student_name: enrollment.student
      ? `${enrollment.student?.[0]?.first_name} ${enrollment.student?.[0]?.last_name}`
      : 'N/A',
    student_email: enrollment.student?.email || 'N/A',
    course_title: enrollment.course?.[0]?.title || 'N/A',
    course_category: enrollment.course?.[0]?.category || 'N/A',
  }));
}

/**
 * Export assignments data
 */
export async function exportAssignments(
  options: ExportOptions = {}
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase.from('assignments').select(`
      id,
      title,
      description,
      due_date,
      points,
      created_at,
      course:courses(title)
    `);

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options.sortBy) {
    query = query.order(options.sortBy, {
      ascending: options.sortOrder === 'asc',
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((assignment) => ({
    ...assignment,
    course_title: assignment.course?.[0]?.title || 'N/A',
  }));
}

/**
 * Export grades data
 */
export async function exportGrades(
  options: ExportOptions = {}
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase.from('assignment_submissions').select(`
      id,
      submitted_at,
      grade,
      feedback,
      status,
      student:profiles!user_id(first_name, last_name, email),
      assignment:assignments(title, points, course:courses(title))
    `);

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options.sortBy) {
    query = query.order(options.sortBy, {
      ascending: options.sortOrder === 'asc',
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((submission) => ({
    ...submission,
    student_name: submission.student
      ? `${submission.student?.[0]?.first_name} ${submission.student?.[0]?.last_name}`
      : 'N/A',
    student_email: submission.student?.[0]?.email || 'N/A',
    assignment_title: submission.assignment?.[0]?.title || 'N/A',
    assignment_points: submission.assignment?.points || 0,
    course_title:
      submission.assignment?.course?.[0]?.title || 'N/A',
  }));
}

/**
 * Export analytics data
 */
export async function exportAnalytics(
  type: 'course' | 'student' | 'instructor',
  id: string,
  options: ExportOptions = {}
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
export async function batchExport(
  options: BatchExportOptions
): Promise<Record<string, any>> {
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
