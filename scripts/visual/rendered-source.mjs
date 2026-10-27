import ts from 'typescript';
/** Keep line numbers while excluding Next metadata, which does not render a
 * picture in the page. Runtime JSX and data arrays remain subject to the gate. */
export function renderedSource(source, file) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const ranges = [];
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'metadata') ranges.push([declaration.getStart(tree), declaration.end]);
    }
  }
  let result = source;
  for (const [start, end] of ranges.reverse()) result = result.slice(0, start) + result.slice(start, end).replace(/[^\n\r]/g, ' ') + result.slice(end);
  return result;
}

/** Schema.org metadata emits JSON-LD, not a second rendered image. Only the
 * known imported implementation is excluded, never arbitrary image components. */
export function withoutImageMetadata(source, file) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = new Set();
  for (const node of tree.statements) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === '@/components/marketing/ImageMetadata' && node.importClause?.name) names.add(node.importClause.name.text);
  }
  const ranges = [];
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && names.has(node.tagName.getText(tree))) ranges.push([node.getStart(tree), node.end]);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  let result = source;
  for (const [start, end] of ranges.reverse()) result = result.slice(0, start) + result.slice(start, end).replace(/[^\n\r]/g, ' ') + result.slice(end);
  return result;
}
