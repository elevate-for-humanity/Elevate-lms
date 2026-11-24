# Paris model invocation review

The owned CPU candidate is deployed in project `elegant-racer-299721`, region `us-east1`.

- Service: `elevate-owned-cpu-llm`
- Private URL: https://elevate-owned-cpu-llm-aabnh2y32a-ue.a.run.app
- Revision: `elevate-owned-cpu-llm-00001-m5n`
- Verified image: `sha256:267e2ec2347c128ca950493bad8e0ba712a809ebbe566267054d2bc1cc1ad2b2`
- Capacity: 4 CPU / 8 GiB, concurrency one, minimum zero, maximum one.
- Release evidence: https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/39595463763

The real container passed application authentication, inference, forced tool-call, streaming, and memory-limit checks. Google deployment and resource readback succeeded. The effective-permission check at 2026-10-21 12:29 UTC confirmed that the deployment identity can already invoke the private service through an existing role. Its authenticated private endpoint checks also passed at 12:51 UTC. No additional deployment-identity grant is required.

At 12:53 UTC, the finite probe running as the actual Admin service identity returned HTTP 403 for model discovery. Evidence: https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/39602734769, job `119231090701`, execution `elevate-paris-probe-39602734769-z98n8`. The probe changed neither configuration nor permissions. The connected deployment identity cannot manage the model's invocation policy, so a project owner must apply the one grant below.

The release boundary in `services/llm-cpu-worker/README.md` says: “Any missing `roles/run.invoker` grant requires explicit review.”

| Principal | Role | Resource | Purpose |
| --- | --- | --- | --- |
| `elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com` | `roles/run.invoker` | `elevate-owned-cpu-llm` in `us-east1` | Paris chat, code repair, and Admin Course Builder calls |

The actual Admin invocation probe returned HTTP 403. A project owner can apply this service-specific grant after review:

```bash
gcloud run services add-iam-policy-binding elevate-owned-cpu-llm \
  --project=elegant-racer-299721 --region=us-east1 \
  --member=serviceAccount:elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com \
  --role=roles/run.invoker --condition=None

```

The service retains Cloud Run IAM and its existing application token. After actual Admin invocation is verified, `scripts/gcp/activate-owned-cpu-model.mjs` verifies private inference and requires the live Admin image to contain commit `56f8e7f693d94048c550b32efca71dcf8be2eacc` or a descendant. This includes the bounded CPU prompt and retrieval policy that prevents private chat from calling vendor embeddings. The script updates both `ELEVATE_LLM_CPU_URL` and the compatibility alias `ELEVATE_LLM_URL` with paired credentials, sets the 8192-token context limit, and health-checks the exact Admin revision before routing traffic. Validation failures restore the previous configuration. A missing explicit service-level binding is not treated as a missing capability when effective inherited permissions and actual invocation prove access.

## One shared model across every surface

The platform is one AI system. After the Admin revision is verified and serving,
the same activation binds the identical owned-model connection into every other
user-facing surface so they do not fall back to canned text:

| Component | Service | Runtime config secret |
| --- | --- | --- |
| admin | `elevate-admin-migration` | `elevate-admin-runtime-config` |
| lms | `elevate-lms-migration` | `elevate-lms-runtime-config` |
| marketing | `elevate-marketing-migration` | `elevate-marketing-runtime-config` |
| store | `elevate-store-migration` | `elevate-store-runtime-config` |

`configureOwnedModelConsumers` writes the same endpoint, credentials, provider
selection, and context limits into each consumer's runtime configuration, grants
the consumer identity `roles/secretmanager.secretAccessor` on the model token,
and attempts `roles/run.invoker` on the private model. It runs best-effort per
consumer: a grant that requires a project owner is reported in the activation
output rather than aborting the already-verified Admin cutover. The chat surface
stays portal-specific; only the model connection is shared.

## Status addendum — 2026-11-23 (provider re-check, no live inference run)

- **2026-10-21:** Model deployed (revision `elevate-owned-cpu-llm-00001-m5n`, image
  `sha256:267e2ec2347c128ca950493bad8e0ba712a809ebbe566267054d2bc1cc1ad2b2`) and
  deployment-identity acceptance passed. The Admin-identity probe returned HTTP 403
  (missing `roles/run.invoker` for `elevate-admin-runtime@`).
- **2026-11-13:** Workflow run `43341661249` (`verify-owned-cpu-access.yml`,
  `workflow_dispatch`) completed with **verify: success** and **connect: success**.
  The verify job includes the Admin-identity model-discovery probe, so the Admin
  identity could discover `elevate-local` on that date, and the connect job ran
  `activate-owned-cpu-model.mjs`, staging an Admin revision carrying
  `ELEVATE_LLM_URL` / `ELEVATE_LLM_CPU_URL` + `ELEVATE_LLM_GOOGLE_IAM=true` and
  routing traffic to it. That is the last successful live proof on record.
- **2026-11-23:** Unauthenticated probe of the private URL returns HTTP 403 from
  Google Frontend — the service exists and is still IAM-gated (alive, private).
  That alone does **not** prove the model answers; only a Google identity + the
  application token can prove inference. Admin deploys since Nov 13
  (`deploy-admin.yml`) use `--update-env-vars` for a small named set and state
  "keep the existing runtime identity, secrets, memory and scaling", so the
  Nov 13 endpoint configuration is not removed by a deploy. No evidence on
  record since Nov 13 of a live PARIS chat or code-repair turn through the owned
  model (release step 7) — that proof is still open.
- **Re-proof without changing anything:** dispatch `verify-owned-cpu-access.yml`
  with `connect: false` (see `docs/provider-live-proof.md`). It runs the same
  deployment-identity acceptance and Admin-identity probe as Nov 13 and skips
  the connect/activate job.
