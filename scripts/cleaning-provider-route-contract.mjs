import ts from 'typescript';

const SERVER = '@/lib/cleaning/server';
const PROOF = '@/lib/cleaning/provider-email-proof';
const VERIFICATION = '@/lib/cleaning/provider-email-verification';
const RATE_LIMIT = '@/lib/cleaning/provider-rate-limit';
const METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const modifier = (node, kind) => node.modifiers?.some(value => value.kind === kind);
const identifier = (node, name) => !!node && ts.isIdentifier(node) && node.text === name;
const literal = (node, value) => !!node && ts.isStringLiteral(node) && node.text === value;
const member = (node, object, property) => !!node && ts.isPropertyAccessExpression(node) &&
  !node.questionDotToken && identifier(node.expression, object) && node.name.text === property;

function parse(source) {
  const file = ts.createSourceFile('contract.ts', source, ts.ScriptTarget.Latest, true);
  return file.parseDiagnostics.length ? null : file;
}

function namedImport(file, name, module, exported) {
  return file.statements.some(statement => {
    if (!ts.isImportDeclaration(statement) || !literal(statement.moduleSpecifier, module) ||
        statement.importClause?.isTypeOnly) return false;
    const bindings = statement.importClause?.namedBindings;
    return bindings && ts.isNamedImports(bindings) && bindings.elements.some(binding =>
      !binding.isTypeOnly && binding.name.text === name &&
      (binding.propertyName || binding.name).text === exported);
  });
}

function binds(node, name) {
  if (ts.isIdentifier(node)) return node.text === name;
  if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node))
    return node.elements.some(element => ts.isBindingElement(element) && binds(element.name, name));
  return false;
}

function shadows(fn, name) {
  function visit(node) {
    if ((ts.isVariableDeclaration(node) || ts.isParameter(node) ||
        ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name && binds(node.name, name)) return true;
    if (node !== fn && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) || ts.isMethodDeclaration(node))) return false;
    return ts.forEachChild(node, visit) === true;
  }
  return visit(fn);
}

function importedCall(file, call, module, exported, scopes = []) {
  return !!call && ts.isCallExpression(call) && !call.questionDotToken && ts.isIdentifier(call.expression) &&
    namedImport(file, call.expression.text, module, exported) &&
    !scopes.some(scope => shadows(scope, call.expression.text));
}

function declaration(statement) {
  if (!statement || !ts.isVariableStatement(statement) ||
      !(statement.declarationList.flags & ts.NodeFlags.Const) ||
      statement.declarationList.declarations.length !== 1) return null;
  return statement.declarationList.declarations[0];
}

function awaited(decl) {
  return decl?.initializer && ts.isAwaitExpression(decl.initializer) &&
    ts.isCallExpression(decl.initializer.expression) ? decl.initializer.expression : null;
}

function objectBindings(node, allowRest = false) {
  if (!node || !ts.isObjectBindingPattern(node)) return null;
  const result = Object.create(null);
  for (const element of node.elements) {
    if (element.initializer || !ts.isIdentifier(element.name)) return null;
    if (element.dotDotDotToken) { if (allowRest) continue; return null; }
    const key = element.propertyName || element.name;
    if (!ts.isIdentifier(key) || Object.hasOwn(result, key.text)) return null;
    result[key.text] = element.name.text;
  }
  return result;
}

function objectValues(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return null;
  const result = Object.create(null);
  for (const property of node.properties) {
    if (ts.isShorthandPropertyAssignment(property) && !property.objectAssignmentInitializer) {
      if (Object.hasOwn(result, property.name.text)) return null;
      result[property.name.text] = property.name;
    } else if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
      if (Object.hasOwn(result, property.name.text)) return null;
      result[property.name.text] = property.initializer;
    } else return null;
  }
  return result;
}

function exportedFunction(file, name) {
  const matches = file.statements.filter(statement => ts.isFunctionDeclaration(statement) &&
    modifier(statement, ts.SyntaxKind.ExportKeyword) && statement.name?.text === name);
  return matches.length === 1 && modifier(matches[0], ts.SyntaxKind.AsyncKeyword) ? matches[0] : null;
}

