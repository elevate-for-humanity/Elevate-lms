import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePattern = /\.(?:[cm]?[jt]sx?|mdx)$/;
const ignoredPattern = /(?:\.d\.ts|\.(?:test|spec)\.[cm]?[jt]sx?)$/;

/**
 * Tailwind must see shared UI imported by Marketing, but not every unrelated
 * dashboard/editor in the monorepo. Resolve the actual transitive imports,
 * including re-exports, dynamic imports and require(), with the same aliases
 * as the Marketing TypeScript build. Absolute files make this independent of
 * the build's working directory. Nothing is generated or cached on disk.
 */
export function marketingTailwindContent({ root = defaultRoot } = {}) {
  const appRoot = path.join(root, 'apps/marketing');
  const configPath = path.join(appRoot, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, appRoot);
  const files = new Set();
  const pending = [];
  function seed(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) seed(filename);
      else if (sourcePattern.test(filename) && !ignoredPattern.test(filename))
        pending.push(filename);
    }
  }
  // App Router discovers these files without imports. Keep collocated content,
  // MDX, metadata routes and local UI in scope as well as all shared imports.
  for (const directory of ['app', 'components', 'lib']) seed(path.join(appRoot, directory));
  const cache = ts.createModuleResolutionCache(appRoot, (filename) => filename, parsed.options);
  while (pending.length) {
    const filename = pending.pop();
    if (files.has(filename)) continue;
    files.add(filename);
    const source = fs.readFileSync(filename, 'utf8');
    const module = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    const imports = new Set();
    function visit(node) {
      if (
        ts.isImportDeclaration(node) &&
        !node.importClause?.isTypeOnly &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        imports.add(node.moduleSpecifier.text);
      } else if (
        ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        imports.add(node.moduleSpecifier.text);
      } else if (
        ts.isCallExpression(node) &&
        node.arguments.length === 1 &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
        (ts.isStringLiteral(node.arguments[0]) ||
          ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
      ) {
        imports.add(node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    }
    visit(module);
    for (const specifier of imports) {
      const resolved = ts.resolveModuleName(
        specifier,
        filename,
        parsed.options,
        ts.sys,
        cache,
      ).resolvedModule;
      if (
        resolved &&
        !resolved.isExternalLibraryImport &&
        sourcePattern.test(resolved.resolvedFileName) &&
        !resolved.resolvedFileName.endsWith('.d.ts')
      ) {
        pending.push(resolved.resolvedFileName);
      } else if (/\.mdx$/.test(specifier)) {
        // TypeScript does not resolve MDX, but Next's MDX loader does.
        const candidate = specifier.startsWith('@/')
          ? path.join(root, specifier.slice(2))
          : path.resolve(path.dirname(filename), specifier);
        if (fs.existsSync(candidate)) pending.push(candidate);
      }
    }
  }
  return [...files].sort();
}
