import { describe, expect, it } from 'vitest';
import {
  HVAC_PRACTICAL_COURSE_ID,
  HVAC_PRACTICAL_HOUR_POLICY,
  HVAC_PRACTICAL_MODULES,
  HVAC_PRACTICAL_PROPOSED_HOURS,
  HVAC_PRACTICAL_SOURCE_ALLOCATION,
  HVAC_PRACTICAL_SOURCE_LISTED_HOURS,
  HVAC_PRACTICAL_SOURCE_PRINTED_HOURS,
  HVAC_PRACTICAL_SOURCE_UNALLOCATED_HOURS,
  practicalModulesForTopic,
  type HvacPracticalTopic,
} from '@/lib/lms/hvac-practical-plan';

const davidTopics: HvacPracticalTopic[] = [
  'split_system',
  'gas_furnace',
  'pressure_test',
  'vacuum',
  'digital_manifold',
  'recovery_cylinders',
  'multimeter',
  'clamp_meter',
  'leak_detector',
  'pump_down',
  'brazing',
];

describe('additive HVAC practical syllabus contract', () => {
  it('preserves the photographed allocations and exposes their five-hour discrepancy', () => {
    expect(HVAC_PRACTICAL_SOURCE_ALLOCATION.map((row) => row.hours)).toEqual([
      8, 5, 5, 3, 3, 3, 2, 2, 4, 2, 1, 5,
    ]);
    expect(HVAC_PRACTICAL_SOURCE_LISTED_HOURS).toBe(43);
    expect(HVAC_PRACTICAL_SOURCE_PRINTED_HOURS).toBe(48);
    expect(HVAC_PRACTICAL_SOURCE_UNALLOCATED_HOURS).toBe(5);
    const online = HVAC_PRACTICAL_SOURCE_ALLOCATION.find((row) => row.topic === 'interplay_online');
    expect(online?.hours).toBe(8);
    expect(HVAC_PRACTICAL_SOURCE_LISTED_HOURS - (online?.hours ?? 0)).toBe(35);
  });
  it('targets the existing published EPA 608 course, not a replacement enrollment', () => {
    expect(HVAC_PRACTICAL_COURSE_ID).toBe('d48c61c4-8880-4d9d-9ab5-fab4dd51b201');
  });

  it('allocates exactly 48 proposed hours without counting completion', () => {
    expect(HVAC_PRACTICAL_MODULES).toHaveLength(10);
    expect(HVAC_PRACTICAL_PROPOSED_HOURS).toBe(48);
    expect(HVAC_PRACTICAL_MODULES.every((module) => module.proposedHours > 0)).toBe(true);
  });

  it.each(davidTopics)('covers David syllabus topic %s in the mapping', (topic) => {
    expect(practicalModulesForTopic(topic).length).toBeGreaterThan(0);
  });

  it('defines virtual and instructor-led exercises and competency outcomes for every module', () => {
    for (const module of HVAC_PRACTICAL_MODULES) {
      expect(module.id).toMatch(/^hvac-practical-/);
      expect(module.simulationActivity.length).toBeGreaterThan(20);
      expect(module.instructorActivity.length).toBeGreaterThan(20);
      expect(module.competency.length).toBeGreaterThan(15);
      expect(module.requiresPhysicalVerification).toBe(true);
    }
    expect(new Set(HVAC_PRACTICAL_MODULES.map((module) => module.id)).size).toBe(
      HVAC_PRACTICAL_MODULES.length,
    );
  });

  it('never silently treats a simulation as completed physical work or EPA certification', () => {
    expect(HVAC_PRACTICAL_HOUR_POLICY.virtual_simulation).toBe('simulation_hours_only');
    expect(HVAC_PRACTICAL_HOUR_POLICY.instructor_led).toBe('physical_hours_require_observation');
    expect(HVAC_PRACTICAL_HOUR_POLICY.noAutomaticEquivalency).toBe(true);
    expect(HVAC_PRACTICAL_HOUR_POLICY.noAutomaticCertification).toBe(true);
  });
});
