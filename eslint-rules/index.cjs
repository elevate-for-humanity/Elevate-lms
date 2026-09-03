/**
 * Custom ESLint rules for Elevate LMS
 * These rules prevent common production-breaking patterns
 */
module.exports = {
  rules: {
    'no-unguarded-search-params': require('./no-unguarded-search-params.cjs'),
    'no-toplevel-api-clients': require('./no-toplevel-api-clients.cjs'),
    'no-direct-ai-providers': require('./no-direct-ai-providers.cjs'),
  },
};
