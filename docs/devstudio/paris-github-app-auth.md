# PARIS GitHub App authentication

The shared Dev Studio resolver accepts a server-side GitHub App installation.
Verified request-scoped workflow credentials retain precedence. Otherwise a
configured App takes precedence over legacy GITHUB_TOKEN credentials. An invalid
or incomplete App configuration fails closed without falling back to a PAT.

Bind these values in the existing Google Admin runtime, using its existing
Google deployment and configuration workflow:

| Variable | Value |
| --- | --- |
| GITHUB_APP_ID | 5477907 |
| GITHUB_APP_INSTALLATION_ID | The installation of PARIS Engineer for Elevate on elevate-for-humanity, verified in GitHub App settings |
| GITHUB_APP_PRIVATE_KEY_FILE | Absolute path to the PEM mounted from Google Secret Manager |

Alternatively bind GITHUB_APP_PRIVATE_KEY directly from Google Secret Manager;
set exactly one key source. Never set either as a NEXT_PUBLIC variable. Do not
commit the key, place it in a Docker build argument, print its value, or store a
one-hour installation token as a permanent runtime credential. A key already
stored under a different Secret Manager name can be mounted without copying it.
The Secret Manager resource name alone is not a filesystem path.

No new App is needed for Studio or Course Builder routes that use the shared
resolver. This does not change independent worker credentials or Google IAM.
Do not grant the key to unrelated services. The GitHub connector's installation
ID is not necessarily the PARIS App's installation ID.

The resolver verifies the App's installation for exactly
elevate-for-humanity/Elevate-lms, requests a token restricted to Elevate-lms,
caches it only in server memory, and renews with a one-minute margin. Rotation
invalidates the credential cache. Repository and protected-branch rules continue
to apply. No writes, dispatches, deployments or permission grants occur on token
issuance.

## Validation

Run `node --test scripts/test-github-app-token.mjs scripts/test-devstudio-github-token.mjs`.
Run Admin typecheck, lint and build before release. After the approved main
deployment, validate a normal authenticated Studio/PARIS request using the App
configuration (without a workflow token override), and verify repository access
and an authorized protected workflow dispatch separately. Never log the token.

The existing verify-paris-production-authorization workflow supplies its own
GitHub Actions token; it does not prove this App's credentials work. Source tests
do not establish that the secret is bound to the production runtime. Record the
deployed SHA, ready revision and live App-authenticated result before calling
the connection complete.
