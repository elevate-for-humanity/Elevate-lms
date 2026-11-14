export interface EmployerPartner {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  programs: string[];
  activeStudents: number;
  placementType: 'WEX' | 'OJT' | 'Apprenticeship' | 'Direct Hire';
  notes?: string;
}

export const employerPartners: EmployerPartner[] = [
  {
    id: 'emp-1',
    name: 'Community Health Network',
    industry: 'Healthcare',
    contactName: 'Sarah Johnson',
    contactEmail: 'sjohnson@communityhealth.org',
    programs: ['prog-cna', 'prog-ems-apprentice'],
    activeStudents: 12,
    placementType: 'WEX',
    notes: 'Strong partner for CNA placements. Prefers students with reliable transportation.',
  },
  {
    id: 'emp-2',
    name: 'Comfort Systems HVAC',
    industry: 'Skilled Trades',
    contactName: 'Mike Davis',
    contactEmail: 'mdavis@comfortsystems.com',
    programs: ['prog-hvac'],
    activeStudents: 8,
    placementType: 'Apprenticeship',
    notes: 'Registered apprenticeship sponsor. Provides tools and uniforms.',
  },
  {
    id: 'emp-3',
    name: 'Elite Barbershop Collective',
    industry: 'Beauty & Personal Care',
    contactName: 'Marcus Williams',
    contactEmail: 'marcus@elitebarbershop.com',
    programs: ['prog-barber'],
    activeStudents: 6,
    placementType: 'Apprenticeship',
    notes: 'Network of 4 shops. Flexible scheduling for apprentices.',
  },
  {
    id: 'emp-4',
    name: 'Midwest Logistics Group',
    industry: 'Transportation',
    contactName: 'Jennifer Lee',
    contactEmail: 'jlee@midwestlogistics.com',
    programs: ['prog-cdl'],
    activeStudents: 10,
    placementType: 'OJT',
    notes: 'Reimburses CDL training costs after 6 months employment.',
  },
  {
    id: 'emp-5',
    name: 'Downtown Property Management',
    industry: 'Facilities & Maintenance',
    contactName: 'Robert Chen',
    contactEmail: 'rchen@downtownpm.com',
    programs: ['prog-building-tech-apprentice'],
    activeStudents: 5,
    placementType: 'Apprenticeship',
    notes: 'Manages 20+ commercial buildings. Good entry point for facilities careers.',
  },
];
