import { loadTraffic } from '@/lib/analytics/traffic.mjs';

export default async function TrafficReports({
  hostnames = null,
}: {
  hostnames?: string[] | null;
}) {
  const result = await loadTraffic(hostnames);
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Analytics Traffic</h1>
        <p className="text-sm text-slate-600">
          Google Analytics · Last 30 complete days · Reports may be delayed.
        </p>
      </div>
      {result.error ? (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          {result.error}
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {result.reports.map(
            (report: { title: string; rows: { label: string; value: number }[] }) => (
              <div key={report.title} className="rounded-xl border bg-white p-5">
                <h2 className="mb-4 font-bold">{report.title}</h2>
                {report.rows.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left">
                            {report.title === 'Most viewed pages'
                              ? 'Page'
                              : report.title === 'Traffic sources'
                                ? 'Source / medium'
                                : 'Country / city'}
                          </th>
                          <th className="text-right">
                            {report.title === 'Most viewed pages'
                              ? 'Views'
                              : report.title === 'Traffic sources'
                                ? 'Sessions'
                                : 'Active users'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.rows.map((row: { label: string; value: number }) => (
                          <tr key={row.label} className="border-t">
                            <td className="break-all py-3 pr-3">{row.label}</td>
                            <td className="text-right">{row.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No traffic recorded for this period.</p>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
