export const HVAC_COURSE_ID = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
export const HVAC_WORKBOOK_SLUG = 'hvac-epa608-guided-practice';
export const HVAC_WORKBOOK_SECTIONS = 17;
export const HVAC_PRACTICE_PASS = 80;
export const HVAC_PRACTICE_LESSONS = [
  {id:'e47bab32-5d13-5d53-b525-135c6ecd4d48',title:'Core'},
  {id:'6e9ae471-b744-5d73-ac6e-7664da9b9496',title:'Type I'},
  {id:'9fe4ceb8-f11d-5737-b3a0-a1be0b403abd',title:'Type II'},
  {id:'fbe3299c-027f-596f-938b-c934f39ea212',title:'Type III'},
] as const;
export const HVAC_RESPONSE_FIELDS = ['notes','practice1','practice2','practice3','nextGoal'] as const;

export type HvacWorkbookAnswer = {section_id:string;reviewed:boolean;answers:Record<string,unknown>};
export function evaluateHvacWorkbookResponses(sectionIds:readonly string[], responses:readonly HvacWorkbookAnswer[]) {
  const byId=new Map(responses.map(response=>[response.section_id,response]));
  const missing=sectionIds.filter(id=>{
    const row=byId.get(id);
    return !row||row.reviewed!==true||HVAC_RESPONSE_FIELDS.some(key=>typeof row.answers?.[key]!=='string'||String(row.answers[key]).trim().length<10);
  });
  return {complete:sectionIds.length===HVAC_WORKBOOK_SECTIONS&&new Set(sectionIds).size===HVAC_WORKBOOK_SECTIONS&&missing.length===0,total:sectionIds.length,completed:sectionIds.length-missing.length,missingSectionIds:missing};
}
