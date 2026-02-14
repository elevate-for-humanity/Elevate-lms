/**
 * Partner CSV Export Reconciliation Test (Grant-Report Grade)
 *
 * Validates that the CSV generation logic correctly transforms
 * PartnerStudentWithTraining data into grant-report grade CSV rows.
 *
 * Run: npx tsx scripts/test-partner-csv-reconciliation.ts
 */

import type { PartnerStudentWithTraining } from '../lib/partner/students';

// --- Seed data: 3 students, 2 courses, 1 completion ---

const SEED: PartnerStudentWithTraining[] = [
  {
    student_id: 'stu-001',
    student_name: 'Alice Johnson',
    student_email: 'alice@example.com',
    shop_name: 'La Plaza Barber Academy',
    placement_status: 'active',
    placement_start: '2025-09-01',
    courses: [
      {
        course_id: 'crs-001',
        course_title: 'Barber Fundamentals',
        progress: 100,
        status: 'completed',
        enrolled_at: '2025-09-15T10:00:00Z',
        completed_at: '2025-12-01T14:30:00Z',
        credential_id: 'ABCD-EFGH-JKLM',
      },
      {
        course_id: 'crs-002',
        course_title: 'Advanced Styling',
        progress: 45,
        status: 'active',
        enrolled_at: '2025-12-05T09:00:00Z',
        completed_at: null,
        credential_id: null,
      },
    ],
    certificate_count: 1,
    overall_progress: 73,
  },
  {
    student_id: 'stu-002',
    student_name: 'Bob Smith',
    student_email: 'bob@example.com',
    shop_name: 'La Plaza Barber Academy',
    placement_status: 'active',
    placement_start: '2025-10-01',
    courses: [
      {
        course_id: 'crs-001',
        course_title: 'Barber Fundamentals',
        progress: 60,
        status: 'active',
        enrolled_at: '2025-10-10T08:00:00Z',
        completed_at: null,
        credential_id: null,
      },
    ],
    certificate_count: 0,
    overall_progress: 60,
  },
  {
    student_id: 'stu-003',
    student_name: 'Carol Davis',
    student_email: 'carol@example.com',
    shop_name: 'La Plaza Barber Academy',
    placement_status: 'active',
    placement_start: '2025-11-01',
    courses: [],
    certificate_count: 0,
    overall_progress: 0,
  },
];

// --- CSV logic (exact mirror of route.ts) ---

function isoDate(value: string | null | undefined): string {
  if (!value) return '';
  try { return new Date(value).toISOString().slice(0, 10); }
  catch { return ''; }
}

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

function generateCsv(students: PartnerStudentWithTraining[]): string {
  const header = [
    'Student Name', 'Email', 'Location', 'Placement Start', 'Course',
    'Progress %', 'Status', 'Enrollment Date', 'Completion Date',
    'Credential ID', 'Total Certificates',
  ].join(',');

  const rows: string[] = [];
  for (const s of students) {
    if (s.courses.length === 0) {
      rows.push(csvRow([
        s.student_name, s.student_email, s.shop_name,
        s.placement_start || '', 'No enrollments', '0',
        s.placement_status, '', '', '', String(s.certificate_count),
      ]));
    } else {
      for (const c of s.courses) {
        rows.push(csvRow([
          s.student_name, s.student_email, s.shop_name,
          s.placement_start || '', c.course_title, String(c.progress),
          c.status, isoDate(c.enrolled_at), isoDate(c.completed_at),
          c.credential_id || '', String(s.certificate_count),
        ]));
      }
    }
  }
  return [header, ...rows].join('\n');
}

