/**
 * lib/simulations/registry.ts
 *
 * Generic catalog of hands-on simulation modules that a Course Builder
 * author can attach to a lesson as a `simulation` activity (see
 * BuilderLesson activities in lib/course-builder/schema.ts). The builder
 * picker and the publish checklist read from here — nothing is hardcoded
 * to a single simulation.
 *
 * Registering a new simulation = adding one registerSimulation() call for
 * it in this file (or in the module that ships it, imported by the builder
 * at load). Example — the HVAC manifold-gauge / refrigerant-charging
 * simulator registers exactly this way when its branch lands:
 *
 *   registerSimulation({
 *     id: 'hvac-manifold-gauge-charging',
 *     title: 'Manifold Gauge & Refrigerant Charging Simulator',
 *     trade: 'hvac',
 *     component: 'HvacManifoldGaugeSimulator',
 *     description: '...',
 *   });
 */
export interface SimulationModule {
  /** Stable id stored on the lesson activity (simulationId). */
  id: string;
  title: string;
  /** Trade/category key, e.g. 'hvac', 'cosmetology', 'business'. */
  trade?: string;
  /** Learner-side component key the course player resolves to render it. */
  component: string;
  description?: string;
}

const modules = new Map<string, SimulationModule>();

export function registerSimulation(module: SimulationModule): SimulationModule {
  if (!module.id?.trim()) throw new Error('Simulation module requires an id');
  if (!module.component?.trim())
    throw new Error(`Simulation module ${module.id} requires a component key`);
  modules.set(module.id, module);
  return module;
}

export function listSimulations(): SimulationModule[] {
  return [...modules.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function getSimulation(id: string | null | undefined): SimulationModule | null {
  if (!id) return null;
  return modules.get(id) ?? null;
}

// ── Modules available in the system today ────────────────────────────────────

// Interactive HVAC equipment simulation already live in the LMS
// (components/lms/HVACSimulation.tsx, scenarios in lib/lms/hvac-simulations.ts,
// surfaced to learners through components/lms/HvacSystemLab.tsx).
registerSimulation({
  id: 'hvac-equipment-simulation',
  title: 'HVAC Equipment Simulation',
  trade: 'hvac',
  component: 'HVACSimulation',
  description:
    'Interactive HVAC equipment simulation: components, refrigerant cycle, and system operation scenarios.',
});

// Business of Retail scenario simulation lab already live in the LMS
// (components/lms/BusinessRetailWorkbookLab.tsx) — case-based decisions with
// numeric self-checks, used by the Business & Entrepreneurship course.
registerSimulation({
  id: 'business-retail-scenario-lab',
  title: 'Business of Retail — Scenario Simulation Lab',
  trade: 'business',
  component: 'BusinessRetailWorkbookLab',
  description:
    'Retail case scenarios (Cases A/B/C): read the facts, make the decision, and check the numbers.',
});
