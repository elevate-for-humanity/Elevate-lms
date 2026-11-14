import ts from 'typescript';

/** A program's catalog card and detail hero may share its identity photograph.
 * Reuse across separate program entries remains an error. */
export function programImageAssignments(source) {
  const tree = ts.createSourceFile('programImages.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const assignments = [];
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(tree) !== 'PROGRAM_IMAGES' || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;
      for (const program of declaration.initializer.properties) {
        if (!ts.isPropertyAssignment(program) || !ts.isObjectLiteralExpression(program.initializer)) continue;
        const owner = program.name.getText(tree).replace(/^['"]|['"]$/g, '');
        for (const property of program.initializer.properties) {
          if (!ts.isPropertyAssignment(property) || !['card', 'hero'].includes(property.name.getText(tree))) continue;
          const value = property.initializer.getText(tree).slice(1, -1).replace(/\$\{P\}/g, '/images/pages');
          if (value.startsWith('/')) assignments.push({owner, role:property.name.getText(tree), path:value});
        }
      }
    }
  }
  return assignments;
}
export function sharedProgramImages(assignments) {
  const owners = new Map();
  for (const assignment of assignments) {
    const set = owners.get(assignment.path) || new Set();
    set.add(assignment.owner);
    owners.set(assignment.path, set);
  }
  return [...owners].filter(([, set]) => set.size > 1).map(([path, set]) => ({path, owners:[...set]}));
}
