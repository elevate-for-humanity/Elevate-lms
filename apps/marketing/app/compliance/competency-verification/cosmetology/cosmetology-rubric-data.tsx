export interface CosmetologySection {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    rtiHours: number;
    ojtHours: number;
  }[];
}

export const COSMETOLOGY_SECTIONS: CosmetologySection[] = [
  {
    id: 'basic',
    name: 'Basic Training',
    items: [
      { id: 'b1', name: 'Sanitation & Sterilization', rtiHours: 20, ojtHours: 40 },
      { id: 'b2', name: 'Anatomy & Physiology', rtiHours: 30, ojtHours: 20 },
      { id: 'b3', name: 'State Laws & Regulations', rtiHours: 15, ojtHours: 0 },
    ],
  },
  {
    id: 'hair',
    name: 'Hair Care',
    items: [
      { id: 'h1', name: 'Haircutting Techniques', rtiHours: 40, ojtHours: 100 },
      { id: 'h2', name: 'Coloring & Bleaching', rtiHours: 30, ojtHours: 80 },
      { id: 'h3', name: 'Texturizing & Perms', rtiHours: 25, ojtHours: 60 },
    ],
  },
  {
    id: 'skin',
    name: 'Skin Care',
    items: [
      { id: 's1', name: 'Facial Treatments', rtiHours: 25, ojtHours: 50 },
      { id: 's2', name: 'Hair Removal', rtiHours: 15, ojtHours: 30 },
    ],
  },
  {
    id: 'nails',
    name: 'Nail Care',
    items: [
      { id: 'n1', name: 'Manicuring & Pedicuring', rtiHours: 20, ojtHours: 40 },
      { id: 'n2', name: 'Nail Art & Extensions', rtiHours: 15, ojtHours: 30 },
    ],
  },
];
