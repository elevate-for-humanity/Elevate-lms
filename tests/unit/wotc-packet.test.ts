import { afterEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { generateWotcPacket } from '@/lib/wotc/generate-packet';

async function template(pageCount: number) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) pdf.addPage([612, 792]);
  return pdf.save();
}

const input = {
  applicant: { firstName: 'Test', lastName: 'Applicant', ssnLast4: '1234' },
  employer: { name: 'Test Employer', ein: '12-3456789' },
  employment: { startDate: '2025-12-31', targetGroups: ['snap'] },
};

describe('historical WOTC packet generation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('combines the two official historical templates into a six-page packet', async () => {
    const [irs, eta] = await Promise.all([template(2), template(4)]);
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(irs, { status: 200 }))
      .mockResolvedValueOnce(new Response(eta, { status: 200 })));
    const result = await generateWotcPacket(input);
    const pdf = await PDFDocument.load(result);
    expect(pdf.getPageCount()).toBe(6);
    expect(pdf.getTitle()).toContain('Test Applicant');
  });

  it('rejects post-expiration hires before downloading templates', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateWotcPacket({ ...input, employment: { ...input.employment, startDate: '2026-01-01' } }))
      .rejects.toThrow('December 31, 2025');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
