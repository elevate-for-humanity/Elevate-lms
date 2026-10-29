# Course production inheritance audit

Baseline: owner-approved cosmetology first instructional lesson and saved build 572cca43-6bd6-4a91-b385-a8b576209c4e. Comparison: barber b400834e-15e3-4ef0-ae20-33cd9f82e950 and HVAC d535e31f-10e6-43dd-b60a-e7e5538d764a. Source inspected at 0987235c; production runtime registry reported worker 44587df. A registry observation does not certify every deployed service.

| Fix | Cosmetology saved profile | Barber / HVAC saved profiles before repair | Forward inheritance repair |
| --- | --- | --- | --- |
| Approved presentation | October 17 first-lesson contract with later instruction refinements | October 13 barber reference contract | Versioned shared presentation requirements; preserve explicitly selected reference as reference-only |
| Full photographs, narration-synced picture changes, captions, recaps | Explicitly required | Older premium instructions | Shared policy for new builds |
| Instructional depth, examples, practice, corrections | Explicit updated instructions | Older instructions | Shared policy plus existing depth validation |
| Google source-grounded authoring | Configured | Configured | Default for new builds; preserve explicit model choice |
| Three-role autopilot | three-role-v1 | Absent | New generated profiles, direct create requests and persistence creation inherit it |
| Publish completed lessons | true | Absent | Shared default true; release checks remain mandatory |
| No quiz-navigation filler | Only cosmetology UUID passed the subject guard | Not inherited | Versioned subject policy works for every occupation; salon-specific enrichment stays scoped |
| Assessment source selection | Checkpoints use preceding subjects; final uses all subjects | Generic selector could use checkpoint directions | Shared policy selects subject sources for new course checkpoints and finals |
| Continue between completed lessons | One cosmetology course UUID | Not inherited | Shared-policy courses eligible within existing bounded lease and checkpoints |
| Recovery after new tested worker deployment | Generic for three-role tasks; old sequential recovery remains scoped | Blocked source/demonstration requirements remain real | New profiles inherit three-role scheduling; no false media approval or retry of unchanged external blockers |
| Per-course one-off repair instructions | Preserve lessons 1/2 and defer 3/4/5 | Not applicable | Intentionally excluded from shared defaults |
| Occupation sources, standards, practical signoff, scene/asset identities | Course-specific | Course-specific | Preserved; never copy cosmetology subject matter into HVAC or barber |

## Boundaries

Source/profile repair is not course completion or publication. Barber's saved failure requires scene-relevant licensed practical footage. HVAC's complete-lesson build has missing browser learner-runthrough evidence. These are not cleared by policy inheritance or media copies. The replacement HVAC draft now contains 17 consolidated draft lessons; all 96 source topic records are preserved as source-only. Stage-one build adc2ae08-f739-41e1-ac86-b79802e46f19 targets Core and Type I. The three active teaching sources and their questions were corrected against EPA primary guidance before queuing; draft status is not release approval.

Existing locked and active pool profiles are not silently edited during hydration. New builds receive the shared policy at each creation entry. Existing blocked builds require an explicit guarded migration with no live job/pool and subsequent revalidation of affected checkpoints. Existing published lessons and owner pauses are preserved.

Validation: full worker regression suite, profile/registered-profile tests, lint, application type checks/builds, followed by CI and deployment verification. Only completed checks may be reported as passing.

The blocked barber and older HVAC complete-lesson profiles were migrated only with no queued/running jobs or active pool, retaining the previous presentation policy in productionInheritanceAudit. Cosmetology's published profile was not edited. Recovery monitoring now defaults on for new continuations while explicit saved disables remain preserved. The parallel-team request now queues a stopped full-course continuation before requesting the pool, and rejects targeted previews and owner-paused builds.

Verified locally: 310 worker tests, 53 dispatcher/capacity tests, 11 profile/cutover tests, changed-source lint, all three application type checks, and complete Marketing, Admin and LMS production builds including generated-route type checks. Local dependency links initially crossed checkouts; after repairing those links, all three builds passed. Runtime rollout of the shared source repair must still be verified separately. The independent coordinator-concurrency repair f6ac02c035e37fc553cb861194836d6978b3944d is on main.
