import {describe,expect,it} from 'vitest';
import {getFeaturedHostPartnerBySlug} from '@/lib/apprenticeship-programs/host-partners';
describe('published host shop social lookup',()=>{
  it.each([
    ['cals-kutz-studio-cb30517f','cals-kutz-studio'],
    ['kountry-kutz-barbershop-7d222e31','kountry-kutz-barbershop'],
    ['generations-hair-llc-dba-generations-wedding-co-6937ee7a','generations-hair-llc'],
    ['style-and-scissors-salon-65cdd03c','style-and-scissor-salon'],
    ['b-52-s-barber-shop-llc-183dd1d7','b-52s-barber-shop'],
  ])('resolves %s to the same shop', (publicSlug,slug)=>{
    expect(getFeaturedHostPartnerBySlug(publicSlug)?.slug).toBe(slug);
  });
  it('uses Calvin’s supplied Instagram handle',()=>{
    expect(getFeaturedHostPartnerBySlug('cals-kutz-studio-cb30517f')?.socialUrl).toBe('https://www.instagram.com/cal_kutz/');
  });
  it('does not attach another shop to an unknown slug',()=>{
    expect(getFeaturedHostPartnerBySlug('unknown-studio-12345678')).toBeUndefined();
  });
});
