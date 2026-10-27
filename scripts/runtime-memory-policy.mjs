import {pathToFileURL} from 'node:url';
import {buildMemoryLimitBytes} from './build-memory-policy.mjs';

// Runtime is lighter than a Next.js compilation. Preserve the existing 4 GiB
// ceiling on 8 GiB services while reserving half of smaller containers for
// native allocations, request buffers, image handling and the operating system.
export function runtimeHeapMiB(memoryBytes) {
  const memoryMiB=Math.floor(memoryBytes/2**20);
  if(!Number.isFinite(memoryMiB)||memoryMiB<1024)throw Error('RUNTIME_MEMORY_LIMIT_UNSUPPORTED');
  return Math.min(4096,Math.floor(memoryMiB/2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {console.log(runtimeHeapMiB(buildMemoryLimitBytes()));}
  catch {console.error('RUNTIME_MEMORY_LIMIT_UNSUPPORTED');process.exitCode=1;}
}
