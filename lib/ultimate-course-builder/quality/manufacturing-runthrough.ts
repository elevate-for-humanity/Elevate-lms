import { contractHash } from '../core/lesson-contract';
import { parsePublicManufacturingSimulation, publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';

/** A generic scenario cannot certify the authored task simulation. This proof
 * is signed with the rest of the existing browser evidence and its artifact hash. */
export function assertManufacturingRunthroughEvidence(publicValue: unknown, evidence: any) {
  if (publicValue === undefined) return;
  const simulation = parsePublicManufacturingSimulation(publicValue);
  const workflow = evidence?.manufacturingWorkflow;
  if (!simulation?.gradingKeyId || !workflow ||
      workflow.version !== 'staged-manufacturing-qa-v1' ||
      workflow.simulationId !== simulation.id || workflow.gradingKeyId !== simulation.gradingKeyId ||
      workflow.specHash !== contractHash(publicManufacturingSimulation(simulation)) ||
      workflow.taskCount !== simulation.tasks.length || workflow.deniedBefore !== true ||
      (simulation.tasks.some(task => task.critical) && workflow.deniedCritical !== true) ||
      workflow.submittedThroughUI !== true || workflow.score !== 100 || workflow.criticalMisses !== 0 ||
      workflow.persisted !== true || workflow.completionObserved !== true)
    throw new Error('ULTIMATE_MANUFACTURING_BROWSER_EVIDENCE_REQUIRED');
}

export function authoredManufacturingSimulation(artifacts: any) {
  const authored = artifacts.assessment_alignment?.authoredPreservation?.experience?.manufacturingSimulation;
  return authored === undefined ? artifacts.learning_objectives?.blueprint?.manufacturingSimulation : authored;
}
