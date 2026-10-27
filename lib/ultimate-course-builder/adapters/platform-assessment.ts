import type { UltimateAssessmentPort } from '../core/ports';
export class UltimatePlatformAssessment implements UltimateAssessmentPort {
  async generate(input: any) {
    const assessment = input.script?.script?.assessment;
    if (!assessment?.questions?.length || !assessment.reassessment?.length)
      throw new Error('ULTIMATE_AUTHORED_ASSESSMENT_REQUIRED');
    const ids = new Set((input.objectives?.objectives ?? []).map((o: any) => o.id));
    for (const q of assessment.questions)
      if (!q.objectiveIds?.length || q.objectiveIds.some((id: string) => !ids.has(id)))
        throw new Error('ULTIMATE_ASSESSMENT_OBJECTIVE_MAPPING_INVALID');
    return assessment;
  }
}
