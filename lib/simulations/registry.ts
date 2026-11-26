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

// Manifold gauge + refrigerant charging lab for the EPA 608 course
// (components/lms/ManifoldGaugeSimulator.tsx, scenario + server-side scorer
// in lib/lms/manifold-gauge-simulation.ts). Attempts are scored through the
// learner interactions API and recorded in interaction_progress; venting
// refrigerant hard-fails the attempt under Clean Air Act §608.
registerSimulation({
  id: 'hvac-manifold-gauge-charging',
  title: 'Manifold Gauge & Refrigerant Charging Simulator',
  trade: 'hvac',
  component: 'HvacManifoldGaugeSimulator',
  description:
    'Hands-on manifold gauge lab: connect the gauges, calculate superheat and subcooling from the PT chart, and charge an undercharged R-410A TXV system to its subcooling target — recover, never vent.',
});

// Forklift pre-operation inspection + safe load handling lab for the
// Forklift and Manufacturing Operations course
// (components/lms/ForkliftSimulator.tsx, scenario + server-side scorer in
// lib/lms/forklift-simulation.ts). Attempts are scored through the learner
// interactions API and recorded in interaction_progress; operating a truck
// with known safety defects, lifting past rated capacity, or travelling
// with the load raised hard-fails the attempt under OSHA 29 CFR 1910.178.
registerSimulation({
  id: 'forklift-inspection-load-lab',
  title: 'Forklift Inspection & Safe Load Handling Simulator',
  trade: 'forklift',
  component: 'ForkliftSimulator',
  description:
    'Hands-on forklift lab: work a ten-item pre-operation inspection with planted defects, make the tag-out decision, calculate derated capacity from the data plate, judge three loads, and finish with safe travel and shutdown — per OSHA 1910.178.',
});
