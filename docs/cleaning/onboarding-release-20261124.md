# Janitorial partner onboarding repair

## Problem and corrections

The public cleaning application saves an applicant, but provider enrollment was
coupled to the paid-marketplace launch flag. New business accounts also followed
the learner dashboard into a paid-enrollment gate when entering community. The
program-holder form had no way to request janitorial scope review without naming
an unrelated published course. Generic holder approvals sent a Gary coordinator's
role and compensation to every applicant.

This repair:

- Allows a verified-email cleaning applicant to create a pending provider profile
  from their existing application, with their own rate, ZIP coverage, services and
  explicit email choice. It does not grant eligibility or import other people's
  applications. Existing reviewed providers retain the narrow rate-update path.
- Requires a signature-verified PKCE email magic-link session before every
  provider read or write. Production currently automatically confirms ordinary
  signup emails, so `email_confirmed_at` alone cannot prove mailbox ownership.
  The signed subject and email must match the current Auth user; password,
  signup, generic OTP/SMS, anonymous and forged sessions cannot claim a lead or
  read an existing provider's assignments. The person explicitly requests the
  email link and opens it in the same browser.
- Separates `cleaningProviderOnboardingEnabled` from `cleaningNetworkEnabled`.
  Booking, payment, offers and email dispatch retain the full commerce gate.
- Adds `prepareCleaningProviderOnboardingConfig(current, true)` for publishing
  only the provider enrollment page and optional application rate field after the
  matching renderer/API are live. It preserves unrelated pages and commerce state.
- Keeps authenticated general community outside the learner admission layout.
  Approved business roles retain their respective portals; student course access
  still requires the existing admission checks.
- Preserves safe return destinations across signup, verification, resend, OAuth
  and login. Public role selections record interest, not authority.
- Lets the Auth SDK finish its URL initialization before completing the callback,
  so a PKCE code consumed by automatic initialization is not redeemed twice.
- Keeps the employer application confirmation's resources link on the public
  employer information page, which is available before partnership approval.
- Restores the previously authored trusted-metadata profile trigger in a focused
  versioned migration. Public signup can supply a display name and requested role;
  only server-managed metadata grants a role or tenant. The migration refuses an
  unreviewed function definition and does not rewrite existing profiles.
- Captures a Janitorial / Building Services Technician program-holder request as
  `requested_program_interest: janitorial`, separate from learner program slugs.
  Approval requires an actual active program link before account/role provisioning.
- Sends role-appropriate generic approval instructions. Gary's custom notice is
  used only for an explicitly assigned Gary site coordinator; its compensation is
  never applied to an ordinary Program Holder.

## Program and payment boundary

The commercial-cleaning course, building-maintenance classroom program and
Building Services Technician apprenticeship are distinct records. This repair
does not alias them, create an active learner program, assert funding eligibility,
or replace the signed apprenticeship standards. Scope review must reconcile the
canonical program record, approved delivery and applicable agreement first.

The executed individual agreement and addenda govern compensation. The current
signing flow presents participation tiers with cohort-based hosting terms or a
student referral fee; a separate legacy admin download still describes a
per-student midpoint/completion model. These are not interchangeable offers.
This repair does not select a participation tier or set a janitorial rate.
The janitorial agreement must specify the per-student amount or calculation,
qualifying milestones, funding conditions and payment timing before training
begins. Subcontractor job payments are separate.

## Production checks before an invitation claims complete readiness

1. Pass required exact-commit CI, protected merge and affected Google releases.
   Verify the marketing, LMS and Admin runtime SHA/revision against the release.
2. After the migration commit is contained in `main`, apply only the reviewed
   auth-profile migration through the supervised production migration process.
   Verify the recorded migration and hardened function definition. Do not run
   unrelated pending migrations as a side effect of this repair.
   The official apply-migration API may assign a different history timestamp:
   record the source commit, source SQL SHA-256, actual remote version/name,
   stored-statement fingerprint, resulting function definition and privileges.
   Do not rewrite migration history or replay old migrations to force timestamps
   to match.
3. Preserve the current tenant configuration/revision. Apply only the provider
   onboarding helper after its source is live; do not turn on paid commerce as an
   incidental consequence of enabling applications.
4. Verify the Supabase Auth redirect allowlist and existing application lookup,
   verified-email account return, pending
   provider profile, consent, and community access in the authenticated browser.
   Use authorized test identities; do not create a real applicant's account or
   agree to their terms on their behalf.
   The existing main-only OAuth audit now reads the managed Auth settings with
   sanitized callback patterns, mail configuration presence and magic-link
   template checks. Its read-only report does not prove actual mail receipt or
   successful login; verify those through the real PKCE flow. Administrative
   `generateLink` plus `verifyOtp` produces a generic OTP session and must not be
   substituted for the required email-specific PKCE proof.
5. Complete the paid-marketplace gates in `marketplace-release.md` before enabling
   job offers: actual provider review, payment/invoice/webhook/worker evidence and
   approved end-to-end transaction, email receipt, acceptance and ledger checks.
6. Confirm a provider accepts a job's stated date/time. This is not permission to
   arbitrarily change a customer's schedule. No jobs or income are guaranteed.

Do not send a complete-readiness invitation merely because tests or source review
pass. No provider approval, job transaction or real email receipt is created by
this patch.
