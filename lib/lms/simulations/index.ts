/**
 * lib/lms/simulations/index.ts
 *
 * Index of the scenario simulations built on the generic engine
 * (lib/lms/scenario-simulation.ts), keyed by simId. The apply script
 * (scripts/apply-scenario-simulation.ts) resolves configs from here; each
 * new scenario sim registers its config in this map and in
 * lib/simulations/registry.ts.
 */
import type { ScenarioSimulationConfig } from '@/lib/lms/scenario-simulation';
import { WELDING_WELD_BOOTH_SIMULATION } from './welding-simulation';
import { COSMETOLOGY_SALON_CLIENT_SIMULATION } from './cosmetology-simulation';
import { BARBERING_CLIENT_LAB_SIMULATION } from './barbering-simulation';
import { HIPAA_PRIVACY_SCENARIO_SIMULATION } from './hipaa-simulation';
import { OSHA_HAZARD_INSPECTION_SIMULATION } from './osha-simulation';
import { BUSINESS_OPERATIONS_SIMULATION } from './business-simulation';
import { BOOKKEEPING_MONTH_END_SIMULATION } from './bookkeeping-simulation';
import { ESTHETICIAN_TREATMENT_ROOM_SIMULATION } from './esthetician-simulation';
import { NAIL_STATION_SIMULATION } from './nail-simulation';
import { FINANCIAL_HOUSEHOLD_SIMULATION } from './financial-simulation';
import { AI_ENGINEERING_WORKFLOW_SIMULATION } from './ai-engineering-simulation';

export const SCENARIO_SIMULATIONS: Record<string, ScenarioSimulationConfig> = {
  [WELDING_WELD_BOOTH_SIMULATION.simId]: WELDING_WELD_BOOTH_SIMULATION,
  [COSMETOLOGY_SALON_CLIENT_SIMULATION.simId]: COSMETOLOGY_SALON_CLIENT_SIMULATION,
  [BARBERING_CLIENT_LAB_SIMULATION.simId]: BARBERING_CLIENT_LAB_SIMULATION,
  [HIPAA_PRIVACY_SCENARIO_SIMULATION.simId]: HIPAA_PRIVACY_SCENARIO_SIMULATION,
  [OSHA_HAZARD_INSPECTION_SIMULATION.simId]: OSHA_HAZARD_INSPECTION_SIMULATION,
  [BUSINESS_OPERATIONS_SIMULATION.simId]: BUSINESS_OPERATIONS_SIMULATION,
  [BOOKKEEPING_MONTH_END_SIMULATION.simId]: BOOKKEEPING_MONTH_END_SIMULATION,
  [ESTHETICIAN_TREATMENT_ROOM_SIMULATION.simId]: ESTHETICIAN_TREATMENT_ROOM_SIMULATION,
  [NAIL_STATION_SIMULATION.simId]: NAIL_STATION_SIMULATION,
  [FINANCIAL_HOUSEHOLD_SIMULATION.simId]: FINANCIAL_HOUSEHOLD_SIMULATION,
  [AI_ENGINEERING_WORKFLOW_SIMULATION.simId]: AI_ENGINEERING_WORKFLOW_SIMULATION,
};

export function getScenarioSimulation(simId: string): ScenarioSimulationConfig | null {
  return SCENARIO_SIMULATIONS[simId] ?? null;
}
