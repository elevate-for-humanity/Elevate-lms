/** Keep owner instructions intact; bound only untrusted page/history evidence. */
export function budgetBrowserPlannerMessages(system, input, contextTokens=8192) {
 const context=Number.isFinite(contextTokens)?Math.max(2048,contextTokens):8192;
 const limit=(context-1200-512-24)*3;
 const page=input.currentPage??{};
 const payload={...input,currentPage:{title:page.title,url:page.url,visibleText:'',controls:[],headings:[]},priorSteps:[],snapshotTruncated:true};
 if(typeof payload.invalidResponse==='string')payload.invalidResponse=payload.invalidResponse.slice(0,2000);
 if(typeof payload.validationError==='string')payload.validationError=payload.validationError.slice(0,500);
 const size=()=>system.length+JSON.stringify(payload).length;
 if(size()>limit)throw Error('BROWSER_TASK_EXCEEDS_MODEL_CONTEXT');
 // Retain exact refs and complete control records, never fabricate a shortened
 // URL or move policy text into the untrusted snapshot.
 const evidenceBudget=Math.max(0,limit-size());
 for(const control of page.controls??[]) {
  payload.currentPage.controls.push(control);
  if(size()>limit-evidenceBudget*0.3){payload.currentPage.controls.pop();break;}
 }
 for(const step of (input.priorSteps??[]).slice(-8).reverse()) {
  payload.priorSteps.unshift(step);
  if(size()>limit-evidenceBudget*0.2){payload.priorSteps.shift();break;}
 }
 const text=String(page.visibleText??'');
 let lo=0,hi=text.length;
 while(lo<hi){const mid=Math.ceil((lo+hi)/2);payload.currentPage.visibleText=text.slice(0,mid);if(size()<=limit)lo=mid;else hi=mid-1;}
 payload.currentPage.visibleText=text.slice(0,lo);
 return [{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}];
}
