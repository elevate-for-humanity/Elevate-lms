/** Canonical public paths shared by desktop/mobile navigation and trade directories. */
export const BEAUTY_TRADES = [
  {
    key: 'barber',
    label: 'Barber',
    title: 'Barber Apprenticeship',
    programSlug: 'barber-apprenticeship',
    programHref: '/programs/barber-apprenticeship',
    hostHref: '/partners/host-shops/barber',
    description: 'Haircuts, grooming, sanitation, and supervised barber practice.',
  },
  {
    key: 'cosmetology',
    label: 'Cosmetology & Hair',
    title: 'Cosmetology Training',
    programSlug: 'cosmetology-apprenticeship',
    programHref: '/programs/cosmetology-apprenticeship',
    hostHref: '/partners/host-shops/cosmetology',
    description: 'Hair styling, coloring, salon services, and professional hair care.',
  },
  {
    key: 'esthetician',
    label: 'Esthetics & Skincare',
    title: 'Esthetician Apprenticeship',
    programSlug: 'esthetician-apprenticeship',
    programHref: '/programs/esthetician-apprenticeship',
    hostHref: '/partners/host-shops/esthetician',
    description: 'Skincare, sanitation, consultation, and supervised spa practice.',
  },
  {
    key: 'nail-technician',
    label: 'Nail Technology',
    title: 'Nail Technician Apprenticeship',
    programSlug: 'nail-technician-apprenticeship',
    programHref: '/programs/nail-technician-apprenticeship',
    hostHref: '/partners/host-shops/nail-technician',
    description: 'Manicures, nail care, sanitation, and supervised nail services.',
  },
] as const;

export type BeautyTradeKey = (typeof BEAUTY_TRADES)[number]['key'];

export function getBeautyTrade(key: string) {
  return BEAUTY_TRADES.find(trade => trade.key === key);
}
