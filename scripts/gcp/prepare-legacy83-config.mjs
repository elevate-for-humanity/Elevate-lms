import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export function prepareLegacy83Config(source) {
  // Refuse a changed source contract rather than replacing customer settings.
  if (!source.includes('export default nextConfig;')) throw new Error('Standalone Next configuration requires review.');
  const result = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  if ((result.diagnostics || []).some(d => d.category === ts.DiagnosticCategory.Error))
    throw new Error('Standalone Next configuration could not compile.');
  return "import { withBuildMemoryDefaults } from './.elevate-build/build-memory-policy.mjs';\n" +
    result.outputText.replace('export default nextConfig;', 'export default withBuildMemoryDefaults(nextConfig);');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (existsSync('next.config.mjs') || existsSync('next.config.js')) throw new Error('Multiple standalone Next configurations require review.');
  writeFileSync('next.config.mjs', prepareLegacy83Config(readFileSync('next.config.ts', 'utf8')));
  unlinkSync('next.config.ts');
}
