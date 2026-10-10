export function trafficRequests(hostnames = null) {
  if (hostnames !== null && (!Array.isArray(hostnames) || !hostnames.length))
    throw new Error('No verified website scope');
  const base = {
    dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
    limit: '20',
    ...(hostnames
      ? {
          dimensionFilter: {
            filter: { fieldName: 'hostName', inListFilter: { values: hostnames } },
          },
        }
      : {}),
  };
  return [
    { title: 'Most viewed pages', dimensions: ['hostName', 'pagePath'], metric: 'screenPageViews' },
    {
      title: 'Traffic sources',
      dimensions: ['sessionSource', 'sessionMedium'],
      metric: 'sessions',
    },
    { title: 'Visitor locations', dimensions: ['country', 'city'], metric: 'activeUsers' },
  ].map(({ title, dimensions, metric }) => ({
    title,
    body: {
      ...base,
      dimensions: dimensions.map((name) => ({ name })),
      metrics: [{ name: metric }],
      orderBys: [{ metric: { metricName: metric }, desc: true }],
    },
  }));
}
export async function loadTraffic(hostnames = null) {
  const property = process.env.GA4_PROPERTY_ID;
  if (!property || !/^\d+$/.test(property))
    return { error: 'Google Analytics reporting is not connected yet.', reports: [] };
  try {
    const { auth: googleAuth } = await import('googleapis/build/src/apis/analyticsdata/index.js');
    const auth = new googleAuth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const client = await auth.getClient();
    const requests = trafficRequests(hostnames);
    const reports = await Promise.all(
      requests.map(async ({ title, body }) => {
        const response = await client.request({
          url: `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`,
          method: 'POST',
          data: body,
          timeout: 15000,
        });
        return {
          title,
          rows: (response.data.rows || []).map((row) => ({
            label: row.dimensionValues.map((v) => v.value).join(' / '),
            value: Number(row.metricValues[0].value),
          })),
        };
      }),
    );
    return { reports, error: null };
  } catch (error) {
    console.error(
      'GA4 traffic reporting failed',
      error?.response?.status || error?.code || 'unknown',
    );
    return {
      error:
        'Google Analytics reports are temporarily unavailable. Please contact your administrator.',
      reports: [],
    };
  }
}