// --- Test runner ---

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`  ✅ ${label}`); passed++; }
  else { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

console.log('Partner CSV Reconciliation Test (Grant-Report Grade)\n');

const csv = generateCsv(SEED);
const lines = csv.split('\n');

// --- 1. Structure ---
console.log('1. Structure:');
assert('Header has 11 columns', lines[0].split(',').length === 11);
assert('Header includes Placement Start', lines[0].includes('Placement Start'));
assert('Header includes Enrollment Date', lines[0].includes('Enrollment Date'));
assert('Header includes Completion Date', lines[0].includes('Completion Date'));
assert('Header includes Credential ID', lines[0].includes('Credential ID'));
assert('4 data rows (2 + 1 + 1)', lines.length === 5, `got ${lines.length}`);

// --- 2. Alice: 2 courses, 1 completed ---
console.log('\n2. Alice (completed + in-progress):');
const a1 = lines[1];
assert('Placement start = 2025-09-01', a1.includes('2025-09-01'));
assert('Course = Barber Fundamentals', a1.includes('Barber Fundamentals'));
assert('Progress = 100', a1.includes(',100,'));
assert('Status = completed', a1.includes(',completed,'));
assert('Enrollment date = 2025-09-15', a1.includes('2025-09-15'));
assert('Completion date = 2025-12-01', a1.includes('2025-12-01'));
assert('Credential ID = ABCD-EFGH-JKLM', a1.includes('ABCD-EFGH-JKLM'));
assert('Certificate count = 1', a1.endsWith(',1'));

const a2 = lines[2];
assert('Course = Advanced Styling', a2.includes('Advanced Styling'));
assert('Progress = 45', a2.includes(',45,'));
assert('Enrollment date = 2025-12-05', a2.includes('2025-12-05'));
assert('No completion date', a2.includes(',2025-12-05,,'));
assert('No credential ID for incomplete', a2.includes(',,1'));

// --- 3. Bob: 1 course, in progress ---
console.log('\n3. Bob (in-progress):');
const b1 = lines[3];
assert('Placement start = 2025-10-01', b1.includes('2025-10-01'));
assert('Progress = 60', b1.includes(',60,'));
assert('Enrollment date = 2025-10-10', b1.includes('2025-10-10'));
assert('No completion date', b1.includes(',2025-10-10,,'));
assert('Certificate count = 0', b1.endsWith(',0'));

// --- 4. Carol: no enrollments ---
console.log('\n4. Carol (no enrollments):');
const c1 = lines[4];
assert('Shows "No enrollments"', c1.includes('No enrollments'));
assert('Placement start = 2025-11-01', c1.includes('2025-11-01'));
assert('Progress = 0', c1.includes(',0,'));
assert('Certificate count = 0', c1.endsWith(',0'));

// --- 5. Aggregate reconciliation ---
console.log('\n5. Aggregate reconciliation:');
const dataRows = lines.slice(1);
const uniqueStudents = new Set(dataRows.map((r) => r.split(',')[0])).size;
assert('Unique students = 3', uniqueStudents === 3, `got ${uniqueStudents}`);

const completedRows = dataRows.filter((r) => r.includes(',completed,'));
assert('Completed enrollments = 1', completedRows.length === 1, `got ${completedRows.length}`);

const credentialRows = dataRows.filter((r) => r.includes('ABCD-EFGH-JKLM'));
assert('Rows with credential IDs = 1', credentialRows.length === 1, `got ${credentialRows.length}`);

const datePattern = /\d{4}-\d{2}-\d{2}/;
const allDatesIso = dataRows.every((r) => {
  const cols = r.split(',');
  return [cols[3], cols[7], cols[8]].filter(Boolean).every((d) => datePattern.test(d));
});
assert('All dates in ISO format (YYYY-MM-DD)', allDatesIso);

// --- 6. Security ---
console.log('\n6. Security (no internal IDs leaked):');
assert('No student_id in CSV', !csv.includes('stu-001') && !csv.includes('stu-002') && !csv.includes('stu-003'));
assert('No course_id in CSV', !csv.includes('crs-001') && !csv.includes('crs-002'));
assert('No shop_id in CSV', !csv.includes('shop_id'));

// --- Results ---
console.log(`\n${'='.repeat(55)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);

if (failed > 0) {
  console.log('\n⚠️  RECONCILIATION FAILED');
  process.exit(1);
} else {
  console.log('\n✅ RECONCILIATION PASSED — CSV matches seed data with zero drift');
  process.exit(0);
}
