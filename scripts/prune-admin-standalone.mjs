/**
 * Prune apps/admin/.next/standalone — keeps Remotion for /api/admin/generate-lesson-videos.
 */

import { resolve } from 'path';
import { pruneStandaloneNodeModules } from './prune-standalone-lib.mjs';
import {
  ADMIN_ONLY_STANDALONE_PRUNE_PACKAGES,
  SHARED_STANDALONE_PRUNE_PACKAGES,
} from './prune-standalone-packages.mjs';

const STANDALONE_NODE_MODULES = resolve('apps/admin/.next/standalone/node_modules');

await pruneStandaloneNodeModules(
  STANDALONE_NODE_MODULES,
  [...SHARED_STANDALONE_PRUNE_PACKAGES, ...ADMIN_ONLY_STANDALONE_PRUNE_PACKAGES],
  'prune-admin-standalone',
);
