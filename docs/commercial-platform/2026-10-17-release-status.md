# Commercial platform work — 2026-10-17

## Requested result

Rebuild the existing live Store around paid usage, automatic capacity growth, Course Builder, Website Builder and PARIS. The owner confirms there are no current customers on these subscriptions. Student tuition, apprenticeships, existing websites, payment history and internal operator work are separate from new commercial subscriptions. Twilio is the current carrier; standalone PBX and LiveKit must be retained. Backblaze B2 remains durable media storage. No Northflank deployment. New rates and paid external infrastructure activation require owner approval. Do not deploy fragments.

## Implemented in this change, awaiting coordinated release

- Website Builder: paid accounts consume credits; trials and paid usage mutate wallets only through the backend. Generation reserves before AI; imports reserve all requested sites atomically before crawling. PARIS site edits already use the same metering helper.
- Verified monthly Website Builder payments atomically grant access and 500 / 2,500 / 10,000 credits at the existing $29 / $79 / $199 plan prices. A unique invoice grant prevents replays from replenishing spent balances. Current payment period, currency, amount and owner are checked from the authoritative paid invoice.
- Website Builder access rejects missing, future or expired paid periods. Restricted write policies prevent owners from upgrading their own entitlement through direct Data API mutations. Trial creation requires the privileged backend.
- Customer workspace shows remaining credits and explains attempt costs, non-rollover monthly allowances and no automatic overage charges. Store plan descriptions disclose allowances. Generation/import costs 60 per site; PARIS edits cost 8. Failed processing attempts consume credits; these are not dollar-denominated spend guarantees.
- Existing unlimited Website Builder tier now preserves its configured null site limit instead of converting it to one through nullish fallback. This does not promise unlimited AI, rendering or infrastructure.
- Course Builder: paid platform invoices containing its add-on grant the existing 2,500 credits per paid month; annual payments grant 30,000 upfront. Both use invoice idempotency. New work cannot spend after the wallet paid period expires. Duplicate reservations no longer authorize another dispatch against one debit.
- Course Builder grant/refund SQL uses qualified wallet columns to prevent the existing ambiguous `balance` output-variable error. This defect was reproduced in isolated PostgreSQL; read-only production introspection confirmed the unqualified expressions are present there.
- Commercial PARIS, Ellie, Lizzy and Zora chat reserves 10 processing credits before provider execution, using the authenticated tenant. Verified paid assistant add-on invoices fund expiring pools: PARIS/Ellie 250 monthly units each, Lizzy/Zora 400 each, AI Team 1,200. Annual payments grant twelve months upfront. Prices remain unchanged. Duplicate requests, insufficient funds, void invoices and expired periods cannot authorize new provider calls. These launch allowances remain subject to measured workload economics before deployment.
- Commercial chat bounds messages, history, organization context and output tokens, and disables unscoped platform RAG. The denied-access fallback checks Website Builder trial eligibility before any debit. Store descriptions disclose attempt costs and no automatic overages.

## Verification

- Seven targeted suites: 96 tests passed, including depletion-before-provider-call, paid/trial metering, duplicate request rejection, subscription expiry, bounded commercial chat and existing renewal/fulfillment behavior.
- Isolated PostgreSQL functional tests: 64 checks passed for paid grants, unpaid rejection, invoice replay, all three Website Builder plans, Course Builder monthly/annual grants, assistant tenant isolation, pooled debits, void invoices, insufficient credits, expiry and restricted roles.
- `pnpm run typecheck:marketing`: passed.
- Scoped ESLint: passed.
- `git diff --check`: passed.
- Admin typecheck was terminated with SIGKILL at both the default 5 GiB heap and a reduced 3 GiB heap in this 8 GiB shared environment. A follow-up at 2 GiB reached the JavaScript heap limit and aborted. No successful Admin result is claimed.
- Initial local Marketing build required GIT_SHA. A second build with the real local candidate commit identity reached production compilation, then its build worker exited with SIGKILL. No successful full build is claimed. The shared cgroup reports OOM kills.

Run the isolated database tests using a separately installed `@electric-sql/pglite@0.5.10` test runtime and `PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node scripts/check-funded-commercial-usage.mjs`. The script creates only an in-memory local database; it has no remote database credentials or network calls.

## Not completed or activated

The migration has not been applied to production. No new prices, invoices, charges, external subscriptions, service configurations or deployments were activated. This is not an end-to-end commercial release.

Remaining work:

1. Price and measure complete representative workloads before approving new tariffs. Credit allowances alone do not establish provider-dollar margins, and aggregate Course Builder media jobs need item-level cost limits.
2. Complete communications metering: Twilio minutes/SMS, LiveKit minutes, B2 stored bytes/egress and refunds/chargebacks. Commercial assistant chat now has tenant-owned paid allowances and text/token ceilings; provider-dollar reconciliation remains pending. Public Elevate admissions chat is a separate platform-owned service.
3. Complete the independent Store repository/database cutover deliberately. `elevateforhumanity/elevate-store-platform` currently documents a database foundation, not a deployed Store application. Do not assume the foundation is serving the live application or move identity records blindly.
4. Connect an approved external executor and preserve the existing worker checkpoint, lease/fencing, narration, licensed-media, Remotion, caption and B2 contracts. Verify actual video output and actual provider billing.
5. Establish the provider budget, aggregate platform ceiling, receipt-backed customer budgets, bounded retries, backpressure and spend reconciliation. Do not treat max instances or budget alerts as a hard dollar cap.
6. Complete Admin validation, full builds, migration security checks, signed-in checkout/fulfillment and cross-device Store QA before one coordinated release. Record candidate commit, immutable image digest, ready revision, traffic and live SHA.

## External scaling option under evaluation

Keep Google Cloud for current web services, Supabase for identity/data and Backblaze B2 for media. Modal Starter is a candidate for external CPU rendering: $0 fixed plan fee plus usage, currently including $30 monthly compute, and documented autoscaling. This is an option, not a selected/connected/activated provider.

Official references checked 2026-10-17:
- https://modal.com/pricing
- https://modal.com/docs/guide/scale
- https://modal.com/docs/guide/existing-images
- https://modal.com/docs/guide/trigger-deployed-functions
- https://docs.cloud.google.com/run/docs/about-instance-autoscaling

At published standard CPU/memory rates, two physical cores plus 8 GiB for ten minutes calculates to approximately $0.0264 in base compute. This excludes billed load/idle time, images, AI generation, GPU, network, storage, support, taxes and region multipliers. It is not a measured lesson cost or a production quote. Modal charges the higher of reserved or actual CPU/memory consumption. Do not use promotional credits to justify customer pricing.

## Publication status

The owner explicitly approved code publication to `elevate-for-humanity/Elevate-lms`, branch `codex/funded-store-usage-20261017`, with deployment pending. The initial Website/Course changes were published as `0db658ee5e39394476183c77adf61418f96682c4`; its tree matches local reviewed commit `64984d1ed5fc23a6ba3c1bbf73566f9f41adc408`. The earlier automatic approval rejection was resolved by that explicit authorization. Terminal Git authentication was unavailable, so publication used the connected GitHub integration. Follow-up assistant controls belong on the same review branch. Main and production remain unchanged.

Read-only production catalog verification confirmed Solo $29/$290, Business $59/$590, Professional $99/$990 monthly/annual, PARIS add-on $19 monthly, Course Creation & Learning Platform add-on $79 monthly, AI Business Team $79 monthly, and billing provider QuickBooks. No prices or settings were changed.
