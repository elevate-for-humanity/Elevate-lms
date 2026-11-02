import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
import content from './hvac-workbook-content.json';
import { HVAC_COURSE_ID, HVAC_WORKBOOK_SLUG, HVAC_PRACTICE_LESSONS, evaluateHvacWorkbookResponses } from './hvac-workbook-contract';

export async function checkHvacWorkbookCompletion(db:SupabaseClient,userId:string,courseId:string) {
  if(courseId!==HVAC_COURSE_ID)return {complete:true,total:0,completed:0,missingSectionIds:[] as string[]};
  const {data:book,error:bookError}=await db.from('digital_workbooks').select('id,is_active').eq('slug',HVAC_WORKBOOK_SLUG).maybeSingle();
  if(bookError)throw bookError;
  if(!book?.is_active)return {complete:false,total:17,completed:0,missingSectionIds:content.chapters.map(chapter=>chapter.section_id)};
  const {data:sections,error:sectionError}=await db.from('digital_workbook_sections').select('id,lesson_id').eq('workbook_id',book.id);
  if(sectionError)throw sectionError;
  const correct=content.chapters.every(chapter=>sections?.some(section=>section.id===chapter.section_id&&section.lesson_id===chapter.lesson_id));
  if(!correct||sections?.length!==17)return {complete:false,total:17,completed:0,missingSectionIds:content.chapters.map(chapter=>chapter.section_id)};
  const ids=sections.map(section=>section.id);
  const {data:responses,error:responseError}=await db.from('digital_workbook_responses').select('section_id,answers,reviewed').eq('user_id',userId).in('section_id',ids);
  if(responseError)throw responseError;
  const workbook=evaluateHvacWorkbookResponses(ids,responses||[]);
  const practiceIds=HVAC_PRACTICE_LESSONS.map(test=>test.id);
  const {data:tests,error:testError}=await db.from('course_lessons').select('id,passing_score,quiz_questions').eq('course_id',courseId).eq('is_published',true).eq('is_required',true).eq('lesson_type','quiz').in('id',practiceIds);
  if(testError)throw testError;
  const configured=tests?.length===4&&tests.every(test=>test.passing_score===80&&Array.isArray(test.quiz_questions)&&test.quiz_questions.length===25);
  const {data:scores,error:scoreError}=await db.from('checkpoint_scores').select('lesson_id').eq('user_id',userId).eq('course_id',courseId).eq('passed',true).gte('score',80).in('lesson_id',practiceIds);
  if(scoreError)throw scoreError;
  const passed=new Set((scores||[]).map(score=>score.lesson_id));
  return {...workbook,complete:workbook.complete&&configured&&practiceIds.every(id=>passed.has(id)),practicePassed:practiceIds.filter(id=>passed.has(id)).length};
}
