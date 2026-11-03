import {lessons,domains,course} from '../../data/courses/intuit-bookkeeping-professional.mjs';
import {capstone,finalQuestions} from '../../data/courses/intuit-bookkeeping-assessment.mjs';
import {orientation} from '../courses/prepare-bookkeeping-rebuild.mjs';

export const workbookSlug='intuit-bookkeeping-guided-practice';
export function bookkeepingWorkbook() {
 const source=[orientation,...lessons,capstone];
 const sections=source.map((lesson,index)=>({
  section_number:index+1,competency_id:lesson.id,title:lesson.title,
  unit:lesson.id===orientation.id?'Orientation and evidence standards':
   lesson.id===capstone.id?'Integrated month-end practical':domains.find(d=>d.id===lesson.domain).title,
  objective_ids:lesson.objectives,
  prompts:[
   'Study the matching Elevate lesson. '+lesson.practice,
   'Apply this to a second fictional business: '+lesson.example+' Explain each source document, journal entry, ledger balance and statement effect. Then create your own changed-amount version, solve it independently and explain every difference. Keep original and corrected workings visible.',
   'Review and correct this common error: '+lesson.correction+' Submit a traceable workpaper and explain the control that prevents recurrence. Reviewer rubric: calculation accuracy 8 points; evidence trail 4; account classification 4; clear explanation 4. Aim for 18/20 before the external exam. This is an Elevate practice target, not Certiport’s passing score or a certification guarantee.',
  ],
 }));
 sections.push({section_number:18,competency_id:'icbp-cumulative-final',title:'Cumulative readiness and workplace handoff',unit:'All four exam domains and applied bookkeeping',objective_ids:[...new Set(lessons.flatMap(l=>l.objectives))],prompts:[
  `Complete the course's ${finalQuestions.length}-question original cumulative practice assessment without notes. For every missed answer, identify its objective, explain the correct reasoning and redo the matching workbook calculation. Use fresh problems for a second attempt; a memorized answer is not evidence of mastery.`,
  'Submit your complete month-end case: source-document register, transaction journal, general ledger, unadjusted and adjusted trial balances, receivables and payables schedules, bank reconciliation, income statement, equity roll-forward and balance sheet. Trace profit to equity and reconcile cash independently. Ask the instructor to review the submitted file; a quiz cannot replace practical review.',
  'Prepare a client handoff memo explaining cash versus profit, unresolved evidence, internal controls and next-month actions. Recalculate the case after a $200 increase in the credit invoice with collections unchanged. Explain why cash stays unchanged while receivables, profit and equity change. Confirm exam registration with Certiport; course or workbook completion is not the external credential.',
 ]});
 return {slug:workbookSlug,title:'Elevate Bookkeeping — Exam Preparation and Applied Practice Workbook',course_id:'5a72b6d1-6a05-4294-832b-0a836ac4a74d',program_id:'bd503ebf-d8e1-4c79-9efe-a72c001589b4',source_version:course.version,sections};
}