// The route's existing zod schema declarations are inert validation setup.
// Other module-level calls (including nested calls in schema arguments) cannot
// perform a read/write before the request authorization chain is entered.
function hasModuleExecution(file) {
  const schemaMethods = new Set(['number', 'int', 'min', 'max', 'uuid', 'string',
    'refine', 'regex', 'literal', 'object', 'array', 'boolean', 'strict']);
  function zodChain(node) {
    if (ts.isIdentifier(node)) return namedImport(file, node.text, 'zod', 'z');
    if (ts.isPropertyAccessExpression(node) && !node.questionDotToken)
      return schemaMethods.has(node.name.text) && zodChain(node.expression);
    return ts.isCallExpression(node) && !node.questionDotToken && zodChain(node.expression);
  }
  function executes(node) {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isConstructorDeclaration(node)) return false;
    if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node))
      return ts.isComputedPropertyName(node.name) && executes(node.name.expression);
    if (ts.isAwaitExpression(node) || ts.isNewExpression(node) ||
        (ts.isCallExpression(node) && !zodChain(node))) return true;
    return ts.forEachChild(node, executes) === true;
  }
  return file.statements.some(statement => {
    if (ts.isImportDeclaration(statement) || ts.isFunctionDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ||
        ts.isExportDeclaration(statement) || ts.isEmptyStatement(statement)) return false;
    if (ts.isVariableStatement(statement))
      return statement.declarationList.declarations.some(value => value.initializer && executes(value.initializer));
    if (ts.isClassDeclaration(statement)) return executes(statement);
    return true;
  });
}

function proofHelperIsGuarded(file) {
  const fn = exportedFunction(file, 'verifiedProviderEmail');
  const canonical = exportedFunction(file, 'verifiedProviderSession');
  if (!fn?.body || !canonical || fn.parameters.length !== 4 || fn.body.statements.length !== 4) return false;
  const [user, session, db, website] = fn.parameters;
  if (![user, session, db, website].every(parameter => ts.isIdentifier(parameter.name)) ||
      [user, session, db].some(parameter => parameter.initializer) ||
      !identifier(website.initializer, 'CLEANING_SITE') ||
      ![SERVER, './server'].some(module => namedImport(file, 'CLEANING_SITE', module, 'CLEANING_SITE'))) return false;
  const actor = declaration(fn.body.statements[0]);
  const call = awaited(actor);
  if (!actor || !ts.isIdentifier(actor.name) || !call || !identifier(call.expression, 'verifiedProviderSession') ||
      call.questionDotToken || shadows(fn, 'verifiedProviderSession') || call.arguments.length !== 2 ||
      !identifier(call.arguments[0], user.name.text) || !identifier(call.arguments[1], session.name.text)) return false;
  const receipt = declaration(fn.body.statements[1]);
  const receiptNames = objectBindings(receipt?.name);
  const rpc = awaited(receipt);
  if (!receiptNames || Object.keys(receiptNames).sort().join(',') !== 'data,error' ||
      !rpc || rpc.questionDotToken || !member(rpc.expression, db.name.text, 'rpc') || rpc.arguments.length !== 2 ||
      !literal(rpc.arguments[0], 'cleaning_provider_proof_valid')) return false;
  const args = objectValues(rpc.arguments[1]);
  if (!args || Object.keys(args).sort().join(',') !== 'p_email,p_session_id,p_user_id,p_website_id' ||
      !identifier(args.p_website_id, website.name.text) || !member(args.p_user_id, actor.name.text, 'id') ||
      !member(args.p_email, actor.name.text, 'email') || !member(args.p_session_id, actor.name.text, 'sessionId')) return false;
  const denial = fn.body.statements[2];
  if (!ts.isIfStatement(denial) || denial.elseStatement || !ts.isBinaryExpression(denial.expression) ||
      denial.expression.operatorToken.kind !== ts.SyntaxKind.BarBarToken ||
      !identifier(denial.expression.left, receiptNames.error)) return false;
  const denied = denial.expression.right;
  if (!ts.isBinaryExpression(denied) || denied.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      !identifier(denied.left, receiptNames.data) || denied.right.kind !== ts.SyntaxKind.TrueKeyword) return false;
  const failure = denial.thenStatement;
  if (!ts.isThrowStatement(failure) || !ts.isCallExpression(failure.expression) ||
      !identifier(failure.expression.expression, 'providerVerificationRequired') ||
      failure.expression.questionDotToken || failure.expression.arguments.length ||
      shadows(fn, 'providerVerificationRequired')) return false;
  const final = fn.body.statements[3];
  const result = ts.isReturnStatement(final) && objectValues(final.expression);
  return !!result && Object.keys(result).sort().join(',') === 'email,id' &&
    member(result.id, actor.name.text, 'id') && member(result.email, actor.name.text, 'email');
}

