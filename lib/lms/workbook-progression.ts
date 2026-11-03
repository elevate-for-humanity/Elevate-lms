import type {WorkbookAnswers} from './workbook-validation';

/** Workbooks progress by saved study evidence, never by attendance hours. */
export function workbookWritingComplete(
  answers: WorkbookAnswers,
  promptCount: number,
  minimumCharacters=10,
) {
  if(!Number.isInteger(promptCount)||promptCount<0||promptCount>3)return false;
  const keys:(keyof WorkbookAnswers)[]=['notes'];
  for(let index=1;index<=promptCount;index++)keys.push(`practice${index}` as keyof WorkbookAnswers);
  keys.push('nextGoal');
  return keys.every(key=>typeof answers[key]==='string'&&answers[key].trim().length>=minimumCharacters);
}

/** A later workbook section is not selectable until every earlier section has a saved review. */
export function firstWorkbookUnreviewedIndex(
  sectionIds:readonly string[],
  reviewedSectionIds:ReadonlySet<string>,
) {
  const next=sectionIds.findIndex(id=>!reviewedSectionIds.has(id));
  return next<0?sectionIds.length-1:next;
}
