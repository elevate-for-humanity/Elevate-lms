import type { UltimateInstructionalGenerator } from '../instructional/generation-contract';
import { buildObjectives } from '../instructional/objective-builder';
import { teachingSequence } from '../instructional/teaching-sequence';
import type { UltimateCompetency, UltimateCredentialProfile } from '../core/types';

type Evidence = {
  profile: UltimateCredentialProfile;
  competency: UltimateCompetency;
  prior?: Record<string, unknown>;
};
function evidence(value: unknown): Evidence {
  const input = value as Evidence;
  if (!input?.competency?.id || !input?.profile?.authority)
    throw new Error('ULTIMATE_STANDARDS_EVIDENCE_REQUIRED');
  return input;
}

/** Source-grounded lesson draft. Every claim is limited to the verified competency contract. */
export class UltimatePlatformInstructionalGenerator implements UltimateInstructionalGenerator {
  async objectives(input: unknown) {
    return buildObjectives(evidence(input).competency);
  }
  async prerequisites(input: unknown) {
    const { competency } = evidence(input);
    return {
      competencyId: competency.id,
      candidates: [],
      reviewRequired: true,
      reason: 'Appendix A does not specify prerequisite knowledge for this individual competency',
    };
  }
  async teachingSequence(input: unknown) {
    const { competency } = evidence(input);
    return { competencyId: competency.id, stages: teachingSequence(), reviewRequired: true };
  }
  async instructorScript(input: unknown) {
    const { competency, profile } = evidence(input);
    const task = competency.description.trim();
    const script = [
      `Today we will practice ${competency.title.toLowerCase()}. The registered work process describes this task as follows: ${task}`,
      `Why it matters: this task is one part of the ${profile.title} competency record. Your mentor will show how it fits the client's requested service and the shop's approved procedures.`,
      `Before starting, ask the client what result they want. Identify the tools, work area, and any applicable sanitation or safety requirements with your supervising mentor. Do not proceed when a required safety step or client preference is unclear.`,
      `Watch your mentor demonstrate the task. Name each action and explain how that action follows the work-process description. Then describe the checkpoints you would use to compare the work with the client's request.`,
      `Practice the task with the mentor observing. Pause for correction at each checkpoint. Repeat the work using the feedback rather than simply repeating the same attempt.`,
      `Common correction: if the result does not match the agreed service, stop and consult the mentor before changing it. Record what was practiced and which observable steps the mentor verified.`,
      `To finish, explain what you did, why it met the work-process requirement, what feedback you received, and what you would improve on the next attempt. The mentor must verify practical evidence before competency sign-off.`,
    ].join('\n\n');
    return {
      script,
      sourceRequirementIds: competency.authorityRequirementIds,
      competencyId: competency.id,
    };
  }
  async storyboard(input: unknown) {
    const { competency } = evidence(input);
    const points = [
      ['Work process', competency.description],
      ['Client request', `Confirm the desired result before ${competency.title.toLowerCase()}.`],
      [
        'Safety and setup',
        `Identify the required tools, work area, personal protective equipment, and safety checks for ${competency.title.toLowerCase()}.`,
      ],
      [
        'Mentor demonstration',
        `Observe the mentor perform ${competency.title.toLowerCase()} and identify checkpoints.`,
      ],
      [
        'Guided practice',
        `Practice ${competency.title.toLowerCase()} while the mentor observes and corrects.`,
      ],
      [
        'Common correction',
        `Recognize an incorrect result, stop the task safely, and apply the mentor's correction before continuing.`,
      ],
      [
        'Evidence and recap',
        `Describe the completed task and ask the mentor to verify practical evidence.`,
      ],
    ];
    return {
      version: 1,
      scenes: points.map(([title, teachingPoint], index) => ({
        id: `${competency.id}-scene-${index + 1}`,
        title,
        teachingPoint,
        visualRequirement: `Capture the actual ${competency.title.toLowerCase()} task or its verified work-process evidence`,
        sourceRequirementIds: competency.authorityRequirementIds,
      })),
    };
  }
}
