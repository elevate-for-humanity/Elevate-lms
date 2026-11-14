import { describe, expect, it } from 'vitest';
import { evaluateCriticalCompetencyStatus } from '@/lib/course-completion';

describe('critical competency certificate gate', () => {
  it('blocks completion when any critical competency is not achieved', () => {
    expect(evaluateCriticalCompetencyStatus(
      ['hvac.electrical-safety', 'hvac.refrigerant-recovery'],
      [{ competency_key: 'hvac.electrical-safety', status: 'achieved' }],
    )).toEqual({ satisfied: false, missingKeys: ['hvac.refrigerant-recovery'] });
  });

  it('allows the gate only when every critical competency is achieved', () => {
    expect(evaluateCriticalCompetencyStatus(
      ['hvac.electrical-safety', 'hvac.refrigerant-recovery'],
      [
        { competency_key: 'hvac.electrical-safety', status: 'achieved' },
        { competency_key: 'hvac.refrigerant-recovery', status: 'achieved' },
      ],
    )).toEqual({ satisfied: true, missingKeys: [] });
  });
});
