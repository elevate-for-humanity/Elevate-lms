import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { startCanonicalCourse } from '@/lib/ultimate-course-builder/core/start-course';
import type { SyllabusPlan } from '@/lib/ultimate-course-builder/authoring/syllabus-plan';

/** Preserve the entire source; split into bounded teaching sections without inventing curriculum. */
export function holderSyllabusPlan(text: string): SyllabusPlan {
  text = text.trim();
  if (text.length < 100 || text.length > 250000) throw new Error('Syllabus must contain 100–250,000 readable characters.');
  const sections: string[] = [];
  let remaining = text;
  while (remaining.length) {
    let end = Math.min(4000, remaining.length);
    if (end < remaining.length) {
      const boundary = remaining.lastIndexOf('\n', end);
      if (boundary > 2000) end = boundary;
    }
    sections.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  return {
    text,
    modules: sections.map((section, index) => {
      const title = section.trim().split('\n')[0].slice(0, 180) || 'Syllabus section ' + (index + 1);
      return { title, lessons: [{
        title, objectives: ['Explain and demonstrate the learning requirements in this syllabus section.'],
        content: section,
      }] };
    }),
  };
}

export async function extractHolderSyllabus(file: File, suppliedText = '') {
  if (suppliedText.trim()) return holderSyllabusPlan(suppliedText).text;
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = '';
  if (file.type === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  } else if (file.type.startsWith('image/')) {
    const { extractTextFromImage } = await import('@/lib/ocr/tesseract-ocr');
    text = (await extractTextFromImage(buffer)).text;
  }
  if (text.trim().length < 100)
    throw new Error('The syllabus could not be read completely. Paste its text in the syllabus text field and submit again.');
  return holderSyllabusPlan(text).text;
}

export async function startHolderSyllabus(db: SupabaseClient, input: {
  documentId: string; holderId: string; programId: string; actorId: string;
  title: string; text: string; storagePath: string;
}) {
  const syllabusPlan = holderSyllabusPlan(input.text);
  // A document has exactly one secondary course. A retry never creates another course.
  const courseId = input.documentId;
  const metadata = {
    assignment_kind: 'secondary', program_holder_id: input.holderId,
    holder_program_id: input.programId, syllabus_document_id: input.documentId,
    syllabus_path: input.storagePath,
  };
  const created = await db.from('courses').upsert({
    id: courseId, slug: 'holder-syllabus-' + courseId, title: input.title,
    description: 'Secondary Program Holder syllabus assignment.',
    created_by: input.actorId, metadata,
    // No program_id: supplemental teaching cannot become the program's primary curriculum.
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (created.error) throw created.error;
  const saved = await db.from('courses').select('id,metadata,status').eq('id', courseId).single();
  if (saved.error || saved.data?.metadata?.syllabus_document_id !== input.documentId ||
      saved.data?.metadata?.program_holder_id !== input.holderId)
    throw new Error('Syllabus course identity could not be verified.');
  if (saved.data?.status === 'published') return NextResponse.json({ ok: true, courseId, alreadyPublished: true });
  return startCanonicalCourse(db, {
    courseId, programSlug: 'holder-syllabus-' + input.programId, syllabusPlan,
    audience: 'Students assigned to this Program Holder. Secondary instruction supplements their primary Elevate course.',
  }, input.actorId);
}

/** Add only published secondary courses to current holder/program placements. Never revive revoked access. */
export async function syncHolderSecondaryAssignments(db: SupabaseClient, studentId: string) {
  const placements = await db.from('program_enrollments')
    .select('program_holder_id,program_id').or('user_id.eq.' + studentId + ',student_id.eq.' + studentId)
    .is('revoked_at', null).in('status', ['active', 'enrolled', 'in_progress', 'confirmed']);
  if (placements.error) throw placements.error;
  const pairs = new Map((placements.data ?? [])
    .filter(row => row.program_holder_id && row.program_id)
    .map(row => [row.program_holder_id + ':' + row.program_id, row]));
  const prior = await db.from('course_enrollments').select('id,assignments')
    .eq('student_id', studentId).like('assignments', 'holder_syllabus:%').is('revoked_at', null);
  if (prior.error) throw prior.error;
  for (const row of prior.data ?? []) {
    const key = String(row.assignments).slice('holder_syllabus:'.length);
    if (!pairs.has(key)) {
      const revoked = await db.from('course_enrollments')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoke_reason: 'Program Holder placement ended.' })
        .eq('id', row.id).eq('student_id', studentId).is('revoked_at', null);
      if (revoked.error) throw revoked.error;
    }
  }
  for (const pair of pairs.values()) {
    const found = await db.from('courses').select('id')
      .contains('metadata', { assignment_kind: 'secondary', program_holder_id: pair.program_holder_id, holder_program_id: pair.program_id })
      .eq('status', 'published').eq('is_active', true).eq('generation_progress', 100);
    if (found.error) throw found.error;
    if (!found.data?.length) continue;
    const assigned = await db.from('course_enrollments').upsert(
      found.data.map(course => ({ course_id: course.id, student_id: studentId, status: 'active', assignments: 'holder_syllabus:' + pair.program_holder_id + ':' + pair.program_id })),
      { onConflict: 'student_id,course_id', ignoreDuplicates: true });
    if (assigned.error) throw assigned.error;
  }
}
