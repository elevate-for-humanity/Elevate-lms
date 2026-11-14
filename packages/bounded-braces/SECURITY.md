# Bounded braces fork

This is the MIT-licensed source of micromatch/braces 3.0.3, not an upstream release. The original LICENSE is retained. It replaces every transitive `braces` dependency through the pnpm override.

CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm has no upstream fixed release at the time of this change. This fork bounds parser nesting to 100 and validates AST depth iteratively before compile, expand, or stringify. The upstream debug console output is removed. Direct AST input is checked for cycles and excessive node counts. Excessive patterns throw a deliberate SyntaxError with BRACES_MAX_DEPTH, instead of exhausting the call stack. Applications accepting untrusted patterns must still handle invalid-input errors. No audit findings are ignored and the security gate remains unchanged.

Upstream: https://github.com/micromatch/braces/tree/3.0.3
Advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

Verification: `node --test tests/security/bounded-braces.test.cjs`. This includes the reported deep-pattern crash, each public entry point, direct and cyclic AST input, and compatibility with ranges, escaping, nested alternatives, micromatch, fast-glob, and chokidar. The resolved lockfile must contain no unmodified braces registry package. Replace this fork with an official patched release once available and the same tests pass.
