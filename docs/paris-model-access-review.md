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

The service retains Cloud Run IAM and its existing application token. After actual Admin invocation is verified, `scripts/gcp/activate-owned-cpu-model.mjs` verifies private inference and requires the live Admin image to contain commit `56f8e7f693d94048c550b32efca71dcf8be2eacc` or a descendant. This includes the bounded CPU prompt and retrieval policy that prevents private chat from calling vendor embeddings. The script updates both `ELEVATE_LLM_CPU_URL` and the compatibility alias `ELEVATE_LLM_URL` with paired credentials, sets the 8192-token context limit, and health-checks the exact Admin revision before routing traffic. Validation failures restore the previous configuration. Other components without an owned inference endpoint retain their existing configuration. A missing explicit service-level binding is not treated as a missing capability when effective inherited permissions and actual invocation prove access.