function verificationHelperIsGuarded(file) {
  const fn = exportedFunction(file, 'requestProviderEmailVerification');
  if (!fn?.body || fn.parameters.length !== 1 || fn.parameters[0].initializer) return false;
  const fields = objectBindings(fn.parameters[0].name, true);
  const actor = declaration(fn.body.statements[0]);
  const call = awaited(actor);
  if (!(!!fields?.user && !!fields.session && !!fields.request && actor && ts.isIdentifier(actor.name) &&
    [PROOF, './provider-email-proof'].some(module => importedCall(file, call, module, 'verifiedProviderSession', [fn])) &&
    call.arguments.length === 3 &&
    identifier(call.arguments[0], fields.user) && identifier(call.arguments[1], fields.session) &&
    call.arguments[2].kind === ts.SyntaxKind.FalseKeyword)) return false;
  const limited = declaration(fn.body.statements[1]);
  const budget = awaited(limited);
  if (!limited || !ts.isIdentifier(limited.name) ||
      ![RATE_LIMIT, './provider-rate-limit'].some(module => importedCall(file, budget, module, 'applyProviderEmailSendLimit', [fn])) ||
      budget.arguments.length !== 2 || !identifier(budget.arguments[0], fields.request) ||
      !member(budget.arguments[1], actor.name.text, 'id')) return false;
  const denied = fn.body.statements[2];
  if (!ts.isIfStatement(denied) || denied.elseStatement || !identifier(denied.expression, limited.name.text) ||
      !ts.isThrowStatement(denied.thenStatement) || !ts.isNewExpression(denied.thenStatement.expression)) return false;
  const failure = denied.thenStatement.expression;
  return ts.isIdentifier(failure.expression) &&
    [SERVER, './server'].some(module => namedImport(file, failure.expression.text, module, 'CleaningError')) &&
    !shadows(fn, failure.expression.text) && failure.arguments?.[1] &&
    ts.isNumericLiteral(failure.arguments[1]) && failure.arguments[1].text === '429';
}

function emptyBodyValidation(file, statement, request, scopes) {
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return false;
  const parseCall = statement.expression;
  if (!ts.isPropertyAccessExpression(parseCall.expression) || parseCall.expression.name.text !== 'parse' ||
      parseCall.questionDotToken || parseCall.arguments.length !== 1) return false;
  const strict = parseCall.expression.expression;
  if (!ts.isCallExpression(strict) || strict.questionDotToken || strict.arguments.length ||
      !ts.isPropertyAccessExpression(strict.expression) || strict.expression.name.text !== 'strict') return false;
  const object = strict.expression.expression;
  if (!ts.isCallExpression(object) || object.questionDotToken || object.arguments.length !== 1 ||
      !ts.isObjectLiteralExpression(object.arguments[0]) || object.arguments[0].properties.length ||
      !ts.isPropertyAccessExpression(object.expression) || object.expression.name.text !== 'object' ||
      !ts.isIdentifier(object.expression.expression)) return false;
  const z = object.expression.expression.text;
  if (!namedImport(file, z, 'zod', 'z') || scopes.some(scope => shadows(scope, z))) return false;
  const body = parseCall.arguments[0];
  return ts.isAwaitExpression(body) && ts.isCallExpression(body.expression) && !body.expression.questionDotToken &&
    body.expression.arguments.length === 0 && member(body.expression.expression, request, 'json');
}

