# Paris model invocation review

The owned CPU candidate is deployed in project `elegant-racer-299721`, region `us-east1`.

- Service: `elevate-owned-cpu-llm`
- Private URL: https://elevate-owned-cpu-llm-aabnh2y32a-ue.a.run.app
- Revision: `elevate-owned-cpu-llm-00001-m5n`
- Verified image: `sha256:267e2ec2347c128ca950493bad8e0ba712a809ebbe566267054d2bc1cc1ad2b2`
- Capacity: 4 CPU / 8 GiB, concurrency one, minimum zero, maximum one.
- Release evidence: https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/39595463763

The real container passed application authentication, inference, forced tool-call, streaming, and memory-limit checks. Google deployment and resource readback succeeded. Live private invocation and Admin cutover are waiting on these two service-specific grants.

The release boundary in `services/llm-cpu-worker/README.md` says: “Any missing `roles/run.invoker` grant requires explicit review.”

| Principal | Role | Resource | Purpose |
| --- | --- | --- | --- |
| `elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com` | `roles/run.invoker` | `elevate-owned-cpu-llm` in `us-east1` | Paris chat, code repair, and Admin Course Builder calls |
| `elevate-github-deploy@elegant-racer-299721.iam.gserviceaccount.com` | `roles/run.invoker` | Same service | Authenticated release acceptance and deployment verification |

A project owner with permission to update this service's IAM policy can apply the reviewed grants:

```bash
gcloud run services add-iam-policy-binding elevate-owned-cpu-llm \
  --project=elegant-racer-299721 --region=us-east1 \
  --member=serviceAccount:elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com \
  --role=roles/run.invoker --condition=None

gcloud run services add-iam-policy-binding elevate-owned-cpu-llm \
  --project=elegant-racer-299721 --region=us-east1 \
  --member=serviceAccount:elevate-github-deploy@elegant-racer-299721.iam.gserviceaccount.com \
  --role=roles/run.invoker --condition=None
```

The service retains Cloud Run IAM and its existing application token. After review and access setup, `scripts/gcp/activate-owned-cpu-model.mjs` verifies private inference and the live Admin transport adapter, updates both `ELEVATE_LLM_CPU_URL` and the compatibility alias `ELEVATE_LLM_URL` with paired credentials, and health-checks the exact Admin revision before routing traffic. Validation failures restore the previous configuration. Other components without an owned inference endpoint retain their existing configuration.
