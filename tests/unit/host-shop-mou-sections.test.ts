import { describe, expect, it } from 'vitest';
import {
  getHostShopMouMeta,
  getHostShopMouSections,
} from '@/lib/partners/host-shop-mou-sections';

describe('host-shop-mou-sections', () => {
  it('returns the complete barber MOU with RAPIDS id in preamble', () => {
    const sections = getHostShopMouSections('barber');
    expect(sections).toHaveLength(14);
    expect(sections[12].title).toBe('13. New Host Shop Partnership Term and Protected Information');
    expect(sections[12].content).toContain('not a blanket prohibition on competition');
    expect(sections[13].title).toBe('14. Electronic Signature and Governing Records');
    expect(getHostShopMouMeta('barber').rapidsId).toBeTruthy();
    expect(sections[0].content).toContain('occupation 0030CB');
    expect(getHostShopMouMeta('barber').fullDocHref).toBe(
      '/docs/Indiana-Barbershop-Apprenticeship-MOU',
    );
  });

  it('returns the complete cosmetology MOU with salon wording', () => {
    const sections = getHostShopMouSections('cosmetology');
    expect(sections).toHaveLength(14);
    expect(sections[12].title).toBe('13. New Host Shop Partnership Term and Protected Information');
    expect(sections[12].content).toContain('not a blanket prohibition on competition');
    expect(sections[13].title).toBe('14. Electronic Signature and Governing Records');
    expect(getHostShopMouMeta('cosmetology').registered).toBe(false);
    expect(sections[0].content.toLowerCase()).toContain('salon');
  });
});
