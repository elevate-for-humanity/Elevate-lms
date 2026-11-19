# Website Builder authorization acceptance checkpoint

The production catalog and the initial isolated QA builder stage contained three
inherited authorization defects: organization member DELETE access, revision
INSERT without authority over the referenced website, and a caller-controlled
trial wallet grant. The stricter ownership policies committed in #2729 had not
been applied to the existing QA database at read-back on 2026-11-19. The earlier
exact-source comparison is historical; it is not a security acceptance verdict.

`harden-builder-authorization.sql` repairs these policies, also preventing a
personal site from being attached to an organization its owner cannot manage.
It preserves ordinary member reads and owner/manager writes. Authenticated
wallet initialization requires an actual unexpired Website Builder trial and
uses the existing 500-credit allowance; only the trusted service role can select
an amount. Existing wallets are not refilled. The current implementation body
is fenced by its inspected MD5 so an unexpected concurrent repair is not overwritten.
No customer configurations, publication states or existing balances are rewritten.

QA hardening calls lost their tool execution context without a completion result.
Subsequent read-back showed no `website_builder_authorization_guardrails` migration
and the original helper body MD5 `c5a318bd58d891f036f11c4c668d381b`.
Do not claim the repair applied, and do not blindly replay a transport-ambiguous
DDL request. Re-read the ledger, policies and helper before the next attempt.
The repair remains pending in QA and production. Once the reviewed SQL is applied
successfully, record the actual migration version and preserve it in the canonical
migration history. Never replay the completed 2671/2672 migrations.

`test-builder-authorization.mjs` uses the configured isolated QA URL only and
creates two real disposable Auth accounts through the supported Admin API. It
uses genuine password sessions, ordinary student profiles and temporary free-trial
and organization fixtures; it does not fabricate a paid subscription, training
enrollment, approval or JWT. It checks missing/expired trial denial, a bounded
caller grant, no repeat refill, foreign-wallet denial, member-read/member-delete,
manager-delete and revision-ownership positive/negative cases. Cleanup and zero
remaining fixture rows are required assertions. Passwords and keys are not logged.
The existing desktop E2E workflow runs it after the isolated-configuration preflight,
retaining all existing browser jobs and gates.

Local JavaScript syntax and missing-configuration refusal passed. The Auth/API
suite has not run yet; the old QA helper is expected to fail its security assertions.
This is not subscriber create/edit/save/reopen/preview, browser, device/audio/mic,
contact/course or approved-original parity acceptance. Those checks remain pending.

Separately, rollback-only PostgreSQL tests against the initial empty QA builder
stage passed draft creation, workspace triggering, identical request replay,
fingerprint mismatch/foreign-owner/stale-token rejection, exact backup retention,
monotonic write tokens, saved config and import/no-charge checks. All fixture rows
and receipts rolled back and all seven builder tables were then verified empty.
These privileged SQL checks do not establish a nonadmin subscriber session.

The organization-change guard is SECURITY INVOKER with an empty search path. It
checks new attachments while retaining a legacy owner's ability to edit a site
whose organization is unchanged even when the owner has no organization membership.
The API regression includes this positive control, along with insert/move denials
for an unrelated organization. The wallet repair also uses an empty search path.
Both a changed wallet body and an already-existing organization guard cause refusal,
so a later attempt must inspect rather than overwrite concurrent repairs.
