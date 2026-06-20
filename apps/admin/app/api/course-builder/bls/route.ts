/**
 * BLS Occupational Data API
 * Free public data from Bureau of Labor Statistics
 * No API key required
 */

import { NextRequest, NextResponse } from 'next/server';

const BLS_API_BASE = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'occupations';
  const occupation = searchParams.get('occupation') || '29-1141';
  const area = searchParams.get('area') || '0000';

  try {
    switch (action) {
      case 'occupations':
        // Get occupation employment data
        const occRes = await fetch(
          `${BLS_API_BASE}OEU4000000001?startyear=2022&endyear=2024`,
          { signal: AbortSignal.timeout(10000) }
        );
        const occData = await occRes.json();
        return NextResponse.json({
          type: 'employment',
          source: 'Bureau of Labor Statistics',
          data: occData,
        });

      case 'wages':
        // Get wage data for occupation
        const wageRes = await fetch(
          `${BLS_API_BASE}SMU00000000000000001?startyear=2022&endyear=2024`,
          { signal: AbortSignal.timeout(10000) }
        );
        const wageData = await wageRes.json();
        return NextResponse.json({
          type: 'wages',
          source: 'Bureau of Labor Statistics',
          data: wageData,
        });

      case 'outlook':
        // Get occupational outlook (from O*NET/BLS projections)
        return NextResponse.json({
          type: 'outlook',
          source: 'Bureau of Labor Statistics',
          data: {
            message: 'Use O*NET for detailed outlook data',
            url: `https://www.onetcodeconnector.org/find/occupation?o=${occupation}`,
          },
        });

      case 'search':
        // Search occupations by keyword
        return NextResponse.json({
          type: 'search',
          source: 'Bureau of Labor Statistics',
          data: {
            message: 'Search via O*NET API',
            recommendation: 'Use /api/onet/careers?keyword=SEARCH_TERM',
          },
        });

      default:
        return NextResponse.json({
          available: true,
          endpoints: [
            'GET ?action=occupations - Employment data',
            'GET ?action=wages - Wage data',
            'GET ?action=outlook - Career outlook',
            'GET ?action=search - Search occupations',
          ],
          note: 'BLS API is free, no key required',
          attribution: 'Data from U.S. Bureau of Labor Statistics',
        });
    }
  } catch (error) {
    return NextResponse.json({ error: 'BLS API error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { occupationCode, years = 3 } = await request.json();

  try {
    // Get comprehensive BLS data for an occupation
    const seriesIds = [
      `OEU4000000001`, // Employment
      `SMU00000000000000001`, // Wages
    ];

    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: String(new Date().getFullYear() - years),
        endyear: String(new Date().getFullYear()),
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    return NextResponse.json({
      occupation: occupationCode,
      period: `${years} years`,
      data: data,
      attribution: 'U.S. Bureau of Labor Statistics',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch BLS data' }, { status: 500 });
  }
}