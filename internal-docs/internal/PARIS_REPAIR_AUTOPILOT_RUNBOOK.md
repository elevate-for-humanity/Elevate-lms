# PARIS Repair Autopilot — Unblocking Runbook

How to diagnose and clear a stalled PARIS code-repair autopilot.

## When to use this

Use it when `/api/paris/supervision` shows `codeRepair.summary.stalled: true`, or
when `paris_code_repairs` has `queued` rows with **zero** `verified` and **zero**
in-flight. That is the signature of the deadlock that went unnoticed before:
repairs queue up and nothing ever dispatches.

## Fast check (one command)

```bash
curl -s "https://admin.elevateforhumanity.org/api/paris/supervision" \
  -H "Cookie: <admin session>" | node -e "
  let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
    const j=JSON.parse(s);console.log(j.codeRepair.summary);});"
```

Read the output:

| Summary | Meaning | Action |
| --- | --- | --- |
| `queued > 0, inFlight = 0, verified = 0` | `stalled: true` — the autopilot is not dispatching | Go to "Cause B" |
| `queued > 0, inFlight > 0` | Healthy — repairs are running | None |
| `verified > 0` | Healthy — repairs are completing | None |
| `blocked` large and growing | Content defects routed to code repair | Go to "Cause A" |

## Cause A — content defects routed to code repair

**Symptom:** `blocked` grows; rows carry
`PARIS_PATCH_FAILED: Internal engineering finished without a verifiable
repository change.`

**Why:** the failure is a content/producer defect (for example
`REPAIR_PRODUCER_UNCHANGED` — a producer already re-ran and emitted identical
output). No repository change can fix that, so the code repair always finishes
empty and parks.

**Status:** fixed in `course-repair-policy.mjs` (`isRepairableCourseFailure`
returns `false` for `REPAIR_PRODUCER_UNCHANGED`). These findings now stay in the
content/source recovery path. Verify the deployed Admin commit is at or after
`0f83c01146`.

## Cause B — the owned model is not reachable (the usual cause)

**Symptom:** `stalled: true`; queued repairs have `dispatched_at: null` and
`attempt_count: 0`; the repair workflow runs are `skipped` or short.

**Why:** before dispatching any repair, the tick probes the internal model
(`elevate-local`). If the probe fails, every repair is held. The probe result is
visible in `platform_integrations`:

```sql
select provider, status, metadata->>'authenticated', metadata->>'configured'
from platform_integrations where provider = 'paris';
```

`authenticated: false` / `status: testing` means the model is not usable.

### Fix

The model connection is read from two runtime secrets, resolved at boot from
`platform_secrets` (scope `runtime`) via `hydrateProcessEnv()`:

| Key | Value |
| --- | --- |
| `ELEVATE_LLM_CPU_URL` | The model base URL, e.g. `https://<service>-<hash>.us-central1.run.app` |
| `ELEVATE_LLM_CPU_SECRET` | The bearer token the service expects |

Rules the URL must satisfy (enforced by `owned-model-config.mjs` and
`owned-model-health.mjs`):

- `https://` scheme, no port, no username/password, no query, no hash, path `/`.
- Host must end in `.run.app` (CPU tier) or be a `*.proxy.runpod.net` host when
  `PARIS_GPU_ENABLED=true` and `PARIS_INFERENCE_TIER=gpu`.
- The service must answer `GET <url>/v1/models` with `elevate-local` in `data`.

Steps:

1. Confirm the model service is running and serving `elevate-local`:

   ```bash
   curl -s -H "Authorization: Bearer $ELEVATE_LLM_CPU_SECRET" \
     "$ELEVATE_LLM_CPU_URL/v1/models" | grep -o 'elevate-local'
   ```

2. If the URL or secret is missing or wrong, set them in `platform_secrets`:

   ```sql
   insert into platform_secrets (key, scope, category, is_sensitive, value)
   values
     ('ELEVATE_LLM_CPU_URL', 'runtime', 'ai', true, 'https://<service>-<hash>.us-central1.run.app'),
     ('ELEVATE_LLM_CPU_SECRET', 'runtime', 'ai', true, '<token>')
   on conflict (key) do update set value = excluded.value, updated_at = now();
   ```

   (Use the encrypted write path the Admin console uses; do not paste secrets
   into shell history.)

3. Confirm `AI_PROVIDER` is `elevate` (the default) so the tick takes the
   owned-model branch. If `AI_PROVIDER` points at a paid provider, the probe is
   skipped and repairs run against that provider instead.

4. Redeploy Admin so the runtime picks up the secrets (secrets are read at boot):

   ```bash
   gh workflow run deploy-admin.yml
   ```

5. Re-check the probe:

   ```sql
   select metadata->>'authenticated' from platform_integrations where provider='paris';
   ```

   `true` means the next tick will dispatch.

## Cause C — an active repair is stuck

**Symptom:** `inFlight > 0` but nothing progresses for hours.

The tick serialises releases: it will not dispatch a new repair while another is
`dispatched|patching|validating|deploying|verifying`. Find the stuck one:

```sql
select id, status, updated_at, error_code
from paris_code_repairs
where status in ('dispatched','patching','validating','deploying','verifying')
order by updated_at;
```

If it is genuinely abandoned (its workflow run is gone and it has not advanced),
move it back to the queue so the bounded attempt counter applies:

```sql
update paris_code_repairs
set status = 'queued', updated_at = now()
where id = '<repair-id>' and status = '<stuck-status>';
```

Do not reset `attempt_count`; the bound is deliberate.

## Verifying the fix

After any change, watch the summary for one tick cycle:

- `inFlight` becomes non-zero, then
- `verified` increments, and
- `stalled` becomes `false`.

Then confirm the original course job re-ran and the lesson published.

## Escalation

If the probe passes but repairs still do not dispatch, check the dispatch
workflow itself:

```bash
gh run list --workflow=paris-code-repair.yml --limit 5
```

A run that is `skipped` while the Admin commit is behind the deployed image means
the control plane is out of sync — redeploy Admin and retry.
