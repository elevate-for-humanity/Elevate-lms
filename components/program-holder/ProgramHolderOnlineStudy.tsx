export function ProgramHolderOnlineStudy({
  sessions,
  enrollments,
}: {
  sessions: any[];
  enrollments: any[];
}) {
  return (
    <section
      aria-label="Hands-on training clock records"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-black">Hands-on training clock records</h2>
      <p className="mt-2 text-sm text-slate-600">
        These are saved HVAC hands-on clock-in and clock-out sessions. Students do not use
        a manual clock for online theory. Open sessions and unverified time do not count as approved
        hours. Elevate staff verify attendance in Admin.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3">Student</th>
              <th className="p-3">Clock in</th>
              <th className="p-3">Clock out</th>
              <th className="p-3">Verified hours</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length ? (
              sessions.map((session) => {
                const attendance = Array.isArray(session.attendance_hours)
                  ? session.attendance_hours[0]
                  : session.attendance_hours;
                return (
                  <tr key={session.id} className="border-b">
                    <td className="p-3">
                      {enrollments.find((row) => row.id === session.enrollment_id)?.full_name ||
                        'Student'}
                    </td>
                    <td className="p-3">
                      <time dateTime={session.clock_in_at}>{session.clock_in_at}</time>
                    </td>
                    <td className="p-3">
                      {session.clock_out_at ? (
                        <time dateTime={session.clock_out_at}>{session.clock_out_at}</time>
                      ) : (
                        'Still clocked in'
                      )}
                    </td>
                    <td className="p-3">
                      {session.clock_out_at && attendance?.verified === true
                        ? Number(attendance.hours_logged || 0).toFixed(2)
                        : '—'}
                    </td>
                    <td className="p-3">
                      {!session.clock_out_at
                        ? 'Open session'
                        : attendance?.verified === true
                          ? 'Verified by staff'
                          : 'Pending staff verification'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-slate-500">
                  No hands-on training clock sessions recorded for this roster.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
