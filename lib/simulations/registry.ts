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

// Scenario-engine labs (lib/lms/scenario-simulation.ts): inspection,
// decision, and calculation scenarios scored server-side through the
// learner interactions API and recorded in interaction_progress, rendered
// by components/lms/ScenarioSimulator.tsx.
registerSimulation({
  id: 'ai-engineering-workflow-lab',
  title: 'AI Workflow Lab — Brief It, Test It, Verify It, Ship It Safely',
  trade: 'ai-engineering',
  component: 'ScenarioSimulator',
  description:
    'The AI Engineering capstone rehearsal: narrow-AI judgment, structured prompting, test-set iteration math, outside verification, the never-paste list (hard fail), and API key custody.',
});

registerSimulation({
  id: 'business-operations-lab',
  title: 'Small Business Operations Lab — Price It, Break Even, Mind the Cash',
  trade: 'business',
  component: 'ScenarioSimulator',
  description:
    'ESB financials in action: cost classification, a break-even computation, margin versus markup, the true cost of a discount, and cash-flow timing judgments.',
});

registerSimulation({
  id: 'bookkeeping-month-end-lab',
  title: 'Month-End Bookkeeping Lab — Entries, Reconciliation, and the File Check',
  trade: 'bookkeeping',
  component: 'ScenarioSimulator',
  description:
    'Close a month: double-entry direction, a bank reconciliation computed from timing items, book-versus-bank adjustments, trial-balance limits, and a month-end file audit.',
});

registerSimulation({
  id: 'esthetician-treatment-room-lab',
  title: 'Treatment Room Lab — Consult, Turn Over, Treat, Refer, Record',
  trade: 'esthetics',
  component: 'ScenarioSimulator',
  description:
    'One wax appointment: contraindication screening (consent never overrides it), room turnover, mid-service stop judgment, lesion observation and referral without diagnosis, and the confidential record.',
});

registerSimulation({
  id: 'nail-station-lab',
  title: 'Nail Station Lab — Sanitation, Observation, and the Service Decision',
  trade: 'nail-technology',
  component: 'ScenarioSimulator',
  description:
    'Station sanitation and chemical safety, observation before service — enhancing over a painful, lifted, discolored nail hard-fails — living-tissue protection, consented charges, and expiry discipline.',
});

registerSimulation({
  id: 'financial-household-money-lab',
  title: 'Household Money Lab — Budget, Safety Net, and Debt Decisions',
  trade: 'financial-literacy',
  component: 'ScenarioSimulator',
  description:
    'One household month with the course\'s fictional figures: take-home budgeting, net worth, emergency-fund placement, a scam call that hard-fails on code-sharing, and debt payoff order.',
});

registerSimulation({
  id: 'hipaa-privacy-scenario-lab',
  title: 'Privacy Scenario Lab — Disclosures, Access, and Incidents',
  trade: 'healthcare',
  component: 'ScenarioSimulator',
  description:
    'A clinic shift of privacy decisions: verify before disclosing, minimum necessary (and its treatment exception), role-based access, workspace safeguards, and incident reporting — disclosing to an unverified caller or concealing an incident hard-fails.',
});

registerSimulation({
  id: 'osha-hazard-inspection-lab',
  title: 'Hazard Inspection Lab — Walk the Space, Rank the Risk, Choose the Control',
  trade: 'workplace-safety',
  component: 'ScenarioSimulator',
  description:
    'A full walkthrough inspection: hazard recognition (including the safety-versus-privacy distinction), reporting order by risk, hierarchy-of-controls choices, and PPE judgment — running an unguarded machine hard-fails.',
});

registerSimulation({
  id: 'cosmetology-salon-client-lab',
  title: 'Salon Client Lab — Consultation, Color, and Infection Control',
  trade: 'cosmetology',
  component: 'ScenarioSimulator',
  description:
    'A full color-client visit: station reset to infection-control standard, consultation, hair and scalp analysis, the skin-test versus strand-test decision, a label mixing calculation, and documentation — proceeding on an irritated scalp hard-fails.',
});

registerSimulation({
  id: 'barbering-client-lab',
  title: 'Barbershop Client Lab — Consultation, Tools, and the Razor',
  trade: 'barbering',
  component: 'ScenarioSimulator',
  description:
    'One barbershop visit: tool processing (clean, disinfect per label, sharps discipline), the consultation, a scalp finding that pauses the service, razor preparation, price confirmation, and the client record.',
});

registerSimulation({
  id: 'welding-weld-booth-lab',
  title: 'Weld Booth Lab — Set Up, Weld, and Inspect a Coupon',
  trade: 'welding',
  component: 'ScenarioSimulator',
  description:
    'Booth job end to end: PPE and booth check, the hot-work fire call, GMAW machine setup, the diagonal squareness proof, bead reading, and a finished-coupon visual inspection with a crack disposition that hard-fails if accepted or concealed.',
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
