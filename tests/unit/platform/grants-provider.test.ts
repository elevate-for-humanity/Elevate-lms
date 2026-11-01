import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchOpportunities, getOpportunityDetails } from '@/lib/integrations/grants-gov';
import { grantDate, grantRecord, visibleGrantRecords } from '@/lib/apps/workspaces/grants';
afterEach(() => vi.unstubAllGlobals());
describe('Grants.gov public API contract', () => {
  it('preserves provider calendar dates and rejects impossible deadlines',()=>{
    expect(grantDate('12/31/2099')).toBe('2099-12-31');
    expect(grantDate('2099-12-31')).toBe('2099-12-31');
    expect(grantDate('2/29/2028')).toBe('2028-02-29');
    expect(grantDate('2/29/2027')).toBeNull();
    expect(grantDate('2099-13-01')).toBeNull();
  });
  it('uses Search2 without transmitting credentials and reads its nested data envelope', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          errorcode: 0,
          data: {
            hitCount: 1,
            oppHits: [
              {
                id: '123456',
                number: 'DOL-TEST',
                title: 'Fixture grant',
                agencyName: 'Department of Labor',
                agencyCode: 'DOL',
                oppStatus: 'posted',
                closeDate: '12/31/2099',
                alnist: ['17.001'],
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetcher);
    const result = await searchOpportunities({
      keyword: 'workforce',
      oppStatuses: ['posted', 'forecasted'],
      eligibilities: ['01', '02'],
    });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('https://api.grants.gov/v1/api/search2');
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(JSON.parse(options.body)).toMatchObject({
      oppStatuses: 'posted|forecasted',
      eligibilities: '01|02',
      sortBy: 'closeDate|asc',
    });
    expect(result.totalCount).toBe(1);
    expect(grantRecord(result.opportunities[0])).toMatchObject({
      external_id: 'grants-gov:123456',
      due_date: '2099-12-31',
      agency_name: 'Department of Labor',
      status: 'open',
    });
  });
  it('uses fetchOpportunity and normalizes the published detail fields', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          errorcode: 0,
          data: {
            id: 123456,
            opportunityNumber: 'DOL-TEST',
            opportunityTitle: 'Fixture grant',
            synopsis: {
              agencyName: 'DOL',
              awardCeiling: '100,000',
              applicantTypes: [{ description: 'Nonprofits' }],
              synopsisDesc: 'Official detail',
            },
          },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetcher);
    const result = await getOpportunityDetails('123456');
    expect(fetcher.mock.calls[0][0]).toContain('/fetchOpportunity');
    expect(result?.award?.ceiling).toBe(100000);
    expect(result?.synopsis?.applicantTypes).toEqual(['Nonprofits']);
  });
  it('reports provider failures instead of presenting them as an empty successful search', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })));
    await expect(searchOpportunities({ keyword: 'workforce' })).rejects.toThrow('unavailable');
  });
  it('rejects an unexpected successful response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorcode: 0, data: {} }))),
    );
    await expect(searchOpportunities({})).rejects.toThrow('invalid search response');
  });
  it('does not present expired cached grants as open opportunities', () => {
    expect(
      visibleGrantRecords(
        [
          { id: 'old', due_date: '2020-01-01' },
          { id: 'current', deadline: '2099-01-01' },
          { id: 'rolling' },
        ],
        '2026-10-31',
      ).map((row) => row.id),
    ).toEqual(['current', 'rolling']);
  });
});
