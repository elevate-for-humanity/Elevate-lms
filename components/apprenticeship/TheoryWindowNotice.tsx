import Link from 'next/link';
export function TheoryWindowNotice({ access }: { access: any }) {
  if (!access) return null;
  const reason =
    access.reason === 'SCHEDULE_REQUIRED'
      ? 'Choose your available study times before starting theory.'
      : access.reason === 'WEEKLY_THEORY_LIMIT_REACHED'
        ? 'Your weekly theory allowance is complete. Return during your next eligible week.'
        : access.reason === 'OJL_OVERLAP'
          ? 'Clock out of OJL before starting theory.'
          : 'Theory is available only during your scheduled study blocks.';
  return (
    <section
      aria-label="Theory access schedule"
      className="my-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"
    >
      <h2 className="text-xl font-black">
        {access.allowed ? 'Your weekly theory allowance' : 'Your theory window is closed'}
      </h2>
      <p className="mt-2">
        Target: {Number(access.weeklyTargetMinutes || 0) / 60} hours · Maximum:{' '}
        {Number(access.weeklyMaxMinutes || 600) / 60} hours this week. Active time recorded:{' '}
        {(Number(access.weeklyActiveSeconds || 0) / 3600).toFixed(2)} hours.
      </p>
      <p className="mt-2">
        {!access.allowed
          ? reason
          : 'Follow your saved study windows and assigned lesson releases. Do not try to complete the full course in one sitting.'}
      </p>
      <p className="mt-2">
        Finish assigned weekly work by Sunday at 11:59 PM ({access.timezone}). Theory and OJL hours
        cannot overlap. These are program scheduling limits; recorded activity still requires
        applicable RTI verification.
      </p>
      {!access.allowed && access.nextOpensAt && access.scheduled ? (
        <p className="mt-2">
          Next scheduled block:{' '}
          {new Date(access.nextOpensAt).toLocaleString('en-US', { timeZone: access.timezone })}.
        </p>
      ) : null}
      <Link
        href="/apprentice/theory-schedule"
        className="mt-3 inline-flex rounded-lg bg-amber-950 px-4 py-3 font-bold text-white"
      >
        My theory schedule and timeclock plan
      </Link>
    </section>
  );
}
