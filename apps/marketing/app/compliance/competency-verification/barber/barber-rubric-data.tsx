export interface BarberSection {
  id: string;
  name: string;
  description: string;
  competencies: number;
  rtiHours: number;
  ojtHours: number;
}

export interface BarberStats {
  totalCompetencies: number;
  sections: number;
  totalRTIHours: number;
  totalOJTHours: number;
}

export const BARBER_SECTIONS: BarberSection[] = [
  {
    id: 'foundations',
    name: 'Foundations',
    description: 'Basic barbering fundamentals',
    competencies: 15,
    rtiHours: 100,
    ojtHours: 150,
  },
  {
    id: 'haircutting',
    name: 'Haircutting',
    description: 'Precision cutting techniques',
    competencies: 25,
    rtiHours: 150,
    ojtHours: 300,
  },
  {
    id: 'shaving',
    name: 'Shaving & Facials',
    description: 'Traditional and modern shaving techniques',
    competencies: 20,
    rtiHours: 100,
    ojtHours: 200,
  },
  {
    id: 'chemical',
    name: 'Chemical Services',
    description: 'Coloring, relaxing, and texturizing',
    competencies: 18,
    rtiHours: 80,
    ojtHours: 150,
  },
  {
    id: 'business',
    name: 'Business & Safety',
    description: 'Client consultation and business practices',
    competencies: 12,
    rtiHours: 70,
    ojtHours: 50,
  },
];

export const BARBER_STATS: BarberStats = {
  totalCompetencies: 90,
  sections: 5,
  totalRTIHours: 500,
  totalOJTHours: 850,
};
