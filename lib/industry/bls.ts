/**
 * lib/industry/bls.ts
 *
 * Bureau of Labor Statistics (BLS) Public Data API v2 client.
 *
 * Fetches OES wage data by SOC code using the OEUN (OES National) series.
 * Free API key: https://data.bls.gov/registrationEngine/
 * Set BLS_API_KEY in environment (optional — unregistered allows 25 req/day).
 *
 * OEUN series format (25 chars total):
 *   OEUN                  — 4 chars, OES National
 *   000000000000          — 12 chars, all industries
 *   0{6-digit-SOC}0       — 8 chars, SOC without hyphen/dot, right-padded to 7, prepend '0'
 *   {N}                   — 1 char, data type
 *
 * Data types (single digit):
 *   1 = employment count
 *   3 = median hourly wage
 *   4 = median annual wage
 *   6 = 10th percentile hourly (entry level)
 *   9 = 75th percentile hourly (experienced proxy)
 *
 * Employment projections are not available via the BLS public API.
 * Use CareerOneStop job postings count as a proxy for demand.
 *
 * Docs: https://www.bls.gov/developers/api_signature_v2.htm
 */

const BASE = 'https://api.bls.gov/publicAPI/v2';

export interface BlsWageData {
  soc_code: string;
  median_annual_wage: number | null;
  entry_wage: number | null; // 10th percentile annual (derived from hourly * 2080)
  experienced_wage: number | null; // 75th percentile annual (derived from hourly * 2080)
  employment_count: number | null;
  year: number;
}

export interface BlsProjectionData {
  soc_code: string;
  employment_2022: number | null;
  employment_2032: number | null;
  projected_growth_pct: number | null;
  projected_growth_cat: string | null;
  projected_openings: number | null;
  median_annual_wage: number | null;
  typical_education: string | null;
}

export interface BlsOccupationData {
  wages: BlsWageData;
  projections: BlsProjectionData;
}

/**
 * Convert SOC code '49-9021.00' → 8-char OEUN occupation segment '04990210'.
 * Formula: strip hyphen/dot → right-pad to 7 digits → prepend '0'.
 */
function socToOeunSegment(socCode: string): string {
  const digits = socCode.replace(/[-.]/g, '').slice(0, 6); // e.g. '499021'
  const padded = digits.padEnd(7, '0'); // e.g. '4990210'
  return '0' + padded; // e.g. '04990210'
}

function oeunSeries(socCode: string, dataType: string): string {
  return `OEUN000000000000${socToOeunSegment(socCode)}${dataType}`;
}

async function blsPost(seriesIds: string[]): Promise<any> {
  const body: Record<string, unknown> = {
    seriesid: seriesIds,
    startyear: '2023',
    endyear: '2024',
  };
  if (process.env.BLS_API_KEY) {
    body.registrationkey = process.env.BLS_API_KEY;
  }

  const res = await fetch(`${BASE}/timeseries/data/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`BLS API ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API error: ${JSON.stringify(json.message)}`);
  }
  return json;
}

function extractLatestValue(series: any): number | null {
  const data = series?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const val = parseFloat(data[0]?.value ?? '');
  return isNaN(val) ? null : val;
}

/** Fetch OES wage data for a SOC code from BLS national estimates. */
export async function fetchBlsWages(socCode: string): Promise<BlsWageData> {
  const ids = [
    oeunSeries(socCode, '1'), // employment count
    oeunSeries(socCode, '4'), // median annual wage
    oeunSeries(socCode, '6'), // 10th pct hourly (entry)
    oeunSeries(socCode, '9'), // 75th pct hourly (experienced proxy)
  ];

  try {
    const data = await blsPost(ids);
    const byId: Record<string, any> = {};
    for (const s of data?.Results?.series ?? []) byId[s.seriesID] = s;

    const entryHourly = extractLatestValue(byId[ids[2]]);
    const experiencedHourly = extractLatestValue(byId[ids[3]]);

    return {
      soc_code: socCode,
      employment_count: extractLatestValue(byId[ids[0]]),
      median_annual_wage: extractLatestValue(byId[ids[1]]),
      entry_wage: entryHourly != null ? Math.round(entryHourly * 2080) : null,
      experienced_wage: experiencedHourly != null ? Math.round(experiencedHourly * 2080) : null,
      year: 2024,
    };
  } catch {
    return {
      soc_code: socCode,
      median_annual_wage: null,
      entry_wage: null,
      experienced_wage: null,
      employment_count: null,
      year: 2024,
    };
  }
}

/**
 * BLS does not expose employment projections via its public API.
 * Returns null fields — callers use CareerOneStop job counts instead.
 */
export async function fetchBlsProjections(socCode: string): Promise<BlsProjectionData> {
  return {
    soc_code: socCode,
    employment_2022: null,
    employment_2032: null,
    projected_growth_pct: null,
    projected_growth_cat: null,
    projected_openings: null,
    median_annual_wage: null,
    typical_education: null,
  };
}

export function isBlsConfigured(): boolean {
  return true; // works without API key at 25 req/day
}
