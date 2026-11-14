export type HostShopRegion = {
  slug: string;
  city: string;
  counties: string[];
  nearbyCities: string[];
};

export const HOST_SHOP_REGIONS: readonly HostShopRegion[] = [
  { slug: 'indianapolis', city: 'Indianapolis', counties: ['Marion'], nearbyCities: ['Carmel', 'Fishers', 'Greenwood', 'Lawrence'] },
  { slug: 'fort-wayne', city: 'Fort Wayne', counties: ['Allen'], nearbyCities: ['New Haven', 'Huntertown', 'Auburn'] },
  { slug: 'evansville', city: 'Evansville', counties: ['Vanderburgh', 'Warrick'], nearbyCities: ['Newburgh', 'Boonville'] },
  { slug: 'south-bend', city: 'South Bend', counties: ['St. Joseph'], nearbyCities: ['Mishawaka', 'Granger', 'Elkhart'] },
  { slug: 'gary', city: 'Gary', counties: ['Lake'], nearbyCities: ['Merrillville', 'Hammond', 'Crown Point'] },
  { slug: 'bloomington', city: 'Bloomington', counties: ['Monroe'], nearbyCities: ['Ellettsville', 'Martinsville'] },
] as const;

export function getHostShopRegion(slug: string) {
  return HOST_SHOP_REGIONS.find((region) => region.slug === slug);
}
