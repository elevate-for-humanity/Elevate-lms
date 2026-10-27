'use strict';

// Fixed bounds apply to strings and externally supplied ASTs. Iterative
// validation runs before any recursive walker; callers cannot disable it.
const MAX_DEPTH = 100;
const MAX_NODES = 50000;
function depthError() {
  const error = new SyntaxError('Brace nesting exceeds maximum depth of ' + MAX_DEPTH);
  error.code = 'BRACES_MAX_DEPTH';
  return error;
}
function validateDepth(ast) {
  const stack = [[ast, 0]];
  const seen = new Set();
  let count = 0;
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (depth > MAX_DEPTH) throw depthError();
    if (!node || typeof node !== 'object') continue;
    if (seen.has(node)) throw new SyntaxError('Cyclic or repeated brace AST node');
    seen.add(node);
    if (++count > MAX_NODES) throw new SyntaxError('Brace AST exceeds maximum node count');
    if (Array.isArray(node.nodes)) {
      if (node.nodes.length + count > MAX_NODES) throw new SyntaxError('Brace AST exceeds maximum node count');
      for (const child of node.nodes) stack.push([child, depth + 1]);
    }
  }
}
module.exports = { MAX_DEPTH, depthError, validateDepth };
