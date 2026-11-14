/**
 * Prune build-time-only and browser-only packages from .next/standalone (LMS).
 */

import { resolve } from 'path';
import { pruneStandaloneNodeModules } from './prune-standalone-lib.mjs';
import {
  LMS_ONLY_STANDALONE_PRUNE_PACKAGES,
  SHARED_STANDALONE_PRUNE_PACKAGES,
} from './prune-standalone-packages.mjs';

const STANDALONE_NODE_MODULES = resolve('.next/standalone/node_modules');

await pruneStandaloneNodeModules(
  STANDALONE_NODE_MODULES,
  [...SHARED_STANDALONE_PRUNE_PACKAGES, ...LMS_ONLY_STANDALONE_PRUNE_PACKAGES],
  'prune-standalone',
);
