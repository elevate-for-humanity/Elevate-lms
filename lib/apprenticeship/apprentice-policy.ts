import { APPRENTICE_TIME_POLICY } from '@/lib/timeclock/policy';

export const APPRENTICE_POLICY_VERSION = '2026.09.21';

export const APPRENTICE_POLICY_KEYS = {
  timeclock: 'apprentice_timeclock_geofence_policy',
  payment: 'apprentice_payment_communication_policy',
} as const;

export type ApprenticePolicyKey =
  (typeof APPRENTICE_POLICY_KEYS)[keyof typeof APPRENTICE_POLICY_KEYS];

export const APPRENTICE_TIMECLOCK_RULES = [
  'Clock in only after you arrive at your approved Host Shop or job site and your device confirms you are inside its geofence.',
  'Clock out before you leave the approved geofence. Do not wait until you are driving or already home.',
  `If you remain outside the geofence for ${APPRENTICE_TIME_POLICY.outsideGeofenceGraceMinutes} continuous minutes, the system may automatically clock you out. No time after that clock-out is accepted.`,
  'If the app will not clock you out while you are still onsite, take a screenshot and contact Elevate and your supervisor immediately. Include the date, clock-in time, and actual clock-out time.',
  `OJL/hands-on work is limited to ${APPRENTICE_TIME_POLICY.weeklyOjlMaxHours} hours per week.`,
  `Theory/RTI has a ${APPRENTICE_TIME_POLICY.weeklyTheoryTargetHours}-hour weekly target and a ${APPRENTICE_TIME_POLICY.weeklyTheoryMaxHours}-hour weekly maximum.`,
  `Combined OJL and RTI may not exceed ${APPRENTICE_TIME_POLICY.weeklyCombinedMaxHours} hours per week, and the two types of time may not overlap.`,
] as const;

export const APPRENTICE_PAYMENT_RULES = [
  'Make every tuition payment by the due date shown in your signed enrollment or payment agreement.',
  'If you are having a payment problem, call Elevate before the due date and communicate the reason. Keep responding until a documented arrangement is confirmed.',
  'Calling does not erase the balance, and a payment arrangement is not approved until Elevate confirms it.',
  'Do not ignore calls or notices, and do not stop paying without communication.',
  'When a payment is missed and there is no communication or approved arrangement, the signed enrollment agreement will be enforced. Access may be restricted and the apprentice may be exited from the program for nonpayment.',
  'Previously approved records remain in the apprentice record; payment enforcement does not create or erase training hours.',
] as const;