function handlerIsGuarded(file, fn, sources) {
  if (!fn.body || fn.parameters.length !== 1 || fn.parameters[0].initializer ||
      !ts.isIdentifier(fn.parameters[0].name) || fn.body.statements.length !== 1 ||
      !modifier(fn, ts.SyntaxKind.AsyncKeyword)) return false;
  const request = fn.parameters[0].name.text;
  const returned = fn.body.statements[0];
  const wrapper = ts.isReturnStatement(returned) && returned.expression;
  if (!importedCall(file, wrapper, SERVER, 'cleaningHandler', [fn]) || wrapper.arguments.length !== 1) return false;
  const callback = wrapper.arguments[0];
  if (!ts.isArrowFunction(callback) || callback.parameters.length ||
      !modifier(callback, ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(callback.body)) return false;
  const scopes = [fn, callback];
  const statements = callback.body.statements;
  const sameOrigin = statements[0] && ts.isExpressionStatement(statements[0]) && statements[0].expression;
  if (!importedCall(file, sameOrigin, SERVER, 'sameOrigin', scopes) ||
      sameOrigin.arguments.length !== 1 || !identifier(sameOrigin.arguments[0], request)) return false;
  let index = 1;
  const origin = statements[index] && ts.isExpressionStatement(statements[index]) && statements[index].expression;
  const startsVerification = importedCall(file, origin, VERIFICATION, 'requireProviderVerificationOrigin', scopes);
  if (startsVerification) {
    if (origin.arguments.length !== 1 || !identifier(origin.arguments[0], request) ||
        !emptyBodyValidation(file, statements[++index], request, scopes)) return false;
    index++;
  }
  const context = declaration(statements[index++]);
  const contextCall = awaited(context);
  const fields = objectBindings(context?.name);
  if (!fields || Object.keys(fields).sort().join(',') !== 'db,session,user' ||
      !importedCall(file, contextCall, SERVER, 'cleaningContext', scopes) || contextCall.arguments.length !== 3 ||
      !identifier(contextCall.arguments[0], request) || contextCall.arguments[1].kind !== ts.SyntaxKind.FalseKeyword ||
      !literal(contextCall.arguments[2], 'provider-onboarding')) return false;
  const guard = awaited(declaration(statements[index]));
  if (startsVerification) {
    const args = guard?.arguments.length === 1 && objectValues(guard.arguments[0]);
    return !!args && Object.keys(args).sort().join(',') === 'db,request,session,user' &&
      ['db', 'user', 'session'].every(key => identifier(args[key], fields[key])) &&
      identifier(args.request, request) &&
      importedCall(file, guard, VERIFICATION, 'requestProviderEmailVerification', scopes) &&
      !!exportedFunction(sources.proof, 'verifiedProviderSession') &&
      verificationHelperIsGuarded(sources.verification);
  }
  return importedCall(file, guard, PROOF, 'verifiedProviderEmail', scopes) && guard.arguments.length === 3 &&
    identifier(guard.arguments[0], fields.user) && identifier(guard.arguments[1], fields.session) &&
    identifier(guard.arguments[2], fields.db) && proofHelperIsGuarded(sources.proof);
}

/** Recognize only the canonical, unconditional provider authorization prefixes. */
export function hasCleaningProviderMutationGuard(source, sourceFiles) {
  if (!source.includes(PROOF) && !source.includes(VERIFICATION)) return false;
  const file = parse(source);
  const proof = parse(sourceFiles.proof || '');
  const verification = parse(sourceFiles.verification || '');
  if (!file || !proof || !verification || [file, proof, verification].some(hasModuleExecution)) return false;
  const handlers = file.statements.filter(statement => ts.isFunctionDeclaration(statement) &&
    modifier(statement, ts.SyntaxKind.ExportKeyword) && METHODS.has(statement.name?.text));
  if (!handlers.length || new Set(handlers.map(fn => fn.name.text)).size !== handlers.length) return false;
  for (const statement of file.statements) {
    if (ts.isVariableStatement(statement) && modifier(statement, ts.SyntaxKind.ExportKeyword) &&
        statement.declarationList.declarations.some(decl => ts.isIdentifier(decl.name) && METHODS.has(decl.name.text))) return false;
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause) &&
        statement.exportClause.elements.some(element => METHODS.has(element.name.text))) return false;
  }
  return handlers.every(fn => handlerIsGuarded(file, fn, { proof, verification }));
}
