import { APPRENTICE_TIME_POLICY } from '@/lib/timeclock/policy';

export const APPRENTICE_POLICY_VERSION = '2026-10-28';

export const APPRENTICE_POLICY_KEYS = {
  timeclock: 'apprentice_timeclock_geofence_policy',
  payment: 'apprentice_payment_communication_policy',
} as const;

export type ApprenticePolicyKey =
  (typeof APPRENTICE_POLICY_KEYS)[keyof typeof APPRENTICE_POLICY_KEYS];

export const APPRENTICE_TIMECLOCK_RULES = [
  'Clock in only after you arrive at your approved Host Shop or job site and your device confirms you are inside its geofence.',
  'Clock out before you leave the approved geofence. Do not wait until you are driving or already home.',
  "An off-site clock-out is blocked. Without an accepted on-site clock-out, your day's hours are not automatically activated or credited; attendance must be reviewed before hours can be approved. Leaving the clock running while away does not earn training hours.",
  'Take a one-hour lunch each training day. Use Start Lunch before the break and End Lunch when training resumes. Record lunch before leaving and after returning if you go off-site. Lunch does not count toward daily or weekly training hours. Record actual times; missing or incorrect lunch records require review.',
  `If you remain outside the geofence for ${APPRENTICE_TIME_POLICY.outsideGeofenceGraceMinutes} continuous minutes, the system may automatically clock you out. No time after that clock-out is accepted.`,
  'If the app will not clock you out while you are still onsite, take a screenshot and contact Elevate and your supervisor immediately. Include the date, clock-in time, and actual clock-out time.',
  `OJL/hands-on work is limited to ${APPRENTICE_TIME_POLICY.weeklyOjlMaxHours} hours per week.`,
  `Your individual theory plan shows your weekly target; the default is ${APPRENTICE_TIME_POLICY.weeklyTheoryTargetHours} hours and the maximum is ${APPRENTICE_TIME_POLICY.weeklyTheoryMaxHours} hours. Follow any lower assigned limit. An approved catch-up plan may adjust the target without creating training credit.`,
  `Combined OJL and RTI may not exceed ${APPRENTICE_TIME_POLICY.weeklyCombinedMaxHours} hours per week, and the two types of time may not overlap.`,
] as const;

export const APPRENTICE_PAYMENT_RULES = [
  "New self-pay internal payment plans require a payment method with the secure payment provider, a signed recurring-payment authorization, and the learner's approval of the provider billing agreement. An invoice alone does not activate automatic withdrawal.",
  'Make every tuition payment by the due date shown in your signed enrollment or payment agreement.',
  'If you are having a payment problem, call Elevate before the due date and communicate the reason. Keep responding until a documented arrangement is confirmed.',
  'Calling does not erase the balance, and a payment arrangement is not approved until Elevate confirms it.',
  'Do not ignore calls or notices, and do not stop paying without communication.',
  'When a payment is missed and there is no communication or approved arrangement, the signed enrollment agreement will be enforced. Access may be restricted and the apprentice may be exited from the program for nonpayment.',
  'Previously approved records remain in the apprentice record; payment enforcement does not create or erase training hours.',
  'For new self-pay internal agreements that include the October 28, 2026 terms: a three-calendar-day grace period applies. A $10 daily late fee starts on the fourth overdue day. At seven days overdue, eligible instructional access is suspended under the signed agreement; a one-time $25 reactivation fee applies to resume that suspended access after payment is resolved.',
  'Existing signed terms, approved arrangements, funding, and external financing continue to govern their own payments. Billing, support, wages, timekeeping and required training records remain accessible. Invoice-sync errors are not failed student payments.',
] as const;
