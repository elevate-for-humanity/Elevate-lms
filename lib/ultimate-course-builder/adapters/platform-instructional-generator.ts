import { lessonInstructionalSources } from '../instructional/rti-teaching-policy.mjs';
import {sceneRole} from '../core/repair-policy.mjs';
import type { UltimateInstructionalGenerator } from '../instructional/generation-contract';
import type { UltimateCompetency, UltimateCredentialProfile } from '../core/types';
import { validateLessonBlueprint, type LessonBlueprint } from '../instructional/lesson-blueprint';
import { contractHash, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import { ULTIMATE_TEACHING_SEQUENCE } from '../instructional/teaching-sequence';
import { produceTeachingVisual } from '../instructional/teaching-visual';
import { addFreshTeachingRecaps } from '../instructional/teaching-recaps';
import { repeatedTeachingSegments } from '@/lib/video/instructional-quality-gate';
import { sourceTeaching, narrationChunks } from '../instructional/source-teaching';
import { authorGoogleLesson, generateVertexLessonJson, validateGoogleAuthoringEvidence, GOOGLE_LESSON_AUTHOR_VERSION } from '../instructional/google-lesson-author';

type Evidence = {
  profile: UltimateCredentialProfile & {
    lessonBlueprints?: Record<string, LessonBlueprint>;
    instructionalSources?: Array<{ id: string; text: string }>;
  };
  competency: UltimateCompetency;
  prior?: Record<string, any>;
  repairDirective?: any;
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
/** Clarify repeated source quotations with the shortest unique neighbouring
 * words from the same approved narration. Never rewrite speech or guess time;
 * the independent measured-alignment check still resolves this exact quote. */
function uniqueSourceQuote(quote: string, narration: string): string {
  const tokens = [...narration.matchAll(/[a-z0-9]+/gi)];
  const target = quote.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (!target.length) return quote;
  const words = tokens.map(token => token[0].toLowerCase());
  const positions = (needle: string[]) => words.flatMap((_, index) =>
    needle.every((word, offset) => words[index + offset] === word) ? [index] : []);
  const hits = positions(target);
  if (hits.length < 2) return quote;
  // The first authored occurrence owns this teaching point; make that choice
  // explicit in the producer data instead of accepting ambiguous QA matches.
  for (let context = 1; context <= 12; context++) {
    for (let before = context; before >= 0; before--) {
      const start = Math.max(0, hits[0] - before);
      const end = Math.min(words.length, hits[0] + target.length + context - before);
      if (positions(words.slice(start, end)).length === 1)
        return narration.slice(tokens[start].index!, tokens[end - 1].index! + tokens[end - 1][0].length);
    }
  }
  return quote; // Unresolved ambiguity still fails measured alignment.
}

/** One source-bound blueprint owns all content. No independent shortened storyboard script. */
export class UltimatePlatformInstructionalGenerator implements UltimateInstructionalGenerator {
  private drafts = new Map<string, Promise<LessonBlueprint>>();
  async blueprint(value: unknown): Promise<LessonBlueprint> {
    const e = value as Evidence;
    if (!e?.competency?.id || !e.profile?.authority)
      throw new Error('ULTIMATE_STANDARDS_EVIDENCE_REQUIRED');
    const lessonSources: Array<{id:string;text:string}> = lessonInstructionalSources(e.profile, e.competency);
    const approved = e.profile.lessonBlueprints?.[e.competency.id];
    if (approved && !e.repairDirective) {
      validateLessonBlueprint(approved, e.competency);
      if (e.profile.instructionalAuthoring?.provider === 'google') validateGoogleAuthoringEvidence(approved, lessonSources);
      return approved;
    }
    const existing = e.prior?.learning_objectives?.blueprint;
    if (existing && !e.repairDirective && (e.profile.lessonPresentation !== 'approved-premium-v1' || existing.segments?.every((s:any)=>s.recapText?.trim()))) {
      validateLessonBlueprint(existing, e.competency);
      if (e.profile.instructionalAuthoring?.provider === 'google') validateGoogleAuthoringEvidence(existing, lessonSources);
      return existing;
    }
    const key = contractHash({
      profile: e.profile,
      competency: e.competency,
      repairDirective:e.repairDirective,
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
  /** Canonical reservation only: derive a structural draft from supplied text.
   * Never call a model, mint authoring evidence or treat this as release QA. */
  async sourceDraft(value: unknown): Promise<LessonBlueprint> {
    const evidence = value as Evidence;
    if (!evidence?.competency?.id || !evidence.profile?.authority)
      throw new Error('ULTIMATE_STANDARDS_EVIDENCE_REQUIRED');
    const authored = evidence.profile.lessonBlueprints?.[evidence.competency.id];
    if (authored) {
      validateLessonBlueprint(authored, evidence.competency);
      const draft = { ...authored } as LessonBlueprint & {authoringEvidence?: unknown};
      delete draft.authoringEvidence;
      return draft;
    }
    return this.generate(evidence, true);
  }
  private async generate(e: Evidence, sourceOnly = false): Promise<LessonBlueprint> {
    // Course-wide source arrays contain many different lessons. Never narrate
    // the first lesson's source for every competency in a course.
    const sources: Array<{id:string;text:string}> = lessonInstructionalSources(e.profile, e.competency);
    if (!sources?.length || sources.some((s) => !s.id || !s.text?.trim()))
      throw new Error('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');

    if (!sourceOnly && e.profile.instructionalAuthoring?.provider === 'google') {
      const config = e.profile.instructionalAuthoring;
      if (config.version !== GOOGLE_LESSON_AUTHOR_VERSION) throw new Error('ULTIMATE_AUTHORING_VERSION_REQUIRED');
      const author = (repairDirective: any) => authorGoogleLesson(
        { profile: e.profile, competency: e.competency, sources, repairDirective },
        (system, input) => generateVertexLessonJson(config.model, system, input, config.location));
      let authored = await author(e.repairDirective);
      // Repair the authored source instead of clearing a duplicate-narration
      // finding or regenerating narration from unchanged duplicate segments.
      // Bound correction attempts and preserve the original source references.
      for (let repair = 0; repair < 2 &&
          repeatedTeachingSegments(authored.segments.map((segment: any) => segment.text).join('\n\n')); repair++) {
        authored = await author({
          ...(e.repairDirective ?? {}),
          reason: 'NARRATION_DUPLICATION',
          previousBlueprint: authored,
          duplicateSentenceCount: repeatedTeachingSegments(authored.segments.map((segment: any) => segment.text).join('\n\n')),
          instruction: 'Rewrite duplicated teaching segments with unique, source-grounded instructional content. Keep the required objectives, stages, standards and assessments; do not repeat sentences or invent facts.',
          attempt: repair + 1,
        });
      }
      if (repeatedTeachingSegments(authored.segments.map((segment: any) => segment.text).join('\n\n')))
        throw new Error('NARRATION_DUPLICATION');
      return e.profile.lessonPresentation === 'approved-premium-v1' ? addFreshTeachingRecaps(authored,e.profile,sources) : authored;
    }

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
      prompt: ['knowledge_check', 'reassessment'].includes(type)
        ? teaching.questions[type === 'reassessment' ? 1 : 0]?.question ||
          stageText[type === 'reassessment' ? 'assessment' : type]
        : stageText[type],
      feedback: ['guided_practice', 'independent_practice'].includes(type) && teaching.practiceFeedback
        ? teaching.practiceFeedback
        : teaching.questions[type === 'reassessment' ? 1 : 0]?.explanation ||
          `Compare the response with the authorized lesson content, correct any mismatch, and repeat until the objective is demonstrated.`,
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
      flashcards: teaching.flashcards,
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
    return !sourceOnly && e.profile.lessonPresentation === 'approved-premium-v1' ? addFreshTeachingRecaps(blueprint,e.profile,sources) : blueprint;
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
    const segments = storyboardSegments(b.segments).map((s:any)=>s.recapText ? {...s,teachingText:s.text,text:s.text+'\n\n'+s.recapText,narrationParts:[{text:s.text,isRecap:false},{text:s.recapText,isRecap:true}]} : s);
    return {
      script: segments.map((s) => s.text).join('\n\n'),
      segments,
      activities: b.activities,
      flashcards: b.flashcards ?? [],
      mistakes: b.mistakes,
      assessment: b.assessment,
      blueprintHash: contractHash(b),
    };
  }
  async storyboard(input: unknown) {
    const evidence = input as Evidence;
    const directive = evidence.repairDirective;
    // Speech and picture-cue repairs must retain the approved source.
    // Independent re-authoring here would change the narration instead of
    // correcting its storyboard binding.
    const restoreRecordedSource = directive?.target === 'storyboard' &&
      Array.isArray(directive.requirements) && directive.requirements.length > 0 &&
      directive.requirements.every((finding: any) =>
        finding.code === 'ULTIMATE_VIDEO_RENDER_FAILED' &&
        /^(?:ULTIMATE_VIDEO_RENDER_FAILED:)?(?:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED|PICTURE_CUE_NOT_ALIGNED_TO_SPEECH|PREMIUM_TEACHING_CUE_NOT_ALIGNED)$/.test(finding.message));
    const b = await this.blueprint(restoreRecordedSource
      ? {...evidence, repairDirective: undefined} : input);
    return {
      version: ULTIMATE_LESSON_CONTRACT_VERSION,
      scenes: storyboardSegments(b.segments).map((s) => {
        const dialogue = (s as any).recapText ? s.text+'\n\n'+(s as any).recapText : s.text;
        const visual = s.teachingVisual ?? produceTeachingVisual(s.text, s.stage);
        return {
        id: `scene:${s.id}`,
        scriptSegmentId: s.id,
        dialogue,
        teachingPoint: dialogue,
        recapText: (s as any).recapText,
        title: s.stage.replace(/_/g, ' '),
        stage: s.stage,
        objectiveIds: s.objectiveIds,
        sourceRequirementIds: s.sourceRequirementIds,
        visualRequirement: s.visualRequirement,
        sceneType: sceneRole(s.stage,s.sceneType,s.id,s.text),
        teachingVisual: {...visual, steps: visual.steps.map(step => ({...step,
          narrationQuote: uniqueSourceQuote(step.narrationQuote, dialogue)}))},
        };
      }),
    };
  }
}
