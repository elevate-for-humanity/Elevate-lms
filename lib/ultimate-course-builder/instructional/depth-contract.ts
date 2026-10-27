import type {UltimateCompetency} from '../core/types';

export type InstructionalDepthDimension =
  | 'conceptual_explanation' | 'terminology' | 'worked_examples' | 'conditional_decisions'
  | 'tools_and_materials' | 'preparation' | 'procedure_steps' | 'observable_checkpoints'
  | 'demonstration' | 'guided_practice' | 'independent_practice' | 'common_errors'
  | 'corrections' | 'safety_stop_conditions' | 'cleanup_or_closeout' | 'practical_rubric'
  | 'scenario_application' | 'professional_application' | 'assessment' | 'remediation';

export interface InstructionalDepthContract {
  competencyId:string;
  competencyType:UltimateCompetency['type'];
  required:InstructionalDepthDimension[];
  requireProgressiveComplexity:boolean;
  requireVisualEvidence:boolean;
  requirePracticalVerification:boolean;
  criticalSafety:boolean;
  assessmentMix:Array<'recall'|'scenario'|'applied_judgment'|'performance'>;
}

export function instructionalDepthFor(c:UltimateCompetency):InstructionalDepthContract{
  const required=new Set<InstructionalDepthDimension>([
    'conceptual_explanation','terminology','worked_examples','guided_practice',
    'independent_practice','common_errors','corrections','professional_application',
    'assessment','remediation'
  ]);
  if(c.type==='decision'){
    required.add('conditional_decisions'); required.add('scenario_application');
  }
  if(c.type==='procedure'||c.type==='practical_skill'){
    for(const x of ['conditional_decisions','tools_and_materials','preparation','procedure_steps',
      'observable_checkpoints','demonstration','cleanup_or_closeout','scenario_application'] as InstructionalDepthDimension[]) required.add(x);
  }
  if(c.requiresDemonstration) required.add('demonstration');
  if(c.requiresPracticalEvidence||c.type==='practical_skill') required.add('practical_rubric');
  if(c.criticalSafetyCompetency) required.add('safety_stop_conditions');
  const assessmentMix:Array<'recall'|'scenario'|'applied_judgment'|'performance'>=['recall','scenario','applied_judgment'];
  if(c.requiresPracticalEvidence||c.type==='practical_skill') assessmentMix.push('performance');
  return {
    competencyId:c.id,competencyType:c.type,required:[...required],
    requireProgressiveComplexity:c.type==='procedure'||c.type==='practical_skill',
    requireVisualEvidence:c.requiresDemonstration||c.type==='procedure'||c.type==='practical_skill',
    requirePracticalVerification:c.requiresPracticalEvidence||c.type==='practical_skill',
    criticalSafety:Boolean(c.criticalSafetyCompetency),assessmentMix
  };
}

export function evaluateInstructionalDepth(contract:InstructionalDepthContract,artifact:any){
  const serialized=JSON.stringify(artifact??{}).toLowerCase();
  const aliases:Record<InstructionalDepthDimension,string[]>={
    conceptual_explanation:['explanation','concept'],terminology:['terminology','key terms','vocabulary'],
    worked_examples:['worked example','example'],conditional_decisions:['if','decision','condition'],
    tools_and_materials:['tools','materials','equipment'],preparation:['preparation','prepare'],
    procedure_steps:['procedure','steps'],observable_checkpoints:['checkpoint','observe','verify'],
    demonstration:['demonstration','demonstrate'],guided_practice:['guided_practice','guided practice'],
    independent_practice:['independent_practice','independent practice'],common_errors:['mistake','common error'],
    corrections:['correction','correct'],safety_stop_conditions:['stop condition','contraindication','safety'],
    cleanup_or_closeout:['cleanup','closeout','sanitize'],practical_rubric:['rubric','practical evidence','sign-off'],
    scenario_application:['scenario','case'],professional_application:['professional','workplace','client'],
    assessment:['assessment','quiz','question'],remediation:['remediation','reteach','reassessment']
  };
  const missing=contract.required.filter(d=>!aliases[d].some(term=>serialized.includes(term)));
  return {pass:missing.length===0,missing,required:contract.required};
}
