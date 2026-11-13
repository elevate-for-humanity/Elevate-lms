import { describe, expect, it } from 'vitest';
import { INDIANAPOLIS_PROGRAM_HUBS } from '@/data/seo/indianapolis-program-hubs';
import { renderToStaticMarkup } from 'react-dom/server';
import WorkforceTrainingIndianapolisPage, { metadata } from '@/apps/marketing/app/workforce-training-indianapolis/page';

describe('Indianapolis program+city SEO hubs', () => {
  it('has unique slugs and canonical paths', () => {
    const slugs = INDIANAPOLIS_PROGRAM_HUBS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const hub of INDIANAPOLIS_PROGRAM_HUBS) {
      expect(hub.slug).toMatch(/-indianapolis$/);
      expect(hub.metadata.title.length).toBeGreaterThan(10);
      expect(hub.faqs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('provides the workforce hub referenced by every program breadcrumb', () => {
    const html = renderToStaticMarkup(WorkforceTrainingIndianapolisPage());
    expect(html).toContain('Workforce Training in Indianapolis');
    for (const hub of INDIANAPOLIS_PROGRAM_HUBS) expect(html).toContain(`href="/${hub.slug}"`);
    expect(metadata.alternates?.canonical).toBe('https://www.elevateforhumanity.org/workforce-training-indianapolis');
  });

  it('does not restore superseded funding or guaranteed wage claims', () => {
    const cna = INDIANAPOLIS_PROGRAM_HUBS.find(hub => hub.slug === 'cna-training-indianapolis')!;
    expect(cna.funding.paragraphs.join(' ')).toContain('self-pay');
    expect(cna.trustBadges.map(badge => badge.label)).not.toContain('ETPL Approved Provider');
    const cdl = INDIANAPOLIS_PROGRAM_HUBS.find(hub => hub.slug === 'cdl-training-indianapolis')!;
    expect(cdl.funding.bullets).not.toContain('WIOA ITA');
    const barber = INDIANAPOLIS_PROGRAM_HUBS.find(hub => hub.slug === 'barber-apprenticeship-indianapolis')!;
    expect(barber.funding.paragraphs.join(' ')).toContain('self-pay');
    expect(barber.funding.bullets).not.toContain('Paid OJT from day one at the shop');
  });
});
