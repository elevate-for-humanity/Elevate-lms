import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {registeredBeautyLessons} from '../../lib/curriculum/registered-beauty/index.mjs';

export function alignmentPlan(snapshot) {
 const targets=[['esthetician','36b0e860-c6c4-48c2-9439-c5f79975639d','8f3472fe-8fe9-4e16-bc31-d502e3de3c7a',28],
 ['manicurist','a7fbfd18-0bdf-4995-8c61-3a90cc8008cf','377cd34a-b402-40ab-8ff9-2fcfd394b96d',26]];
 return targets.flatMap(([occupation,workbookId,courseId,count])=>{
  const sections=snapshot.sections.filter(s=>s.workbook_id===workbookId).sort((a,b)=>a.section_number-b.section_number);
  assert.equal(sections.length,count,'Workbook structure changed');
  const lessons=registeredBeautyLessons(occupation);
  const practiceCount=count-lessons.length;
  return sections.map((before,index)=>{
   assert.equal(before.section_number,index+1,'Nonsequential workbook');
   const practice=index>=lessons.length;
   const source=lessons[practice?index-lessons.length:index];
   const canonical=snapshot.lessons.filter(l=>l.course_id===courseId&&l.competency_id===source.id);
   assert.equal(canonical.length,1,'Missing or ambiguous canonical lesson');
   assert.equal(canonical[0].title,source.title,'Source title drift');
   const guide=source.content.experience.readingGuide.sections;
   const text=heading=>guide.find(s=>s.heading===heading).body;
   const prompts=practice?[
    'Prepare a trainer-reviewed practice record for '+source.title+'. '+text('Supervised practice'),
    'Work through this situation and explain the safe decision: '+text('Worked example')+' Change one relevant client or equipment condition and explain whether your decision changes.',
    'Before practical work, write a stop-and-refer checklist using this guidance: '+text('Safety and correction')+' Identify what your trainer must observe. Written practice does not award hours, practical signoff or a credential.',
   ]:[
    'Study the matching lesson, then explain the following concept in your own words: '+text('Concept explanation')+' Identify two decisions you must make before service.',
    'Create an ordered procedure checklist from this demonstration: '+text('Procedure demonstration')+' Mark the evidence or observation needed at each safety-critical step.',
    'Complete this practice activity: '+text('Supervised practice')+' Explain your response to this scenario: '+text('Worked example')+' Include the stop condition: '+text('Safety and correction')+' Actual services require qualified supervision; this written response is not practical signoff or time credit.',
   ];
   return {before,course_id:courseId,competency_id:source.id,after:{...before,title:(practice?'Applied practice: ':'')+source.title,
    unit:practice?'Supervised application and safe decisions':'Current registered apprenticeship competencies',pdf_page:0,prompts,lesson_id:canonical[0].id},practiceCount};
  });
 });
}

export function alignmentSql(snapshot) {
 const plan=alignmentPlan(snapshot);
 const literal=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
 return `BEGIN;
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE beauty_workbook_plan ON COMMIT DROP AS SELECT value item FROM jsonb_array_elements(${literal(plan)});
LOCK TABLE public.digital_workbook_responses IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.digital_workbook_responses r JOIN public.digital_workbook_sections s ON s.id=r.section_id
 JOIN beauty_workbook_plan p ON s.id=(p.item->'before'->>'id')::uuid) THEN RAISE EXCEPTION 'SAVED_RESPONSES_REQUIRE_VERSIONED_WORKBOOK'; END IF;
 IF (SELECT count(*) FROM public.digital_workbook_sections WHERE workbook_id IN ('36b0e860-c6c4-48c2-9439-c5f79975639d','a7fbfd18-0bdf-4995-8c61-3a90cc8008cf'))<>54 THEN RAISE EXCEPTION 'WORKBOOK_STRUCTURE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM beauty_workbook_plan p LEFT JOIN public.digital_workbook_sections s ON s.id=(p.item->'before'->>'id')::uuid
 WHERE s.id IS NULL OR (to_jsonb(s)<>p.item->'before' AND to_jsonb(s)<>p.item->'after')) THEN RAISE EXCEPTION 'WORKBOOK_CHANGED_SINCE_AUDIT'; END IF;
 IF EXISTS(SELECT 1 FROM beauty_workbook_plan p LEFT JOIN public.course_lessons l ON l.id=(p.item->'after'->>'lesson_id')::uuid
 WHERE l.id IS NULL OR l.course_id<>(p.item->>'course_id')::uuid OR l.content_json->>'competencyId'<>p.item->>'competency_id'
 OR l.title<>replace(p.item->'after'->>'title','Applied practice: ','')) THEN RAISE EXCEPTION 'CANONICAL_LESSON_CHANGED'; END IF;
END $$;
UPDATE public.digital_workbook_sections s SET title=p.item->'after'->>'title',unit=p.item->'after'->>'unit',pdf_page=0,
 prompts=p.item->'after'->'prompts',lesson_id=(p.item->'after'->>'lesson_id')::uuid FROM beauty_workbook_plan p WHERE s.id=(p.item->'before'->>'id')::uuid;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.digital_workbook_sections s JOIN beauty_workbook_plan p ON s.id=(p.item->'after'->>'id')::uuid WHERE to_jsonb(s)=p.item->'after')<>54 THEN RAISE EXCEPTION 'ALIGNMENT_READBACK_FAILED'; END IF;
END $$;
COMMIT;
SELECT w.title,count(*) sections,count(DISTINCT s.lesson_id) covered_lessons FROM public.digital_workbooks w JOIN public.digital_workbook_sections s ON s.workbook_id=w.id WHERE w.id IN ('36b0e860-c6c4-48c2-9439-c5f79975639d','a7fbfd18-0bdf-4995-8c61-3a90cc8008cf') GROUP BY w.id;`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const snapshot=JSON.parse(readFileSync(new URL('../../data/curriculum/beauty-workbook-before.json',import.meta.url)));
 console.log(alignmentSql(snapshot));
}
