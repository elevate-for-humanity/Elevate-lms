/**
 * Indiana WorkOne regions — SEO + locator data.
 * Official finder: https://www.in.gov/dwd/find-a-workone-center/
 */

export type WorkOneCenter = {
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
};

export type WorkOneRegion = {
  slug: string;
  name: string;
  counties: string[];
  description: string;
  mapCenter: { lat: number; lng: number; zoom: number };
  centers: WorkOneCenter[];
  dwdFinderUrl: string;
};

const DWD_FINDER = 'https://www.in.gov/dwd/find-a-workone-center/';

export const WORKONE_REGIONS: WorkOneRegion[] = [
  {
    slug: 'central-indiana',
    name: 'Central Indiana (Indianapolis / Marion County)',
    counties: ['Marion', 'Hamilton', 'Hendricks', 'Johnson', 'Shelby', 'Hancock', 'Boone'],
    description:
      'WorkOne centers serving the Indianapolis metro and surrounding counties. Start here for WIOA intake, Workforce Ready Grant eligibility, and ITA referrals to ETPL-approved training.',
    mapCenter: { lat: 39.7684, lng: -86.1581, zoom: 10 },
    dwdFinderUrl: DWD_FINDER,
    centers: [
      {
        name: 'WorkOne Indianapolis — East',
        address: '7251 E 86th St',
        city: 'Indianapolis',
        zip: '46256',
        phone: '(317) 842-8801',
        hours: 'Mon–Fri 8am–5pm',
        lat: 39.9082,
        lng: -86.0092,
      },
      {
        name: 'WorkOne Indianapolis — Northwest',
        address: '3901 N Shadeland Ave',
        city: 'Indianapolis',
        zip: '46226',
        phone: '(317) 921-1600',
        hours: 'Mon–Fri 8am–5pm',
        lat: 39.8284,
        lng: -86.0455,
      },
      {
        name: 'WorkOne Indianapolis — Southeast',
        address: '1915 W 18th St, Suite C',
        city: 'Indianapolis',
        zip: '46202',
        phone: '(317) 684-2400',
        hours: 'Mon–Fri 8am–5pm',
        lat: 39.7912,
        lng: -86.2015,
      },
      {
        name: 'WorkOne Indianapolis — Southwest',
        address: '1200 Madison Ave',
        city: 'Indianapolis',
        zip: '46225',
        phone: '(317) 684-2400',
        hours: 'Mon–Fri 8am–5pm',
        lat: 39.7528,
        lng: -86.1585,
      },
      {
        name: 'WorkOne Marion County',
        address: '3901 Meadows Dr',
        city: 'Indianapolis',
        zip: '46205',
        phone: '(317) 684-2400',
        hours: 'Mon–Fri 8am–5pm',
        lat: 39.8289,
        lng: -86.1451,
      },
    ],
  },
  {
    slug: 'northwest-indiana',
    name: 'Northwest Indiana',
    counties: ['Lake', 'Porter', 'LaPorte', 'Newton', 'Jasper'],
    description:
      'WorkOne centers in the Gary, Hammond, and Valparaiso region for WIOA and WRG-funded career training referrals.',
    mapCenter: { lat: 41.5834, lng: -87.5000, zoom: 9 },
    dwdFinderUrl: DWD_FINDER,
    centers: [
      {
        name: 'WorkOne Northwest Indiana',
        address: 'Gary / Hammond area',
        city: 'Gary',
        zip: '46402',
        phone: '(219) 881-0100',
        hours: 'Mon–Fri 8am–5pm',
        lat: 41.5934,
        lng: -87.3464,
      },
    ],
  },
  {
    slug: 'northeast-indiana',
    name: 'Northeast Indiana (Fort Wayne)',
    counties: ['Allen', 'Whitley', 'DeKalb', 'Noble', 'Steuben'],
    description:
      'Fort Wayne–area WorkOne offices for workforce funding intake and training provider referrals.',
    mapCenter: { lat: 41.0793, lng: -85.1394, zoom: 10 },
    dwdFinderUrl: DWD_FINDER,
    centers: [
      {
        name: 'WorkOne Northeast',
        address: '201 E Rudisill Blvd',
        city: 'Fort Wayne',
        zip: '46806',
        phone: '(260) 745-3555',
        hours: 'Mon–Fri 8am–5pm',
        lat: 41.0534,
        lng: -85.1134,
      },
    ],
  },
  {
    slug: 'southern-indiana',
    name: 'Southern Indiana (Evansville)',
    counties: ['Vanderburgh', 'Warrick', 'Posey', 'Gibson'],
    description:
      'Southwest Indiana WorkOne centers for WIOA eligibility and ETPL training referrals.',
    mapCenter: { lat: 37.9716, lng: -87.5711, zoom: 10 },
    dwdFinderUrl: DWD_FINDER,
    centers: [
      {
        name: 'WorkOne Southwest',
        address: '700 E Walnut St',
        city: 'Evansville',
        zip: '47713',
        phone: '(812) 424-4473',
        hours: 'Mon–Fri 8am–5pm',
        lat: 37.9748,
        lng: -87.5612,
      },
    ],
  },
];

export function getWorkOneRegion(slug: string): WorkOneRegion | undefined {
  return WORKONE_REGIONS.find((r) => r.slug === slug);
}

export function workOneMapEmbedUrl(region: WorkOneRegion): string {
  const { lat, lng, zoom } = region.mapCenter;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function workOneCenterDirectionsUrl(center: WorkOneCenter): string {
  const q = encodeURIComponent(`${center.address}, ${center.city}, IN ${center.zip}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
