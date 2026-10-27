# Program Holder dashboard root audit — October 27, 2026

Scope: shared Program Holder dashboard pages, APIs and components; existing and newly provisioned identities; live Elevate schema, grants, policies and object references. No credentials or student records are included in this report.

## Confirmed defects and repairs

- The parent layout and onboarding page reused the operational approval guard, creating pending-account redirect loops. The parent now resolves authenticated holder identity while individual operational pages retain approval checks. Pending onboarding renders a real status page.
- A unique holder ownership row could exist before its profile backlink. The guard now resolves only the authenticated user's unique owned record, without granting approval. Inactive, suspended and terminated holders remain blocked.
- Program-scope lookup errors were silently treated as empty program lists. These now fail explicitly.
- The MOU page independently resolved the administrator's real identity during holder previews and rejected approved-pending-MOU status. It now uses canonical holder context, keeps previews read only, and displays a recorded agreement link when present. It explicitly distinguishes a signed-status flag from an attached executed document.
- MOU acceptance could clear manual enrollment restrictions. Signing now preserves those restrictions and validates the current holder/version before recording acceptance.
- New-holder approval created accounts/links before checking requested programs and could reuse an unrelated earlier MOU acceptance. Program validation now precedes identity writes; recovered acceptance must match the holder/version.
- Private uploaded-document paths had no usable view link. Owner-authorized downloads now sign the row's actual storage bucket for 60 seconds. New uploads explicitly store their bucket.
- Five forms could remain stuck on network failures or treat HTML sign-in responses as successful JSON. They now retain entered data, report failure and release busy state.
- Acknowledgement insert errors were ignored. Failed writes now return an error rather than success. The NDA checklist now has an explicit acceptance control.
- The training form never supplied the verified clock ID required by its endpoint. It now selects verified clocks from the same student/program. Daily progress no longer truncates previously accumulated hours to 48 or accepts a clock from a different program.
- Displayed hours combined program totals and mirrored clock rows. Verified aggregation now isolates program/student and de-duplicates linked clock records.
- The workspace relied solely on holder-specific course overrides although canonical program/course mappings already existed. It now resolves canonical course metadata without publishing courses or granting learner access.
- Gary regional rows used application IDs against an endpoint expecting roster IDs. Logging now rechecks server-computed territory/ownership, creates a unique scoped roster link when eligible, and uses the actual roster ID. Local-holder-controlled and revoked applicants are excluded.
- Banking configuration could reset verified payout flags. Same-provider setup is idempotent; changing a verified provider requires administrator handling. Unsafe/non-HTTPS setup links and unsupported providers are rejected. Missing provider URLs remain unavailable rather than being reported as connected. Conditional writes also prevent a concurrent provider activation from being overwritten, and switching an unverified provider clears its stale recipient mapping.
- Account-specific insurance exemption now governs both visible upload/checklist requirements and payment readiness. Other accounts keep their existing requirements.
- Welcome-email delivery markers no longer silently discard save errors, and dashboard links use the LMS origin.

- Career cards now open a holder-scoped job detail page instead of linking back to the feed. Feed/detail query failures display a retry state rather than claiming no opportunities exist.
- Career and phone pages explicitly retain the operational approval guard after pending onboarding was separated from the parent layout.
- Profile-authority insert protection normalizes legacy role aliases, including hyphens, whitespace and capitalization.

## Validation evidence and limits

The restored candidate passes the shared behavioral regression suite plus fourteen root-level behavioral tests (22 Node tests total), 91 related Vitest tests, scoped ESLint, and the portal routing contract audit. Full LMS typechecking and the production compilation passed for commit 2b02e25865a588c2e1097d8995718a089f72d178. The additional career/phone and role-alias repairs also passed a fresh production compilation and generated-route typecheck. The final payout-concurrency and onboarding refinements still require protected CI evidence; an earlier/local test result is not proof that production serves it.

Live database checks covered all 14 non-test holder records and confirmed all 24 holder document objects exist. Existing signed/approval flags were not fabricated. A missing profile backlink was repaired with an ownership-constrained update. No bank credentials were collected or stored.

The prepared profile-authority migration is independently tested with a temporary, rolled-back database fixture: ordinary profile edits succeed, role elevation and holder reassignment fail, and privileged self-provisioning fails. The role-alias rollback test also rejects mixed-case, spaced and hyphenated administrator aliases. The migration connector returned `Invalid or expired requestState` twice; the permanent trigger was not confirmed installed. This remains an explicit deployment/security gate, not a completed live repair.

Branch direct-deposit onboarding is not configured in the runtime secret store. A real organization/provider invitation or activation URL is still needed before banking setup can be verified end to end. No placeholder invitation or fabricated payout verification is supplied.
