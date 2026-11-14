/**
 * ESLint rule: no-toplevel-api-clients
 * Prevents instantiating API clients (OpenAI, Stripe, etc.) at module level
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow top-level API client instantiation',
      category: 'Possible Errors',
      recommended: true,
    },
    messages: {
      toplevelClient:
        'API clients ({{name}}) should not be instantiated at module level. Use lazy initialization inside functions to prevent build-time errors when env vars are missing.',
    },
    schema: [],
  },
  create(context) {
    const dangerousClients = ['OpenAI', 'Stripe', 'Resend', 'Redis'];

    return {
      VariableDeclaration(node) {
        // Only check top-level declarations
        if (node.parent.type !== 'Program') {
          return;
        }

        for (const declarator of node.declarations) {
          if (
            declarator.init &&
            declarator.init.type === 'NewExpression' &&
            declarator.init.callee.type === 'Identifier' &&
            dangerousClients.includes(declarator.init.callee.name)
          ) {
            context.report({
              node: declarator,
              messageId: 'toplevelClient',
              data: {
                name: declarator.init.callee.name,
              },
            });
          }
        }
      },
    };
  },
};
