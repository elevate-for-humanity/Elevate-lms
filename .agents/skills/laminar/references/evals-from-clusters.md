# Evals from a cluster

A cluster is a group of similar signal events: one failure mode, seen on real traces. This reference turns
those traces into eval cases that reproduce the failure, so a fix can be measured and the failure can't
quietly come back. The cases are Harbor tasks: build the harness (image, agent, verifier, `lmnr-cli eval
run`) as [env-evals.md](env-evals.md) describes. This file covers what goes into the cases: which traces,
what each case seeds and runs, what it checks, and what to tell the user.

## What a cluster gives you

- **The signal** (`signals`): `prompt` is the natural-language definition of what gets flagged, and
  `structured_output_schema` the shape of each event. It is the closest thing to a grading rubric the
  project already has.
- **The events** (`signal_events`): one per flagged trace, with `payload` (the signal's output: why this trace
  was flagged, often naming the step), `severity` and `timestamp`.
- **The traces**: the input the agent got (`traces.agent_input`), every LLM and tool call, and what the tools
  returned. This is the case data.
- **The hierarchy** (`clusters`): `level` 1 is the finest. A coarser cluster groups children that are
  distinct failure modes.

Read them with `lmnr-cli sql query "<sql>" --json` (column shapes in
[sql-query-api.md](sql-query-api.md#signals-and-clusters)):

```sql
-- The cluster and its children
SELECT id, name, level, parent_id, signal_id, num_signal_events, num_children_clusters
FROM clusters
WHERE id = toUUID('<cluster_id>') OR parent_id = toUUID('<cluster_id>')

-- The signal's definition
SELECT name, prompt, structured_output_schema FROM signals WHERE id = toUUID('<signal_id>')

-- The cluster's events, newest first, with the leaf cluster each one is in
SELECT trace_id, severity, timestamp, leaf_clusters, substring(payload, 1, 2000) AS payload
FROM signal_events
WHERE has(clusters, toUUID('<cluster_id>'))
  AND timestamp > now() - INTERVAL 30 DAY
ORDER BY timestamp DESC
LIMIT 200
```

Widen the window when there are few events. Then read the candidate traces themselves, a few at a time,
to see the input, the step that went wrong and the tool results around it.

## Pick the traces

Cover the failure mode with a small set, not every trace: each case boots a full stack in its own
container. 3 to 8 failing cases plus 1 to 3 controls is a good first suite for one cluster.

1. **Split by failure mode.** If the cluster has children, take cases from each leaf cluster
   (`leaf_clusters`), not only from the biggest.
2. **Deduplicate on the input.** Traces whose inputs differ only in ids, timestamps, names or wording are one
   case; keep the one with the most complete trace. Distinct inputs that fail the same way are worth keeping:
   they show the failure isn't tied to one phrasing.
3. **Prefer traces you can reproduce:** the input and every tool result recorded, produced by the code in
   this repo, and recent (`traces.release` close to the current revision). Skip traces whose failure came from
   an outage (a provider 5xx, a timeout) rather than the agent's behaviour, unless handling that outage is the
   failure mode.
4. **Keep the severe ones.** Include the critical events; don't fill the suite with the mildest.
5. **Add controls:** traces the same signal evaluated and did *not* flag, through the same entry point with
   similar inputs. They catch a fix that over-corrects (refuses, stops calling the tool):

```sql
SELECT trace_id FROM signal_runs
WHERE signal_id = toUUID('<signal_id>')
  AND status = 'COMPLETED'
  AND event_id = toUUID('00000000-0000-0000-0000-000000000000')
  AND updated_at > now() - INTERVAL 30 DAY
LIMIT 50
```

Note why you chose each trace as you go; it goes into the suite's README ("Report back").

## Turn a trace into a case

First find the code that produced the traces: search the repo for the system prompt text, tool names and
span names in the trace. They lead to the entry point ([env-evals.md](env-evals.md), "Procedure" step 1). If
the traces came from code that isn't in the repo (another service, another language), stop and say so
rather than evaluating something else.

Then map the trace onto the case:

| From the trace | Goes into |
|---|---|
| The agent's input (`agent_input`: the user message, the job payload) | `instruction.md` / `environment/case.json`: what the driver sends to the entry point |
| What the agent read: tool results, retrieved documents, rows it queried | seeded state in `case.json`: database rows, files, or recorded responses at a third-party edge (a mock, reported as env-evals.md requires) |
| Earlier turns of a multi-turn conversation | seeded history; drive only the turn that failed (`is_copied_context` in a reconstructed trajectory) |
| The event's `payload` and the signal's `prompt` | the verifier (next section) |
| The trace id, the cluster, why it was chosen | `[metadata]` in `task.toml` (e.g. `source_trace_id`, `cluster`, `reason`) and the suite's `README.md` |

- **Seed what the agent saw, not what it should have seen.** The case reproduces the conditions of the
  failure; with corrected data it tests nothing.
- **Don't replay the model.** The recorded LLM outputs are what's under test: only tool and service results
  become seed data, and the model runs live ("LLM handling" in env-evals.md).
- **Rebase timestamps, regenerate ids, replace PII and secrets** ("Seed data the agent can't tell is a test"
  in env-evals.md). Traces can hold customer data and the cases get committed: never commit raw PII or
  credentials. Values the project masks arrive masked; replace them with plausible ones.
- Name task directories after the behaviour (`refund-double-charge`), not the trace id.

## The verifier: did the failure recur?

For these cases reward `1` means the failure did not happen, `0` that it did. Choose the check from the
failure:

- **A mechanical symptom gets a deterministic check:** a tool error, the wrong tool, a missing call, invalid
  output, a loop past N steps, a forbidden value in the answer. Check the artifacts (`result.json`, the
  trajectory, database state) directly. Prefer this whenever it fits: it is cheap and never flaky.
- **A judgement call gets an LLM judge built from the signal.** Use the signal's `prompt` as the rubric,
  narrowed to this failure mode with the cluster name and a few event payloads, and grade the run's output
  and trajectory. The signal already says what the project calls a failure; don't invent another definition.
- **Also check the task got done.** "The failure is absent" alone passes an agent that refused or did
  nothing. Pair it with a minimal completion check (an answer was given, the expected tool was called, the
  record was written).
- **Reference answers** only where a human confirmed the correct outcome: production traces have no gold
  label.

Controls use the same verifier and should pass.

## Run and read the baseline

Run the suite as env-evals.md describes, against the current code. Expect failing cases: they are the
reproduction, and their score is the baseline a fix will move.

- **Cases fail the way the cluster describes:** the eval works. Leave them failing; fixing the agent is a
  separate task unless the user asked for it.
- **Everything passes:** either the failure is already fixed (compare the source traces' `traces.release`
  with the current revision, and read the code) or the case doesn't reproduce its conditions (seed data
  missing, another entry point, other config). Find out which before reporting.
- **Cases fail for another reason** (a harness error, `timeout`, a different failure): fix the harness first.
- Never loosen or tighten the verifier just to get the expected score.
- Production failures are often intermittent: run with `--n-attempts 3` and report pass rates, not single
  outcomes.

Check the verifier once, as env-evals.md asks: a control passes, and a failing case scores 0 for the right
reason (read its verifier output).

## Edge cases

- **Too few traces.** One or two traces still make an eval: build those cases and say the eval is thin. Add
  variations (another phrasing, other data) only if the user agrees, and mark them as synthetic in
  `[metadata]` and the README. Never present a synthetic case as production data.
- **No usable trace.** If no trace can be reproduced (input or tool results not recorded, data past
  retention, code not in the repo), stop and say what is missing. The fix is often better instrumentation,
  not an eval.
- **Too many traces.** Sample across leaf clusters, severity and time instead of taking the newest N.
- **An existing evals folder.** Add the cases to it (a suite for this failure mode, or tasks in the suite
  with the same entry point) and reuse its image, seed and driver code ("When the harness doesn't fit" in
  env-evals.md).
- **The trajectory.** The cluster exists, so production sends traces to Laminar, but maybe not in a way an
  eval run can capture (an older SDK, a plain OpenTelemetry exporter, another service). Check before relying
  on `LMNR_TRAJECTORY_PATH`, and reconstruct the trajectory if it isn't covered ("Capturing the agent's
  trajectory" in env-evals.md). Don't add or upgrade instrumentation as part of the eval work; recommend it.

## Report back

The full record goes in the suite's `README.md`: one row per case with its name, source trace, why it was
chosen and what the verifier checks, controls and synthetic cases marked. It outlives the conversation and
can be as long as the suite.

What you tell the user stays short however many cases there are:

1. The cases, grouped: one line per group of cases that share a failure mode and a check (usually a leaf
   cluster), with how many cases it has, why those traces were chosen, what the verifier checks, and one or
   two source traces linked as examples. Count controls and synthetic cases separately. With only a handful
   of cases, a line per case is fine.
2. The baseline: how many cases reproduce the failure, with a link to the evaluation.
3. Anything that limits what the eval measures: mocks, a reconstructed trajectory, an inferred schema,
   traces that couldn't be used and why.
4. Where the full list is (the README).

A pull request description, if you open one, takes the same short summary and points to the README.
