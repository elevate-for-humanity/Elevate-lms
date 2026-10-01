import { ULTIMATE_TEACHING_SEQUENCE } from './teaching-sequence';
import type { UltimateCompetency } from '../core/types';
import { contractHash } from '../core/lesson-contract';
export interface LessonBlueprint {
  competencyId: string;
  objectives: Array<{ id: string; text: string; sourceRequirementIds: string[] }>;
  prerequisites: {
    checks: Array<{ prompt: string; expectedAnswer: string }>;
    noneReason?: string;
    reviewRequired: false;
  };
  stages: Array<{ stage: string; instruction: string; objectiveIds: string[] }>;
  segments: Array<{
    id: string;
    text: string;
    objectiveIds: string[];
    sourceRequirementIds: string[];
    stage: string;
    visualRequirement: string;
    sceneType: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    prompt: string;
    feedback: string;
    objectiveIds: string[];
  }>;
  mistakes: Array<{ mistake: string; correction: string; reason: string; objectiveIds: string[] }>;
  assessment: {
    questions: Array<{
      id: string;
      prompt: string;
      choices: string[];
      answerIndex: number;
      explanation: string;
      remediation: string;
      objectiveIds: string[];
    }>;
    reassessment: unknown[];
    passingScore: number;
    practicalRubric?: unknown;
  };
}
export function validateLessonBlueprint(b: LessonBlueprint, c: UltimateCompetency): void {
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const requiredSources = c.authorityRequirementIds.length
    ? c.authorityRequirementIds
    : [`course:${c.id}`];
  if (b?.competencyId !== c.id || !b.objectives?.length)
    throw new Error('BLUEPRINT_OBJECTIVES_REQUIRED');
  const ids = new Set(b.objectives.map((o) => o.id));
  const mapped = (values: string[]) => values?.length > 0 && values.every((id) => ids.has(id));
  const sourced = (values: string[]) =>
    values?.length > 0 && values.every((id) => requiredSources.includes(id));
  if (
    ids.size !== b.objectives.length ||
    b.objectives.some((o) => !text(o.id) || !text(o.text) || !sourced(o.sourceRequirementIds))
  )
    throw new Error('BLUEPRINT_OBJECTIVE_SOURCE_INVALID');
  if (
    b.prerequisites?.reviewRequired !== false ||
    (!b.prerequisites.checks?.length && !text(b.prerequisites.noneReason))
  )
    throw new Error('BLUEPRINT_PREREQUISITES_REQUIRED');
  if (
    b.stages?.length !== 13 ||
    b.stages.some(
      (s, i) =>
        s.stage !== ULTIMATE_TEACHING_SEQUENCE[i] ||
        !text(s.instruction) ||
        !mapped(s.objectiveIds),
    )
  )
    throw new Error('BLUEPRINT_THIRTEEN_TEACHING_STAGES_REQUIRED');
  if (
    b.segments?.length < 6 ||
    new Set(b.segments.map((s) => s.id)).size !== b.segments.length ||
    b.segments.some(
      (s) =>
        !text(s.text) ||
        !text(s.visualRequirement) ||
        !mapped(s.objectiveIds) ||
        !sourced(s.sourceRequirementIds),
    )
  )
    throw new Error('BLUEPRINT_SCRIPT_SCENES_REQUIRED');
  for (const stage of ULTIMATE_TEACHING_SEQUENCE)
    if (!b.segments.some((s) => s.stage === stage))
      throw new Error(`BLUEPRINT_SPOKEN_TEACHING_STAGE_MISSING:${stage}`);
  if (
    b.segments
      .map((s) => s.text)
      .join(' ')
      .split(/\s+/).length < 180
  )
    throw new Error('BLUEPRINT_SUBSTANTIVE_INSTRUCTION_REQUIRED');
  for (const type of [
    'guided_practice',
    'independent_practice',
    'knowledge_check',
    'remediation',
    'reassessment',
  ])
    if (
      !b.activities?.some(
        (a) => a.type === type && text(a.prompt) && text(a.feedback) && mapped(a.objectiveIds),
      )
    )
      throw new Error(`BLUEPRINT_ACTIVITY_REQUIRED:${type}`);
  if (
    !b.mistakes?.length ||
    b.mistakes.some(
      (m) => !text(m.mistake) || !text(m.correction) || !text(m.reason) || !mapped(m.objectiveIds),
    )
  )
    throw new Error('BLUEPRINT_CORRECTIONS_REQUIRED');
  if (
    !b.assessment?.questions?.length ||
    !b.assessment.reassessment?.length ||
    !(b.assessment.passingScore > 0 && b.assessment.passingScore <= 100)
  )
    throw new Error('BLUEPRINT_ASSESSMENT_REQUIRED');
  for (const q of [
    ...b.assessment.questions,
    ...(b.assessment.reassessment as LessonBlueprint['assessment']['questions']),
  ])
    if (
      !text(q.prompt) ||
      q.choices?.length < 3 ||
      !Number.isInteger(q.answerIndex) ||
      q.answerIndex < 0 ||
      q.answerIndex >= q.choices.length ||
      !text(q.explanation) ||
      !text(q.remediation) ||
      !mapped(q.objectiveIds)
    )
      throw new Error('BLUEPRINT_QUESTION_INVALID');
  if (
    b.assessment.reassessment.some((q: any) =>
      b.assessment.questions.some((first) => first.prompt.trim() === q.prompt.trim()),
    )
  )
    throw new Error('BLUEPRINT_REASSESSMENT_MUST_USE_NEW_QUESTIONS');
  for (const id of ids)
    if (
      !b.segments.some((s) => s.objectiveIds.includes(id)) ||
      !b.assessment.questions.some((q) => q.objectiveIds.includes(id))
    )
      throw new Error(`BLUEPRINT_OBJECTIVE_UNCOVERED:${id}`);
  if (c.requiresPracticalEvidence && !b.assessment.practicalRubric)
    throw new Error('BLUEPRINT_PRACTICAL_RUBRIC_REQUIRED');
}
export function blueprintHash(b: LessonBlueprint) {
  return contractHash(b);
}
