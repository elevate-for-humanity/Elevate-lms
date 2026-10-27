import type {UltimateBuildStep} from '../core/types';
export type RepairDisposition='PASS'|'REPAIR'|'REPLACE'|'MISSING';
export interface RepairArtifactDecision{artifactId?:string;artifactVersionId?:string;logicalKey:string;owningStage:UltimateBuildStep;disposition:RepairDisposition;reason:string;locked:boolean;downstreamLogicalKeys:string[]}
export interface CourseRepairPlan{buildId:string;createdAt:string;decisions:RepairArtifactDecision[];preserveCourseIdentity:true;preservePassingArtifacts:true}
export function executableRepairTargets(plan:CourseRepairPlan){return plan.decisions.filter(x=>x.disposition!=='PASS'&&!x.locked).map(x=>({step:x.owningStage,logicalKey:x.logicalKey,disposition:x.disposition}));}
