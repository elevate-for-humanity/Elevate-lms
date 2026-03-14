// Public API for HVAC troubleshooting simulations.
// Content lives in content/hvac-sims/*.json — edit there, not here.
// Schema validation runs at module load via loader.ts.
import { LOADED_SIMS } from './loader';

export type { SimStep, TroubleshootingSim } from './schema';

export const HVAC_TROUBLESHOOTING_SIMS = LOADED_SIMS;

// Dev-time guard: duplicate IDs indicate a copy-paste error in JSON files.
if (process.env.NODE_ENV !== 'production') {
  const ids = HVAC_TROUBLESHOOTING_SIMS.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    throw new Error(`Duplicate HVAC sim IDs detected: ${dupes.join(', ')}`);
  }
}

export function getHvacSim(id: string) {
  return HVAC_TROUBLESHOOTING_SIMS.find((s) => s.id === id);
}
