# Cosmetology learner release and operational checks — October 28, 2026

## Verified production data
- Native course a6b0b712-1cf0-475a-ba79-ee2023dea8ec remains published, active, 52 weeks. All 40 native lessons retain approved media, published state, completed videos and assessments.
- All build jobs: 64 completed, six historical failures; no regeneration, deletion or reset.
- Logan Hood: 300.61 recorded OJL hours unchanged. Her new lesson release starts in original training week 9 and ends in week 52; 40 exact lesson overrides. Danielle: weeks 9–52; Amanda: weeks 7–52; Reese: weeks 5–52.
- Course/workbook dashboard notifications: four active, enrolled cosmetology apprentices each received one of each notice. Idempotency keys prevent repeats.
- The workbook has 40 sections. A bounded authenticated-role authorization test returned one assigned workbook, one currently released section, saving permission true, and totalWeeks 52 for Logan. This backend test is not browser sign-in or learner playback proof.
- Remaining RTI planning uses the existing 154-hour operational program requirement, less verified RTI, divided over remaining training weeks and rounded up to 15 minutes: Logan/Danielle/Amanda 210 minutes weekly; Reese 195. Maximum 600 minutes. OJL is not converted to theory credit.

## Actual defects and repairs
- Old dashboard schedules showed 20 hours maximum despite the activity tracker enforcing ten; exact cosmetology rows now show ten.
- Midnight–noon defaults are not treated as confirmed learner availability. Learners choose downtime windows within the assigned weekly budget.
- Scheduled access is staged behind course_pacing_plans.enforce_theory_schedule=false until the new LMS UI is actually deployed and checked. The feature flag must be enabled for this exact course after deployment, never before.
- New database checks cover row reads, direct URLs/APIs, credit writes and active-theory heartbeats. Signed admin course previews remain read-only.
- The Theory Timeclock requires explicit Start/Stop, measures actual server activity, pauses hidden/inactive pages, and supports natural video viewing plus linked workbook study. Saving completion awaits final clock submission; no fabricated minimum elapsed time is sent.
- Video pages expose a Go to lesson completion link. Assessment, seat-time, prerequisite and instructor sign-off gates remain.
- Workbook preview now resolves the selected signed admin-preview subject and scopes it to that subject's active program enrollment and released lessons. It never saves as that learner.
- Logan's failed QuickBooks records have no provider invoice IDs: failed invoice creation, not proof of failed student payments. Student invoice displays exclude those unissued failed drafts, preserving every underlying row.
- Logan's September 28 and October 20 incomplete, zero-hour progress records have no clock-out and no recent heartbeat. The timeclock already resolves current-day shifts; theory previously treated historical incomplete records as active forever. Shared live-OJL detection preserves current-day/recent/freshly seen shifts. Historical unresolved rows and hours are untouched.
- Weekly reminders reuse the existing five-minute job. Start/stop use confirmed availability; incomplete weekly theory gets a Sunday 6 PM reminder for the 11:59 PM deadline. Old unclaimed reminders for unconfirmed cosmetology defaults are held for review, not deleted.
- Notices state a one-hour lunch, excluded from training time, clock-out before leaving the site, the 15-minute geofence grace period, 40 OJL hours/week, ten theory hours maximum, and no simultaneous OJL/theory credit. Existing lunch/hour records are not rewritten.
- New prospective self-pay payment terms retain the repository's $10/day starting on overdue day four, change reactivation to $25, and flag instructional suspension at seven overdue days. Existing agreements, approved arrangements, funded/financed accounts and protected records are preserved. Actual autopay still requires the learner's signed release and provider agreement. This release does not manufacture mandates or charge any account.

## Source authority and remaining acceptance
The repository source index explicitly says Hair Stylist 0096HY V1 has operational RAPIDS configuration (154 RTI hours, hybrid 2,000–2,500-hour term) but is not modeled in the approved canonical Appendix A registry. Do not fabricate the missing signed standard or award official RTI credit from these planning settings. Federal 29 CFR 29.5(b)(4) allows approved electronic instruction; it does not impose a universal weekly theory maximum. The approved program delivery terms determine off-site credit eligibility.

Required before reporting completion:
1. Actual LMS/Admin builds, deployment and acceptance for this source.
2. Browser playback from the signed admin preview, workbook opening, and completion controls visible in the deployed UI.
3. Activate and read back the exact course's schedule enforcement only after the schedule editor is live.
4. Genuine learner-session playback acceptance remains separate from signed administrator previews.
5. Verify autopay mandates and provider activation per learner; do not claim automatic collection from an invoice row or configuration label.

