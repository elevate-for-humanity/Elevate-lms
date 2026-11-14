/**
 * ESLint rule: no-direct-ai-providers
 *
 * Bans direct imports of AI provider SDKs (openai, groq-sdk,
 * @google/generative-ai, @anthropic-ai/sdk) outside of lib/ai/.
 *
 * All AI calls must go through lib/ai/ai-service.ts (aiChat, aiGenerateImage,
 * aiGenerateQuiz, aiGradeAnswer) or lib/ai/orchestrator.ts (runAITask).
 * Provider SDKs are only allowed inside lib/ai/ where the abstraction lives.
 *
 * Exceptions (never touch):
 *   - lib/ai/**          ← provider implementations live here
 *   - lib/groq-client.ts ← legacy shim, kept for streaming routes
 *   - lib/gemini-client.ts
 *   - apps/admin/app/api/devstudio/execute/route.ts  ← intentional multi-provider tool-calling
 *   - apps/admin/app/api/devstudio/chat/route.ts
 */

'use strict';

const BANNED_PROVIDERS = [
  'openai',
  'groq-sdk',
  '@google/generative-ai',
  '@anthropic-ai/sdk',
  'azure-openai',
];

// Files allowed to import provider SDKs directly
const ALLOWED_PATHS = [
  /^lib[\\/]ai[\\/]/,
  /^lib[\\/]groq-client\./,
  /^lib[\\/]gemini-client\./,
  /devstudio[\\/]execute[\\/]route\./,
  /devstudio[\\/]chat[\\/]route\./,
];

function toRepoRelativePath(filename) {
  const norm = filename.replace(/\\/g, '/');
  const afterRepo = norm.replace(/^.*\/Elevate-lms\//, '');
  if (afterRepo !== norm) return afterRepo;
  const afterSrc = norm.replace(/^.*\/src\//, '');
  if (afterSrc !== norm) return afterSrc;
  const libIdx = norm.indexOf('/lib/');
  if (libIdx >= 0) return norm.slice(libIdx + 1);
  if (norm.startsWith('lib/')) return norm;
  return norm;
}

function isAllowed(filename) {
  const rel = toRepoRelativePath(filename);
  return ALLOWED_PATHS.some((pattern) => pattern.test(rel));
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct AI provider SDK imports outside lib/ai/. Use aiChat() from lib/ai/ai-service.ts instead.',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noDirectProvider:
        "Direct import of '{{pkg}}' is not allowed here. " +
        'Use aiChat() / aiGenerateImage() / runAITask() from @/lib/ai/ai-service or @/lib/ai/orchestrator instead. ' +
        'Provider SDKs may only be imported inside lib/ai/.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || (context.sourceCode && context.sourceCode.filename) || '';
    if (isAllowed(filename)) return {};

    return {
      ImportDeclaration(node) {
        const pkg = node.source.value;
        if (BANNED_PROVIDERS.some((banned) => pkg === banned || pkg.startsWith(banned + '/'))) {
          context.report({
            node,
            messageId: 'noDirectProvider',
            data: { pkg },
          });
        }
      },

      // Also catch dynamic imports: await import('openai')
      ImportExpression(node) {
        const src = node.source;
        if (src.type !== 'Literal') return;
        const pkg = src.value;
        if (BANNED_PROVIDERS.some((banned) => pkg === banned || pkg.startsWith(banned + '/'))) {
          context.report({
            node,
            messageId: 'noDirectProvider',
            data: { pkg },
          });
        }
      },
    };
  },
};
