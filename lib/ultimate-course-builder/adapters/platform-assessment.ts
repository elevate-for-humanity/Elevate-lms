import type {UltimateAssessmentPort} from '../core/ports';
import type {UltimateCompetency} from '../core/types';

export class UltimatePlatformAssessment implements UltimateAssessmentPort {
  async generate(input: unknown) {
    const {competency} = input as {competency:UltimateCompetency};
    if(!competency?.id || !competency.description) throw new Error('ULTIMATE_ASSESSMENT_STANDARD_REQUIRED');
    const task=competency.description.trim();
    const questions=[
      {id:`${competency.id}-recognize`,type:'application',objectiveIds:competency.authorityRequirementIds,
        prompt:`Which response demonstrates the ${competency.title} work-process requirement?`,
        choices:[task,'Skip the task and mark it complete','Record the requirement without performing the task','Perform an unrelated task instead'],
        answerIndex:0,explanation:`The stated work-process requirement is: ${task}`},
      {id:`${competency.id}-evidence`,type:'scenario',objectiveIds:competency.authorityRequirementIds,
        prompt:`An apprentice claims completion of ${competency.title.toLowerCase()} without a mentor observing the result. What evidence is still needed?`,
        choices:['An observed performance and mentor verification','Only the apprentice’s claim','Only elapsed training time','A task from a different competency'],
        answerIndex:0,explanation:'The recorded competency must be supported by observed practical evidence and mentor verification.'},
    ];
    return {questions,practicalRubric:{competencyId:competency.id,requirementIds:competency.authorityRequirementIds,
      observableTask:task,checkpoints:['Client/request or task conditions identified','Required task demonstrated','Mentor records corrections and verifies outcome'],
      verifier:'supervising mentor',requiresEvidence:competency.requiresPracticalEvidence}};
  }
}
