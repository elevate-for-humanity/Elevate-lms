import type { UltimateInstructionalGenerator } from '../instructional/generation-contract';
import type { UltimateCompetency, UltimateCredentialProfile } from '../core/types';
import { validateLessonBlueprint, type LessonBlueprint } from '../instructional/lesson-blueprint';
import { contractHash, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import { ULTIMATE_TEACHING_SEQUENCE } from '../instructional/teaching-sequence';

type Evidence = {
  profile: UltimateCredentialProfile & {
    lessonBlueprints?: Record<string, LessonBlueprint>;
    instructionalSources?: Array<{ id: string; text: string }>;
  };
  competency: UltimateCompetency;
  prior?: Record<string, any>;
};
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
    const sources = e.profile.instructionalSources?.filter(s =>
      [e.competency.id, `course-lesson:${e.competency.id}`, `course:${e.competency.id}`].includes(s.id) ||
      e.competency.authorityRequirementIds.includes(s.id));
    if (!sources?.length || sources.some((s) => !s.id || !s.text?.trim()))
      throw new Error('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');

    // Active Course Builder is deterministic and source-bound. The archived
    // Elevate GPU/LLM runtime is intentionally not part of this production path.
    const requirementIds = e.competency.authorityRequirementIds.length
      ? e.competency.authorityRequirementIds
      : [`course:${e.competency.id}`];
    const objectiveId = `${e.competency.id}:objective:1`;
    const sourceText = sources.map((s) => s.text.trim()).filter(Boolean).join('\n\n');
    const competencyText = e.competency.description?.trim() || e.competency.title;
    const teachingBase = `${e.competency.title}. ${competencyText}`;
    const stageText: Record<string, string> = {
      why_it_matters: `Connect ${e.competency.title} to the learner's job role and explain why the skill matters.`,
      activate_prior_knowledge: `Recall related workplace knowledge before applying ${e.competency.title}.`,
      terminology: `Explain the terms used in the authorized material for ${e.competency.title}.`,
      concept_explanation: `Build a clear mental model of ${e.competency.title}: ${competencyText}`,
      instructor_example: `Walk through an instructor example using the authorized course material for ${e.competency.title}.`,
      demonstration: `Demonstrate the required knowledge or procedure step by step and connect each action to the lesson objective.`,
      guided_practice: `Guide the learner through practice, prompting them to explain decisions and correct errors as they work.`,
      independent_practice: `Have the learner independently apply ${e.competency.title} and document the result.`,
      knowledge_check: `Check understanding of ${e.competency.title} with an applied question and immediate feedback.`,
      mistake_and_correction: `Identify a common mistake, explain why it is incorrect, and model the correct approach.`,
      assessment: `Apply ${e.competency.title} to a different realistic workplace scenario.`,
      remediation: `Explain the error using the authorized material, then attempt a separate reassessment.`,
      recap: `Recap the essential knowledge and the correct sequence for applying ${e.competency.title}.`,
    };
    const stages = ULTIMATE_TEACHING_SEQUENCE.map((stage) => ({
      stage,
      instruction: stageText[stage] || `Teach ${e.competency.title} using the authorized curriculum.`,
      objectiveIds: [objectiveId],
    }));
    const segments = stages.map((stage, index) => ({
      id: `${e.competency.id}:segment:${index + 1}`,
      text: `${stage.instruction} ${teachingBase} Use the approved curriculum evidence for this lesson: ${sourceText.slice(0, 900)}`,
      objectiveIds: [objectiveId],
      sourceRequirementIds: requirementIds,
      stage: stage.stage,
      visualRequirement: `Show a relevant, non-looping instructional visual for ${e.competency.title} during ${stage.stage.replace(/_/g, ' ')}.`,
      sceneType:
        stage.stage === 'mental_model' ? 'mental_model' :
        stage.stage === 'instructor_example' ? 'worked_example' :
        stage.stage === 'knowledge_check' ? 'knowledge_check' :
        stage.stage === 'recap' ? 'memory_recap' : 'system_diagram',
    }));
    const activities = ['guided_practice','independent_practice','knowledge_check','remediation','reassessment'].map((type) => ({
      id: `${e.competency.id}:activity:${type}`,
      type,
      prompt: `Complete ${type.replace(/_/g, ' ')} for ${e.competency.title} using the lesson procedure and evidence.`,
      feedback: `Compare the response with the authorized lesson content, correct any mismatch, and repeat until the objective is demonstrated.`,
      objectiveIds: [objectiveId],
    }));
    const question = (suffix: string, alternate = false) => ({
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
    });
    const blueprint: LessonBlueprint = {
      competencyId: e.competency.id,
      objectives: [{ id: objectiveId, text: competencyText, sourceRequirementIds: requirementIds }],
      prerequisites: { checks: [], noneReason: 'No separate prerequisite is required beyond the course sequence.', reviewRequired: false },
      stages,
      segments,
      activities,
      mistakes: [{
        mistake: `Applying ${e.competency.title} without following the authorized lesson process.`,
        correction: `Return to the demonstrated sequence and apply each required element in order.`,
        reason: `The authorized curriculum defines the evidence and process used to demonstrate this competency.`,
        objectiveIds: [objectiveId],
      }],
      assessment: {
        questions: [question('primary')],
        reassessment: [question('reassessment', true)],
        passingScore: 80,
        ...(e.competency.requiresPracticalEvidence ? {
          practicalRubric: {
            criteria: ['follows authorized process','demonstrates competency','corrects errors'],
            passingStandard: 'All critical criteria demonstrated',
          },
        } : {}),
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
    return {
      script: b.segments.map((s) => s.text).join('\n\n'),
      segments: b.segments,
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
      scenes: b.segments.map((s) => ({
        id: `scene:${s.id}`,
        scriptSegmentId: s.id,
        dialogue: s.text,
        teachingPoint: s.text,
        title: s.stage.replace(/_/g, ' '),
        objectiveIds: s.objectiveIds,
        sourceRequirementIds: s.sourceRequirementIds,
        visualRequirement: s.visualRequirement,
        sceneType: s.sceneType,
        teachingVisual: s.teachingVisual,
      })),
    };
  }
}
