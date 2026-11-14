# GitHub authorization reconciliation — October 28, 2026

## Side-by-side decisions

| Authorization/source | Observed behavior before repair | Decision and resulting behavior |
|---|---|---|
| Encrypted Admin `platform_secrets.GITHUB_TOKEN` | GitHub repository request returned 200; workflow dispatch returned 403 | Keep as the one runtime repository credential. Validate its repository access. Do not claim it has Actions write authority. |
| Google `elevate-admin-github-token` | The old runtime configuration returned 401; the separately named secret had no readable latest version | Keep the correctly named Google secret. The preceding synchronization verified version 3 on healthy Admin revision `elevate-admin-migration-00294-vj9`. New releases pin an enabled numeric version. |
| Legacy plaintext `platform_settings.GITHUB_TOKEN` | A different, rejected classic token returned 401 | Removed the expired duplicate after a fresh 401 rejection and an exact-value conditional delete. Verified zero legacy entries and one encrypted canonical entry remain. Preserved the encrypted working entry. No silent retry through old identities. |
| Mandatory `paris-engineer-github-private-key` deployment lookup | The named secret did not exist, although a valid Admin token was stored | Remove this unconditional release dependency. The release now looks for `elevate-admin-github-token`, exposed as `GITHUB_TOKEN`. An access token is never parsed or relabelled as an RSA signing key. |
| Explicit GitHub App configuration and App-only diagnostic | A distinct credential type; not configured in the audited runtime | Retain only as an explicit optional integration. Partial or invalid App configuration still fails closed. The App-only diagnostic cannot pass using a PAT or workflow override. |
| Signed GitHub Actions OIDC plus request-scoped job token | Already supplies scoped repair, publish and dispatch authority | Keep. Only the authenticated workflow request advances repairs. Ordinary runtime polls wait for the existing ten-minute monitor without attempting unauthorized dispatches or generating false dispatch-failure alerts. |
| Google workload identity | Existing production deployment identity | Keep unchanged. No new IAM access or unrelated-service credential distribution. |
| OAuth client ID/client secret | Sign-in credentials, distinct from repository tokens and App signing keys | Keep for sign-in. Do not use as deployment credentials. |
| Historical PR ancestry check in runtime verification | A fixed old merge and shallow fetch could reject a compatible release | Replace with exact requested serving SHA, healthy revision, and the actual version-2 runtime diagnostic. Immutable image and traffic checks remain. |

## Exact name mapping

- Admin setting and server environment: `GITHUB_TOKEN`.
- Google Secret Manager lookup: `elevate-admin-github-token`.
- Release code: `scripts/gcp/github-runtime-binding.mjs`.
- GitHub writes and deployment dispatch: the existing scoped GitHub Actions job token, authenticated by the existing OIDC workflow allowlist.

The stored token is used for runtime repository reads. It is not given new permissions. Authentication errors, missing/disabled secret versions, wrong-project references, failed health checks, and rejected actual writes remain failures; they are not hidden or relabelled successful.

## Validation

62 targeted Node tests passed, covering resolver precedence, rejection without identity switching, App JWT behavior, exact Google secret/version selection, retained deployment gates, request-scoped workflow authority, and deployment evidence. Workflow YAML and embedded Python parsed successfully. Full CI, production build and live release evidence must be recorded before declaring the source changes deployed.

Follow-up validation: 8 shared dashboard Node tests and 8 focused authorization unit tests passed. The workflow-context test now mocks the saved-token repository check and proves concurrent job tokens remain isolated. The meeting harness exercises the real shared video component and verifies the holder wrapper delegates its authorized token endpoint. Full CI remains required.
