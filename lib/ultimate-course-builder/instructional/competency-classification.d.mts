export function classifyCompetency(title: string | null | undefined, description?: string): {
  type: 'knowledge' | 'decision' | 'practical_skill';
  requiresDemonstration: boolean;
  requiresPracticalEvidence: boolean;
  criticalSafetyCompetency: boolean;
};
