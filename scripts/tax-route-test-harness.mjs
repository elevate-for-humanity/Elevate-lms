import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Compile real route modules, including Next.js metadata exports. Every import
// is supplied by the test; unsupported dependencies fail rather than loading real clients.
export function compileTaxRoute(file) {
  const result = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  const errors =
    result.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error) ?? [];
  if (errors.length)
    throw new Error(
      errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'),
    );
  return result.outputText;
}

export function loadTaxRoute(source, imports, exportName = 'POST') {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    Headers,
    exports: module.exports,
    require(specifier) {
      if (!Object.hasOwn(imports, specifier))
        throw new Error(`Unmocked route import: ${specifier}`);
      return imports[specifier];
    },
  });
  if (typeof module.exports[exportName] !== 'function') throw new Error(`Module has no ${exportName} handler`);
  return module.exports[exportName];
}
