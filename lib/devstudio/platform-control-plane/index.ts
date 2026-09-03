/**
 * Platform Control Plane — single entry for Dev Studio ops layers.
 *
 * Canonical AI Studio charter: `lib/devstudio/devint-container.ts`
 * Dev runtime: `.devcontainer/devcontainer.json`
 * Ops UI: DevContainerPanel + `/api/admin/dev-studio/devcontainer` + container-env
 *
 * Secret precedence: platform_secrets → app_secrets → process.env
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export {
  AI_STUDIO_DEVINT_CONTAINER,
  getDevIntPromptContext,
} from '../devint-container';

import { getDevIntPromptContext } from '../devint-container';

/** Backward-compatible name used by Dev Studio execute/chat routes. */
export function getAiCharterContext(): string {
  return getDevIntPromptContext();
}

export const SECRET_PRECEDENCE = ['platform_secrets', 'app_secrets', 'process.env'] as const;

export type DevcontainerSpec = Record<string, unknown>;

/** Read live devcontainer.json from repo root. */
export function getDevcontainerSpec(): DevcontainerSpec {
  const path = join(process.cwd(), '.devcontainer/devcontainer.json');
  return JSON.parse(readFileSync(path, 'utf8')) as DevcontainerSpec;
}
