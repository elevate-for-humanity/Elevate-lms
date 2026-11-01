// Emit the audited, transactional data update. No credentials or schema changes.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const plan = JSON.parse(readFileSync(new URL('../../data/curriculum/barber-workbook-alignment.json', import.meta.url)));
assert.equal(plan.sections.length, 50);
assert.equal(new Set(plan.sections.map((s) => s.section_id)).size, 50);
assert.equal(plan.sections.filter((s) => !s.previous_lesson_id).length, 32);
const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
console.log(`BEGIN;
CREATE TEMP TABLE barber_alignment_plan ON COMMIT DROP AS
SELECT value AS item FROM jsonb_array_elements(${literal(JSON.stringify(plan.sections))}::jsonb);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.digital_workbook_sections WHERE workbook_id=${literal(plan.workbook_id)}::uuid)<>50 THEN RAISE EXCEPTION 'Workbook structure changed'; END IF;
 IF EXISTS(SELECT 1 FROM barber_alignment_plan p LEFT JOIN public.digital_workbook_sections s ON s.id=(p.item->>'section_id')::uuid
 WHERE s.id IS NULL OR s.workbook_id<>${literal(plan.workbook_id)}::uuid OR s.section_number<>(p.item->>'section_number')::integer
 OR s.title<>p.item->>'title' OR (s.lesson_id IS DISTINCT FROM (p.item->>'previous_lesson_id')::uuid AND s.lesson_id IS DISTINCT FROM (p.item->>'lesson_id')::uuid))
 THEN RAISE EXCEPTION 'Workbook mapping changed since audit'; END IF;
 IF EXISTS(SELECT 1 FROM barber_alignment_plan p LEFT JOIN public.course_lessons l ON l.id=(p.item->>'lesson_id')::uuid
 WHERE l.id IS NULL OR l.course_id<>${literal(plan.course_id)}::uuid OR l.status<>'published' OR NOT l.is_published)
 THEN RAISE EXCEPTION 'Unpublished or incorrect target lesson'; END IF;
END $$;
CREATE TEMP TABLE barber_core_before ON COMMIT DROP AS SELECT id,md5((to_jsonb(l)-'resources'-'updated_at')::text) fingerprint
FROM public.course_lessons l WHERE course_id=${literal(plan.course_id)}::uuid;
CREATE TEMP TABLE barber_answers_before ON COMMIT DROP AS SELECT md5(coalesce(string_agg(to_jsonb(r)::text,'' ORDER BY r.user_id,r.section_id),'')) fingerprint
FROM public.digital_workbook_responses r JOIN public.digital_workbook_sections s ON s.id=r.section_id WHERE s.workbook_id=${literal(plan.workbook_id)}::uuid;
UPDATE public.course_lessons l SET resources=
 coalesce((SELECT jsonb_agg(value) FROM jsonb_array_elements(coalesce(l.resources,'[]'::jsonb))
 WHERE (value->>'type'='workbook_instruction' AND value->>'workbook_slug'=${literal(plan.workbook_slug)}) IS NOT TRUE), '[]'::jsonb)
 ||(SELECT jsonb_agg(item ORDER BY (item->>'section_number')::integer) FROM barber_alignment_plan WHERE (item->>'lesson_id')::uuid=l.id), updated_at=now()
WHERE l.id IN (SELECT (item->>'lesson_id')::uuid FROM barber_alignment_plan);
UPDATE public.digital_workbook_sections s SET lesson_id=(p.item->>'lesson_id')::uuid,
 prompts=CASE WHEN p.item->>'previous_lesson_id' IS NULL THEN p.item->'prompts' ELSE s.prompts END
FROM barber_alignment_plan p WHERE s.id=(p.item->>'section_id')::uuid;
DO $$ DECLARE changed integer; BEGIN
 SELECT count(*) INTO changed FROM public.course_lessons l JOIN barber_core_before b USING(id)
 WHERE md5((to_jsonb(l)-'resources'-'updated_at')::text)<>b.fingerprint;
 IF changed<>0 THEN RAISE EXCEPTION 'Core lesson behavior changed'; END IF;
 IF (SELECT fingerprint FROM barber_answers_before) IS DISTINCT FROM
 (SELECT md5(coalesce(string_agg(to_jsonb(r)::text,'' ORDER BY r.user_id,r.section_id),'')) FROM public.digital_workbook_responses r
 JOIN public.digital_workbook_sections s ON s.id=r.section_id WHERE s.workbook_id=${literal(plan.workbook_id)}::uuid)
 THEN RAISE EXCEPTION 'Saved answers changed'; END IF;
 IF (SELECT count(*) FROM public.digital_workbook_sections s JOIN public.course_lessons l ON l.id=s.lesson_id
 WHERE s.workbook_id=${literal(plan.workbook_id)}::uuid AND EXISTS(SELECT 1 FROM jsonb_array_elements(l.resources) x
 WHERE x->>'type'='workbook_instruction' AND x->>'section_id'=s.id::text AND x->>'title'=s.title))<>50
 THEN RAISE EXCEPTION 'Instructional alignment incomplete'; END IF;
END $$;
COMMIT;
SELECT 'PASS: 50 sections linked to 50 distinct instructional anchors; core lessons, media, assessments and saved answers preserved' result;`);
