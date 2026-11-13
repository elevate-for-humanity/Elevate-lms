import { describe, expect, it } from 'vitest';
import {
  hostShopStudentPrograms,
  hostShopStudentApplicationUrl,
} from '@/lib/partners/host-shop-student-links';

describe('Host Shop student application links', () => {
  it('limits each shop to its explicit assigned occupations', () => {
    expect(hostShopStudentPrograms({ program_type: 'barber' })).toEqual(['barber-apprenticeship']);
    expect(
      hostShopStudentPrograms({
        programs: ['esthetician', 'nail_technician'],
        partner_type: 'salon',
      }),
    ).toEqual(['esthetician-apprenticeship', 'nail-technician-apprenticeship']);
    expect(hostShopStudentPrograms({ programs: ['hvac-technician'] })).toEqual([]);
    expect(hostShopStudentPrograms({})).toEqual([]);
  });
  it('preserves the occupation and referring shop in direct and copied links', () => {
    const url = new URL(hostShopStudentApplicationUrl('cosmetology-apprenticeship', 'shop-id'));
    expect(url.pathname).toBe('/apply/student/form');
    expect(url.searchParams.get('program')).toBe('cosmetology-apprenticeship');
    expect(url.searchParams.get('host_shop')).toBe('shop-id');
  });
});
