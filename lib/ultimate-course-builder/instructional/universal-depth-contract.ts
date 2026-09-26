import type {UltimateCompetency} from '../core/types';
export type InstructionalCharacteristic='conceptual_depth'|'conditional_decision'|'procedural_sequence'|'demonstration'|'guided_practice'|'independent_practice'|'practical_performance'|'critical_safety'|'progressive_complexity'|'professional_application';
export interface UniversalInstructionalDepthProfile{competencyId:string;characteristics:InstructionalCharacteristic[];requiredSections:string[];requiredEvidence:string[];assessmentModes:Array<'recall'|'scenario'|'application'|'sequence'|'performance'>;blockingFailures:string[];}
export function deriveUniversalInstructionalDepth(competency:UltimateCompetency):UniversalInstructionalDepthProfile{
 const characteristics=new Set<InstructionalCharacteristic>(['conceptual_depth','guided_practice','independent_practice','progressive_complexity','professional_application']);
 const sections=new Set(['why_it_matters','terminology','concept_explanation','worked_example','guided_practice','independent_practice','mistakes_and_corrections','application','assessment','remediation','recap']);
 const evidence=new Set(['objective_alignment','instruction_evidence','assessment_evidence']);
 const assessment=new Set<'recall'|'scenario'|'application'|'sequence'|'performance'>(['recall','application']);
 const blockers=new Set(['UNTAUGHT_OBJECTIVE','UNASSESSED_OBJECTIVE']);
 if(competency.type==='decision'){characteristics.add('conditional_decision');['conditions','alternatives','consequences','decision_scenario'].forEach(x=>sections.add(x));assessment.add('scenario');blockers.add('DECISION_WITHOUT_CONSEQUENCE_REASONING');}
 if(competency.type==='procedure'||competency.type==='practical_skill'){characteristics.add('procedural_sequence');['materials_and_preparation','ordered_procedure','observable_checkpoints','cleanup_or_closeout'].forEach(x=>sections.add(x));assessment.add('sequence');blockers.add('PROCEDURE_WITHOUT_ORDERED_STEPS');blockers.add('PROCEDURE_WITHOUT_CHECKPOINTS');}
 if(competency.requiresDemonstration){characteristics.add('demonstration');sections.add('demonstration');evidence.add('demonstration_evidence');blockers.add('DEMONSTRATION_REQUIRED_BUT_MISSING');}
 if(competency.requiresPracticalEvidence){characteristics.add('practical_performance');sections.add('performance_rubric');evidence.add('practical_evidence');assessment.add('performance');blockers.add('PRACTICAL_EVIDENCE_REQUIRED_BUT_MISSING');}
 if(competency.criticalSafetyCompetency){characteristics.add('critical_safety');sections.add('hazards_and_stop_conditions');sections.add('critical_errors');evidence.add('safety_evidence');blockers.add('CRITICAL_SAFETY_EVIDENCE_MISSING');}
 return{competencyId:competency.id,characteristics:[...characteristics],requiredSections:[...sections],requiredEvidence:[...evidence],assessmentModes:[...assessment],blockingFailures:[...blockers]};
}
