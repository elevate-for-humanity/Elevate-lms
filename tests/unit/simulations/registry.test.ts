import { describe, expect, it } from 'vitest';
import { getSimulation, listSimulations, registerSimulation } from '@/lib/simulations/registry';

describe('simulation registry', () => {
  it('seeds the simulations already live in the LMS', () => {
    const ids = listSimulations().map((module) => module.id);
    expect(ids).toContain('hvac-equipment-simulation');
    expect(ids).toContain('business-retail-scenario-lab');
  });

  it('resolves a registered module by id and returns null for unknown ids', () => {
    expect(getSimulation('hvac-equipment-simulation')?.component).toBe('HVACSimulation');
    expect(getSimulation('does-not-exist')).toBeNull();
    expect(getSimulation(null)).toBeNull();
  });

  it('new modules register generically (the manifold-gauge pattern)', () => {
    registerSimulation({
      id: 'hvac-manifold-gauge-charging',
      title: 'Manifold Gauge & Refrigerant Charging Simulator',
      trade: 'hvac',
      component: 'HvacManifoldGaugeSimulator',
    });
    expect(getSimulation('hvac-manifold-gauge-charging')?.trade).toBe('hvac');
  });

  it('rejects a module without an id or component key', () => {
    expect(() => registerSimulation({ id: '', title: 'X', component: 'Y' })).toThrow();
    expect(() => registerSimulation({ id: 'x', title: 'X', component: '' })).toThrow();
  });
});
