# Bounded picomatch 4 fork

MIT-licensed picomatch 4.0.7; original LICENSE retained. This private fork mitigates
GHSA-fc5q-39xc-vjpf, for which no upstream patched release is available.
Source: https://github.com/micromatch/picomatch/tree/4.0.7
Advisory: https://github.com/advisories/GHSA-fc5q-39xc-vjpf

The existing repeated-extglob analyzer skips single-branch glob stars. The added
linear scan marks repeated extglobs containing unescaped, unquoted glob stars
outside character classes as risky, including nested bodies. The existing parser
literalizes the entire affected repeated extglob. Examples: +(*), +(*a), *(a*)
and +(*a|b). These patterns intentionally stop matching arbitrary filenames and
instead match their literal spelling. Ordinary glob stars outside repeated
extglobs, literal repetition and existing safe nested-star flattening are retained.
The mitigation cannot be disabled with maxExtglobRecursion=false. It does not
claim to make arbitrary user-supplied regular expressions safe.

Both upstream major versions remain separate to avoid a forced major upgrade.
No audit advisory is suppressed. The local package identity records maintained
fork ownership; audit absence alone is not proof of safety. Verify regressions
with node --test tests/security/bounded-picomatch.test.cjs and consumer suites.
Replace with official patched releases when available and compatibility-tested.

Compatibility review: the unmodified upstream 4.0.7 test suite has four expected
failures under this mitigation: wildcard repetition in +(*)c, *(a*|b), and
*/*(W*, *)* (one expectation appears in two suites). These are the deliberately
literalized unsafe forms, not skipped tests. Independent review must accept
this semantic restriction before release. The repository consumer tests must
pass as well. The 4.x utils.js global-navigator lint annotation is removed
because the repository already declares that global; runtime code is unchanged.
