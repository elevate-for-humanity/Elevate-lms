import ts from 'typescript';

const LOADER_MODULE = '@/lib/program-holder/workspace';
const GUARD_MODULE = '@/lib/auth/require-program-holder';

function parse(source) {
  const file = ts.createSourceFile('portal.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return file.parseDiagnostics.length ? null : file;
}

function hasModifier(node, kind) {
  return node.modifiers?.some(modifier => modifier.kind === kind);
}

// Module initialization happens before a page can authorize its request. Only
// declarations are expected in these two files; executing a read here must not
// become invisible merely because the function body starts with a guard.
function hasModuleExecution(file) {
  function executes(node) {
    if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return false;
    if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
      return ts.isComputedPropertyName(node.name) && executes(node.name.expression);
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node) || ts.isAwaitExpression(node)) return true;
    return ts.forEachChild(node, executes) === true;
  }
  return file.statements.some(statement => {
    if (ts.isImportDeclaration(statement) || ts.isFunctionDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ||
        ts.isExportDeclaration(statement) || ts.isEmptyStatement(statement)) return false;
    if (!ts.isVariableStatement(statement)) return true;
    return statement.declarationList.declarations.some(declaration => declaration.initializer && executes(declaration.initializer));
  });
}

function shadowsImport(fn, name) {
  function binds(binding) {
    if (ts.isIdentifier(binding)) return binding.text === name;
    if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) {
      return binding.elements.some(element => ts.isBindingElement(element) && binds(element.name));
    }
    return false;
  }
  function visit(node) {
    if ((ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
        node.name && binds(node.name)) return true;
    if (node !== fn && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) || ts.isMethodDeclaration(node))) return false;
    return ts.forEachChild(node, visit) === true;
  }
  return visit(fn);
}

function startsWithAwaitedImport(file, fn, moduleName, exportName) {
  if (!fn?.body || fn.parameters.length || !hasModifier(fn, ts.SyntaxKind.AsyncKeyword)) return false;
  const statement = fn.body.statements[0];
  if (!statement || !ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) return false;
  const initializer = statement.declarationList.declarations[0].initializer;
  if (!initializer || !ts.isAwaitExpression(initializer) || !ts.isCallExpression(initializer.expression)) return false;
  const call = initializer.expression;
  // No conditional/parallel calls, catch fallback, optional invocation or
  // caller-supplied context/options can substitute for this authority chain.
  if (!ts.isIdentifier(call.expression) || call.questionDotToken || call.arguments.length ||
      shadowsImport(fn, call.expression.text)) return false;
  return file.statements.some(statement => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== moduleName || statement.importClause?.isTypeOnly) return false;
    const bindings = statement.importClause?.namedBindings;
    return bindings && ts.isNamedImports(bindings) && bindings.elements.some(binding =>
      !binding.isTypeOnly && (binding.propertyName || binding.name).text === exportName &&
      binding.name.text === call.expression.text);
  });
}

/** Prove the actual dashboard -> workspace -> canonical authorization chain. */
export function hasProgramHolderWorkspaceGuard(pageSource, workspaceSource) {
  const page = parse(pageSource), workspace = parse(workspaceSource);
  if (!page || !workspace || hasModuleExecution(page) || hasModuleExecution(workspace)) return false;
  const entry = page.statements.find(statement => ts.isFunctionDeclaration(statement) &&
    hasModifier(statement, ts.SyntaxKind.ExportKeyword) && hasModifier(statement, ts.SyntaxKind.DefaultKeyword));
  const loader = workspace.statements.find(statement => ts.isFunctionDeclaration(statement) &&
    hasModifier(statement, ts.SyntaxKind.ExportKeyword) && statement.name?.text === 'getProgramHolderWorkspace');
  return startsWithAwaitedImport(page, entry, LOADER_MODULE, 'getProgramHolderWorkspace') &&
    startsWithAwaitedImport(workspace, loader, GUARD_MODULE, 'requireProgramHolder');
}
