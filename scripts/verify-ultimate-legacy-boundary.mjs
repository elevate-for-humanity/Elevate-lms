import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.argv[2] || 'lib/ultimate-course-builder';
const forbidden = ['@/lib/course-builder/', '@/lib/course-factory/', '@/lib/course-video/'];
const failures = [];
function inspect(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const check = (node) => {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) specifier = node.arguments[0];
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) specifier = node.argument.literal;
    if (specifier && ts.isStringLiteralLike(specifier)) {
      const target = specifier.text.startsWith('.')
        ? '@/' + path.relative(process.cwd(), path.resolve(path.dirname(file), specifier.text)).replaceAll(path.sep, '/')
        : specifier.text;
      if (forbidden.some(prefix => target.startsWith(prefix) || target === prefix.slice(0, -1))) {
        const line = source.getLineAndCharacterOfPosition(specifier.getStart(source)).line + 1;
        failures.push(`${file}:${line} imports ${specifier.text}`);
      }
    }
    ts.forEachChild(node, check);
  };
  check(source);
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) inspect(file);
  }
}
walk(root);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Ultimate legacy-boundary imports: PASS');
