/**
 * ESLint rule: no-unguarded-search-params
 * Ensures useSearchParams is only used within Suspense boundaries
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow useSearchParams without Suspense boundary',
      category: 'Possible Errors',
      recommended: true,
    },
    messages: {
      missingSuspense:
        'useSearchParams must be used within a Suspense boundary. Wrap the component in <Suspense> or move useSearchParams to a child component wrapped in Suspense.',
    },
    schema: [],
  },
  create(context) {
    let hasUseSearchParams = false;
    let hasSuspenseWrapper = false;
    const filename = context.filename || (context.sourceCode && context.sourceCode.filename) || '';
    let isPageFile = filename.endsWith('page.tsx');

    return {
      // Check for useSearchParams import/usage
      CallExpression(node) {
        if (node.callee.name === 'useSearchParams') {
          hasUseSearchParams = true;
        }
      },
      // Check for Suspense in JSX
      JSXIdentifier(node) {
        if (node.name === 'Suspense') {
          hasSuspenseWrapper = true;
        }
      },
      // Report at end of file
      'Program:exit'(node) {
        if (isPageFile && hasUseSearchParams && !hasSuspenseWrapper) {
          context.report({
            node,
            messageId: 'missingSuspense',
          });
        }
      },
    };
  },
};
