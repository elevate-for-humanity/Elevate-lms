# PARIS GitHub App authentication

The shared Dev Studio resolver accepts a server-side GitHub App installation.
Verified request-scoped workflow credentials retain precedence. Otherwise a
configured App takes precedence over legacy GITHUB_TOKEN credentials. An invalid
or incomplete App configuration fails closed without falling back to a PAT.

The existing protected Admin deployment now validates the existing Google
Secret Manager key, discovers the App installation for Elevate-lms, checks
contents/actions/pull-request write permissions, and binds the following values
to the zero-traffic candidate before the existing health/activation gates:

| Variable | Value |
| --- | --- |
| GITHUB_APP_ID | 5477907 |
| GITHUB_APP_INSTALLATION_ID | The installation of PARIS Engineer for Elevate on elevate-for-humanity, verified in GitHub App settings |
| GITHUB_APP_PRIVATE_KEY_FILE | Absolute path to the PEM mounted from Google Secret Manager |

The default key secret is `paris-engineer-github-private-key`. If the key is
already stored elsewhere, set repository variable `PARIS_GITHUB_APP_SECRET` to
that secret's name; do not copy or regenerate the key. The deployment pins an
enabled numeric secret version at `/var/run/secrets/paris-github-app/key.pem`.
It never prints the PEM or installation token. Missing keys, denied Google
access, missing installation, or missing App permissions fail before rollout.
The deployment identity needs access to this key; the existing Admin runtime
identity must be allowed to read its mounted version. This change does not
grant project-wide secret access or provision identities. Google IAM failures
must be resolved by the account owner on the specific secret resource.

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

Run `node --test scripts/test-github-app-token.mjs scripts/test-devstudio-github-token.mjs scripts/gcp/paris-github-app-binding.test.mjs scripts/test-paris-app-diagnostic.mjs`.
Run Admin typecheck, lint and build before release. After the approved main
deployment, validate a normal authenticated Studio/PARIS request using the App
configuration (without a workflow token override), and verify repository access
and an authorized protected workflow dispatch separately. Never log the token.

After exact-revision activation, the deployment uses an App installation token
to dispatch `verify-paris-production-authorization.yml`, passing the deployed
SHA. This proves dispatch acceptance, not successful verification. That workflow
requires the live SHA to match and calls `app-auth-diagnostic` through the
existing GitHub OIDC authorization. This phase ignores workflow-token headers
and uses only the runtime's App binding; no PAT fallback is allowed. It reports
only source/status metadata and does not repair code, change business records,
or dispatch additional workflows. Record the ready revision and successful
live verification run before calling the connection complete.
