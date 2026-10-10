import type { UltimateInstructionalGenerator } from '../instructional/generation-contract';
import type { UltimateCompetency, UltimateCredentialProfile } from '../core/types';
import { validateLessonBlueprint, type LessonBlueprint } from '../instructional/lesson-blueprint';
import { contractHash, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import { ULTIMATE_TEACHING_SEQUENCE } from '../instructional/teaching-sequence';
import { produceTeachingVisual } from '../instructional/teaching-visual';
import { sourceTeaching, narrationChunks } from '../instructional/source-teaching';

type Evidence = {
  profile: UltimateCredentialProfile & {
    lessonBlueprints?: Record<string, LessonBlueprint>;
    instructionalSources?: Array<{ id: string; text: string }>;
  };
  competency: UltimateCompetency;
  prior?: Record<string, any>;
};
/** Keep long authored stages intact rather than creating more scenes than the contract allows. */
export function storyboardSegments(
  segments: LessonBlueprint['segments'],
): LessonBlueprint['segments'] {
  if (segments.length <= 16) return segments;
  const grouped: LessonBlueprint['segments'] = [];
  for (const segment of segments) {
    const previous = grouped.at(-1);
    if (previous?.stage === segment.stage) {
      // A custom diagram needs explicit author review before consolidation.
      if (previous.teachingVisual || segment.teachingVisual)
        throw new Error('ULTIMATE_AUTHORED_VISUAL_CONSOLIDATION_REQUIRED');
      previous.text += '\n\n' + segment.text;
      previous.objectiveIds = [...new Set([...previous.objectiveIds, ...segment.objectiveIds])];
      previous.sourceRequirementIds = [
        ...new Set([...previous.sourceRequirementIds, ...segment.sourceRequirementIds]),
      ];
      previous.visualRequirement += '\n' + segment.visualRequirement;
    } else
      grouped.push({
        ...segment,
        objectiveIds: [...segment.objectiveIds],
        sourceRequirementIds: [...segment.sourceRequirementIds],
      });
  }
  if (grouped.length < 8 || grouped.length > 16)
    throw new Error('ULTIMATE_STORYBOARD_STAGE_CONSOLIDATION_REQUIRED');
  return grouped;
}
/** One source-bound blueprint owns all content. No independent shortened storyboard script. */
export class UltimatePlatformInstructionalGenerator implements UltimateInstructionalGenerator {
  private drafts = new Map<string, Promise<LessonBlueprint>>();
  async blueprint(value: unknown): Promise<LessonBlueprint> {
    const e = value as Evidence;
    if (!e?.competency?.id || !e.profile?.authority)
      throw new Error('ULTIMATE_STANDARDS_EVIDENCE_REQUIRED');
    const approved = e.profile.lessonBlueprints?.[e.competency.id];
    if (approved) {
      validateLessonBlueprint(approved, e.competency);
      return approved;
    }
    const existing = e.prior?.learning_objectives?.blueprint;
    if (existing) {
      validateLessonBlueprint(existing, e.competency);
      return existing;
    }
    const key = contractHash({
      profile: e.profile,
      competency: e.competency,
      version: ULTIMATE_LESSON_CONTRACT_VERSION,
    });
    if (!this.drafts.has(key)) this.drafts.set(key, this.generate(e));
    try {
      return await this.drafts.get(key)!;
    } catch (error) {
      this.drafts.delete(key);
      throw error;
    }
  }
  private async generate(e: Evidence): Promise<LessonBlueprint> {
    // Course-wide source arrays contain many different lessons. Never narrate
    // the first lesson's source for every competency in a course.
    const sources = e.profile.instructionalSources?.filter(
      (s) =>
        [e.competency.id, `course-lesson:${e.competency.id}`, `course:${e.competency.id}`].includes(
          s.id,
        ) || e.competency.authorityRequirementIds.includes(s.id),
    );
    if (!sources?.length || sources.some((s) => !s.id || !s.text?.trim()))
      throw new Error('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');

    // Active Course Builder is deterministic and source-bound. The archived
    // Elevate GPU/LLM runtime is intentionally not part of this production path.
    const requirementIds = e.competency.authorityRequirementIds.length
      ? e.competency.authorityRequirementIds
      : [`course:${e.competency.id}`];
    const objectiveId = `${e.competency.id}:objective:1`;
    const competencyText = e.competency.description?.trim() || e.competency.title;
    const teaching = sourceTeaching(sources, e.competency.title);
    const stageText = teaching.stageText;
    const stages = ULTIMATE_TEACHING_SEQUENCE.map((stage) => ({
      stage,
      instruction:
        stageText[stage] || `Teach ${e.competency.title} using the authorized curriculum.`,
      objectiveIds: [objectiveId],
    }));
    const segments = stages.flatMap((stage, index) =>
      narrationChunks(stage.instruction).map((text, part) => ({
        id: `${e.competency.id}:segment:${index + 1}:${part + 1}`,
        text,
        objectiveIds: [objectiveId],
        sourceRequirementIds: requirementIds,
        stage: stage.stage,
        visualRequirement: `Show a relevant, non-looping instructional visual for ${e.competency.title} during ${stage.stage.replace(/_/g, ' ')}.`,
        sceneType:
          stage.stage === 'concept_explanation'
            ? 'mental_model'
            : stage.stage === 'instructor_example'
              ? 'worked_example'
              : stage.stage === 'knowledge_check'
                ? 'knowledge_check'
                : stage.stage === 'recap'
                  ? 'memory_recap'
                  : 'system_diagram',
      })),
    );
    const activities = [
      'guided_practice',
      'independent_practice',
      'knowledge_check',
      'remediation',
      'reassessment',
    ].map((type) => ({
      id: `${e.competency.id}:activity:${type}`,
      type,
      prompt: `Complete ${type.replace(/_/g, ' ')} for ${e.competency.title} using the lesson procedure and evidence.`,
      feedback: `Compare the response with the authorized lesson content, correct any mismatch, and repeat until the objective is demonstrated.`,
      objectiveIds: [objectiveId],
    }));
    const question = (suffix: string, alternate = false) => {
      const sourced = teaching.questions[alternate ? 1 : 0];
      if (sourced)
        return {
          id: `${e.competency.id}:question:${suffix}`,
          prompt: sourced.question,
          choices: sourced.options,
          answerIndex: sourced.correct,
          explanation: sourced.explanation,
          remediation:
            'Review the explanation and practice applying it before attempting a different question.',
          objectiveIds: [objectiveId],
        };
      return {
        id: `${e.competency.id}:question:${suffix}`,
        prompt: alternate
          ? `Which response best demonstrates correct transfer of ${e.competency.title} to a new workplace situation?`
          : `Which response best demonstrates the lesson objective for ${e.competency.title}?`,
        choices: [
          competencyText,
          `Skip the required process and rely only on memory.`,
          `Ignore the authorized lesson guidance and choose an unrelated procedure.`,
        ],
        answerIndex: 0,
        explanation: `The correct response follows the authorized curriculum for ${e.competency.title}: ${competencyText}`,
        remediation: `Review the instructor example and demonstration for ${e.competency.title}, then try again.`,
        objectiveIds: [objectiveId],
      };
    };
    const blueprint: LessonBlueprint = {
      competencyId: e.competency.id,
      objectives: [{ id: objectiveId, text: competencyText, sourceRequirementIds: requirementIds }],
      prerequisites: {
        checks: [],
        noneReason: 'No separate prerequisite is required beyond the course sequence.',
        reviewRequired: false,
      },
      stages,
      segments,
      activities,
      mistakes: [
        {
          mistake: `Applying ${e.competency.title} without following the authorized lesson process.`,
          correction: `Return to the demonstrated sequence and apply each required element in order.`,
          reason: `The authorized curriculum defines the evidence and process used to demonstrate this competency.`,
          objectiveIds: [objectiveId],
        },
      ],
      assessment: {
        questions: [question('primary')],
        reassessment: [question('reassessment', true)],
        passingScore: 80,
        ...(e.competency.requiresPracticalEvidence
          ? {
              practicalRubric: {
                criteria: [
                  'follows authorized process',
                  'demonstrates competency',
                  'corrects errors',
                ],
                passingStandard: 'All critical criteria demonstrated',
              },
            }
          : {}),
      },
    };
    validateLessonBlueprint(blueprint, e.competency);
    return blueprint;
  }
  async objectives(input: unknown) {
    return (await this.blueprint(input)).objectives;
  }
  async prerequisites(input: unknown) {
    return (await this.blueprint(input)).prerequisites;
  }
  async teachingSequence(input: unknown) {
    return { stages: (await this.blueprint(input)).stages };
  }
  async instructorScript(input: unknown) {
    const b = await this.blueprint(input);
    const segments = storyboardSegments(b.segments);
    return {
      script: segments.map((s) => s.text).join('\n\n'),
      segments,
      activities: b.activities,
      mistakes: b.mistakes,
      assessment: b.assessment,
      blueprintHash: contractHash(b),
    };
  }
  async storyboard(input: unknown) {
    const b = await this.blueprint(input);
    return {
      version: ULTIMATE_LESSON_CONTRACT_VERSION,
      scenes: storyboardSegments(b.segments).map((s) => ({
        id: `scene:${s.id}`,
        scriptSegmentId: s.id,
        dialogue: s.text,
        teachingPoint: s.text,
        title: s.stage.replace(/_/g, ' '),
        stage: s.stage,
        objectiveIds: s.objectiveIds,
        sourceRequirementIds: s.sourceRequirementIds,
        visualRequirement: s.visualRequirement,
        sceneType: s.sceneType,
        teachingVisual: s.teachingVisual ?? produceTeachingVisual(s.text, s.stage),
      })),
    };
  }
}
