/**
 * Platform Control Plane — single entry for Dev Studio ops layers.
 *
 * Three implementations (do not merge into one runtime):
 * - Dev runtime: `.devcontainer/devcontainer.json`
 * - AI charter: `lib/devstudio/ai-studio-charter.ts`
 * - Ops UI: DevContainerPanel + `/api/devstudio/devcontainer` + container-env
 *
 * Secret precedence: platform_secrets → app_secrets → process.env
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export {
  AI_STUDIO_DEVINT_CONTAINER,
  getDevIntPromptContext,
  getAiCharterContext,
} from '../ai-studio-charter';

export const SECRET_PRECEDENCE = ['platform_secrets', 'app_secrets', 'process.env'] as const;

export type DevcontainerSpec = Record<string, unknown>;

/** Read live devcontainer.json from repo root */
export function getDevcontainerSpec(): DevcontainerSpec {
  const path = join(process.cwd(), '.devcontainer/devcontainer.json');
  return JSON.parse(readFileSync(path, 'utf8')) as DevcontainerSpec;
}
