import { describe, expect, it } from 'vitest';
import {
  getHostShopMouMeta,
  getHostShopMouSections,
} from '@/lib/partners/host-shop-mou-sections';

describe('host-shop-mou-sections', () => {
  it('returns ten barber MOU sections with RAPIDS id in preamble', () => {
    const sections = getHostShopMouSections('barber');
    expect(sections).toHaveLength(10);
    expect(sections[0].content).toContain('2025-IN-132301');
    expect(getHostShopMouMeta('barber').fullDocHref).toBe(
      '/docs/Indiana-Barbershop-Apprenticeship-MOU',
    );
  });

  it('returns ten cosmetology MOU sections with salon wording', () => {
    const sections = getHostShopMouSections('cosmetology');
    expect(sections).toHaveLength(10);
    expect(sections[0].content).toContain('2025-IN-132302');
    expect(sections[0].content.toLowerCase()).toContain('salon');
  });
});
