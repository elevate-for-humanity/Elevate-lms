// Loads sim content from static JSON files via bundler imports.
// Works in server components, client components, and CI validation scripts.
// No fs.readFileSync — JSON is resolved at build time by the bundler.
import { parseSim, type TroubleshootingSim } from './schema';

import raw01 from '../../../content/hvac-sims/sim-01.json';
import raw02 from '../../../content/hvac-sims/sim-02.json';
import raw03 from '../../../content/hvac-sims/sim-03.json';
import raw04 from '../../../content/hvac-sims/sim-04.json';
import raw05 from '../../../content/hvac-sims/sim-05.json';
import raw06 from '../../../content/hvac-sims/sim-06.json';
import raw07 from '../../../content/hvac-sims/sim-07.json';
import raw08 from '../../../content/hvac-sims/sim-08.json';
import raw09 from '../../../content/hvac-sims/sim-09.json';
import raw10 from '../../../content/hvac-sims/sim-10.json';

const RAW_SIMS = [
  raw01, raw02, raw03, raw04, raw05,
  raw06, raw07, raw08, raw09, raw10,
];

// Validate every sim against the Zod schema at module load time.
// A malformed JSON file throws immediately with a descriptive error
// rather than silently producing bad runtime data.
export const LOADED_SIMS: TroubleshootingSim[] = RAW_SIMS.map((raw, i) => {
  const label = `sim-${String(i + 1).padStart(2, '0')}.json`;
  return parseSim(raw, label);
});
