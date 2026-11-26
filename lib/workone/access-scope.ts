/**
 * WorkOne external-access scope.
 *
 * WorkOne staff are trained on the Admin WorkOne dashboards
 * (/workone-queue, /referrals, /surveys/workone). They must only ever
 * see NEW applicants — people who applied on or after the day WorkOne
 * access began — never the pre-existing applicant backlog.
 *
 * There is no WorkOne-specific role, user, tenant, or referral-partner
 * linkage in the data (verified 2026-11-25: profiles have no 'workone'
 * role, workforce_referrals carry no WorkOne agency tagging), so the
 * scope is anchored to this access-start timestamp. Every WorkOne-facing
 * Admin query MUST filter `created_at >= WORKONE_ACCESS_START_ISO`.
 *
 * To move the start (e.g. include applicants from an earlier agreed
 * date), change this one constant — do not remove the filters.
 */
export const WORKONE_ACCESS_START_ISO = '2026-12-03T00:00:00.000Z';
