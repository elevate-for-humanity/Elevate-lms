import { APPRENTICE_TIME_POLICY } from '@/lib/timeclock/policy';

export function TimeclockAttendanceNotice() {
  return (
    <section
      aria-label="Required attendance rules"
      className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <h2 className="text-sm font-black">Clock out at the school before leaving</h2>
      <p className="mt-2 text-sm font-semibold leading-6">
        Clock in and clock out only at your approved school or assigned training site. Confirm that
        clock-out succeeded before leaving its perimeter. An off-site clock-out is blocked. Without
        an accepted on-site clock-out, your day’s hours are not automatically activated or credited;
        attendance must be reviewed before hours can be approved. Leaving the clock running while
        you are away does not earn training hours.
      </p>
      <p className="mt-2 text-sm leading-6">
        Use Start Lunch before your break and End Lunch when training resumes. Record lunch before
        leaving and after returning if you go off-site. Lunch is excluded from training hours.
        Weekly maximums are {APPRENTICE_TIME_POLICY.weeklyOjlMaxHours} OJL hours and{' '}
        {APPRENTICE_TIME_POLICY.weeklyCombinedMaxHours} combined OJL/RTI hours; follow any lower
        limit in your approved schedule.
      </p>
      <p className="mt-2 text-sm leading-6">
        If a clock action fails while you are onsite, contact your supervisor and Elevate
        immediately with the date, actual times, and error shown.
      </p>
    </section>
  );
}
