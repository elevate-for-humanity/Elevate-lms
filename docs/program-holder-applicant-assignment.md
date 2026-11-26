# Program-holder applicant assignment

## Why this exists

There was no way in the admin to assign student applications to a Program
Holder. The Applications page only offered Enroll (which creates a direct
Elevate enrollment — it cannot place anyone with a holder, and during testing
it created a mistaken "Unknown Course" enrollment for one applicant), review,
or reject. The Referrals page is inbound agency referrals only. The holder
record had no assign control at all. That is why the 50 CNA referrals for
Achieve Training Institute sat at 0 assigned.

There were two further blockers underneath:

1. **The automatic router excluded Achieve.** The database trigger
   `route_application_to_program_holder_v1()` only routes applications to
   holders whose status is `active` or `approved`. Achieve is
   `approved_pending_mou` — approved, only the MOU signature outstanding —
   so the trigger silently skipped her. The migration in this PR admits
   approved-pending-MOU holders in an owner role. Coordinators (for example
   Top Ace Solutions, pending MOU, role coordinator) are still excluded by
   the unchanged role filter.
2. **The holder portal hid assigned applicants.** The workspace only lists
   assigned applicants when the holder has `features.recruiting_enabled`.
   Achieve's features never set it, so even routed rows would have shown
   nothing. The assign route turns recruiting on for the holder on the first
   assignment, so Nicole sees the assigned applicants in Assigned
   Applications / Students → Pending.

## The batch rule (reviewable, never random)

`lib/program-holder/applicant-assignment.ts` is the single source of truth:

- Candidates are applications for the holder's program (program id, slug, or
  interest), any status.
- Order is earliest-submitted first (`created_at` ascending, `id` as the
  tiebreak).
- Deduplicated by applicant: same user id, same email, or same name (+ phone)
  counts as one person; the earliest application wins and the rest are
  reported as duplicates. The live CNA list contains the same person twice
  under different emails, which is why name is part of the identity.
- Excluded, with a reason each: revoked applications, non-assignable
  statuses (rejected, withdrawn, enrolled, …), applications already
  projected to any holder, applicants already enrolled in the program.
- The admin previews the exact list (names, emails, applied dates, skip
  counts) before anything is applied.

Assignment writes `program_holder_students` rows (status `applied`, label
`Elevate-assigned referral`) — the same table the holder portal already
reads. It does not enroll anyone and does not touch the application itself.

## Capacity flag — read before releasing the 50

Nicole's January–February CNA capacity is 36 students (4 sections × 9).
Elizabeth directed all 50 CNA applicants to Achieve now. **50 exceeds the
36-seat capacity.** The route reports `assigned_total_for_holder` so the
admin can see the total, but it does not cap the batch: capping silently
would drop applicants nobody chose to drop, and expanding capacity is
Nicole's call, not the code's. Confirm with Elizabeth (and Nicole) whether
the 50 should all go to Achieve now, or whether the batch should stop at 36
with the rest held for the next cohort.

The January split with Enchanted Hearts Training applies to NEW applicants
coming in January, not to this batch. Routing new applications between two
holders needs a split rule (for example by county or by cohort) — that is
future work, not in this PR. Until then, new CNA applications route to the
primary owner under the trigger below.

## The migration — test in QA first

`supabase/migrations/20261124000000_program_holder_applicant_routing_approved_pending_mou.sql`
only replaces `route_application_to_program_holder_v1()` with the admitted
status. It does **not** backfill anything and deliberately does **not**
change `sync_program_holder_assignment_applicants_v1()`: that backfill
assigns every application for the program at once, with no batch cap, and
the admin assign route is the controlled path for a reviewed batch.

Apply it to `elevate-lms-qa` first, verify the flow below there, and only
then apply to production. Do not merge this PR until the migration has been
tested in QA.

## Admin steps after merge + deploy

1. Open the Achieve holder record in the admin
   (`/program-holders/acc9f5ab-8804-432e-9b12-aac1a6c86426`).
2. In **Assign applicants**, pick the CNA program (default), leave the batch
   size at 50, and click **Preview the batch**. Check the names, applied
   dates, and skip counts. Confirm the capacity question above first.
3. Click **Assign the previewed batch**. The panel reports how many were
   assigned.
4. Verify in the holder portal (open the Program Holder portal preview):
   Nicole's Assigned Applications shows the same 50, with names, emails,
   and phones.
5. If the trigger migration is live, new CNA applications from this point
   route to Achieve automatically. If a preview ever looks wrong, do not
   apply it — the dry run writes nothing.
