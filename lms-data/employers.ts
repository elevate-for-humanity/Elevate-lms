export type EmployerTag =
  | 'healthcare'
  | 'beauty'
  | 'trades'
  | 'office'
  | 'tax-vita'
  | 'youth'
  | 'reentry'
  | 'entry-level'
  | 'apprenticeship';

export interface Employer {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  website?: string;
  notes?: string;
  interestedPrograms: string[];
  tags: EmployerTag[];
  wantsWex?: boolean;
  wantsOjt?: boolean;
  wantsApprenticeship?: boolean;
}

export const employers: Employer[] = [
  {
    id: 'emp-sample-ltc',
    name: 'Sample Long-Term Care Facility',
    contactName: 'HR Director',
    contactEmail: 'hr@sampleltc.org',
    city: 'Indianapolis',
    state: 'IN',
    website: '',
    interestedPrograms: ['prog-cna'],
    tags: ['healthcare', 'entry-level'],
    wantsWex: true,
    wantsOjt: true,
  },
  {
    id: 'emp-sample-barbershop',
    name: 'Sample Community Barbershop',
    contactName: 'Shop Owner',
    contactEmail: 'owner@barbershop.com',
    city: 'Indianapolis',
    state: 'IN',
    website: '',
    interestedPrograms: ['prog-barber'],
    tags: ['beauty', 'apprenticeship', 'youth'],
    wantsApprenticeship: true,
  },
  {
    id: 'emp-sample-vita',
    name: 'Sample VITA Site',
    contactName: 'Site Coordinator',
    contactEmail: 'coordinator@vitasite.org',
    city: 'Indianapolis',
    state: 'IN',
    website: '',
    interestedPrograms: ['prog-tax-vita'],
    tags: ['tax-vita', 'office', 'youth'],
    wantsWex: true,
  },
];

export function getEmployerById(id: string): Employer | undefined {
  return employers.find((e) => e.id === id);
}
