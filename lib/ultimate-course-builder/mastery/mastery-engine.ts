export type ObjectiveMasteryState='not_started'|'learning'|'guided_practice'|'independent_practice'|'assessing'|'needs_remediation'|'reassessing'|'mastered';
export interface MasteryRule{objectiveId:string;passingScore:number;practicalEvidenceRequired:boolean;criticalSafety:boolean}
export function objectiveMastered(rule:MasteryRule,score:number,evidenceApproved:boolean){return score>=rule.passingScore&&(!rule.practicalEvidenceRequired||evidenceApproved);}
