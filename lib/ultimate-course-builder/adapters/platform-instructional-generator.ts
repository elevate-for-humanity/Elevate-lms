import type { UltimateInstructionalGenerator } from '../instructional/generation-contract';
import { buildObjectives } from '../instructional/objective-builder';
import { teachingSequence } from '../instructional/teaching-sequence';
import type { UltimateCompetency, UltimateCredentialProfile } from '../core/types';

type Evidence = { profile: UltimateCredentialProfile; competency: UltimateCompetency; prior?: Record<string, unknown> };
function evidence(value: unknown): Evidence {
  const input = value as Evidence;
  if (!input?.competency?.id || !input?.profile?.authority) throw new Error('ULTIMATE_STANDARDS_EVIDENCE_REQUIRED');
  return input;
}

/** Structural stages can be derived from the verified contract; substantive teaching requires authored evidence. */
export class UltimatePlatformInstructionalGenerator implements UltimateInstructionalGenerator {
  async objectives(input: unknown) {
    return buildObjectives(evidence(input).competency);
  }
  async prerequisites(input: unknown) {
    const { competency } = evidence(input);
    return { competencyId: competency.id, candidates: [], reviewRequired: true,
      reason: 'Appendix A does not specify prerequisite knowledge for this individual competency' };
  }
  async teachingSequence(input: unknown) {
    const { competency } = evidence(input);
    return { competencyId: competency.id, stages: teachingSequence(), reviewRequired: true };
  }
  async instructorScript(input: unknown): Promise<never> {
    const { competency } = evidence(input);
    throw new Error(`ULTIMATE_AUTHORED_INSTRUCTION_REQUIRED:${competency.id}: Appendix A describes the work, but does not supply a reviewed teaching script`);
  }
  async storyboard(input: unknown): Promise<never> {
    const { competency } = evidence(input);
    throw new Error(`ULTIMATE_AUTHORED_STORYBOARD_REQUIRED:${competency.id}`);
  }
}
