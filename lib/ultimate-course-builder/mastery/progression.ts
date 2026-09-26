import {objectiveMastered,type MasteryRule} from './mastery-engine';
export function decideObjectiveProgress(input:{rule:MasteryRule;score:number;evidenceApproved:boolean}){if(objectiveMastered(input.rule,input.score,input.evidenceApproved))return {state:'mastered' as const,next:'advance' as const};return {state:'needs_remediation' as const,next:'remediate' as const};}
export function lessonCanComplete(states:Array<{required:boolean;state:string}>){return states.filter(x=>x.required).every(x=>x.state==='mastered');}
