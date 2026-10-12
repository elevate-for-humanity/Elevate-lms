#!/usr/bin/env tsx
// Compatibility entry point: production deployment is owned by Google.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
execFileSync(process.execPath,[fileURLToPath(new URL('../gcp/dispatch-release.mjs',import.meta.url)),...process.argv.slice(2)],{stdio:'inherit'});
