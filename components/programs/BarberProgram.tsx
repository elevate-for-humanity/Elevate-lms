'use client';

import { PremiumProgramPage } from './PremiumProgramPage';
import { Scissors } from 'lucide-react';

const barberProgram = {
  id: 'barber-apprenticeship',
  name: 'Barbering',
  tagline: 'Launch your career in professional barbering with paid apprenticeship.',
  description: 'Our Barbering program combines classroom theory with hands-on apprenticeship training. You will learn classic and modern cutting techniques, facial treatments, shaves, and customer service skills while earning money through our registered apprenticeship sponsor status.',
  duration: '12-18 months',
  credential: 'Indiana Barber License',
  salary: { low: 35000, high: 75000 },
  href: '/programs/barber-apprenticeship',
  color: 'amber',
  icon: <Scissors className="w-10 h-10" />,
  industry: 'Beauty & Personal Care',
  outcomes: [
    'Classic and modern haircut techniques',
    'Facial treatments and skincare',
    'Traditional and modern shaves',
    'Beard styling and grooming',
    'Customer service excellence',
    'Business management basics',
    'State licensing exam preparation',
    'Portfolio development',
  ],
  curriculum: [
    { module: 'Theory & Sanitation', topics: ['Bacteriology & sterilization', 'Anatomy & physiology', 'Sanitation protocols', 'State board requirements'] },
    { module: 'Haircutting Fundamentals', topics: ['Tool handling', 'Basic cuts', 'Clipper techniques', 'Scissor work'] },
    { module: 'Advanced Techniques', topics: ['Fades and tapers', 'Designs and patterns', 'Texturizing', 'Color theory basics'] },
    { module: 'Facial Treatments', topics: ['Facial massage', 'Beard treatments', 'Skin assessment', 'Product recommendations'] },
    { module: 'Shaving Mastery', topics: ['Traditional straight razor', 'Hot towel treatments', 'Shave patterns', 'Customer comfort'] },
    { module: 'Apprenticeship', topics: ['Real client services', 'Shop management', 'Inventory', 'Building clientele'] },
  ],
  certifications: [
    { name: 'Indiana Barber License', description: 'State-issued license required to practice as a barber in Indiana' },
    { name: 'Bloodborne Pathogens Certificate', description: 'OSHA-required safety training' },
    { name: 'DOL Registered Apprenticeship', description: 'Nationally recognized apprenticeship credential' },
  ],
  careers: [
    { title: 'Professional Barber', salary: '$35,000-$55,000/yr' },
    { title: 'Master Barber', salary: '$45,000-$65,000/yr' },
    { title: 'Barber Shop Owner', salary: '$55,000-$100,000/yr' },
    { title: 'Barber Instructor', salary: '$50,000-$70,000/yr' },
  ],
  employers: [
    { name: 'Renaissance Barber Shop', type: 'Barbershop' },
    { name: 'Great Clips', type: 'National Chain' },
    { name: 'Sport Clips', type: 'National Chain' },
    { name: 'Independent Barbershops', type: 'Various' },
  ],
  funding: [
    { name: 'WIOA Funding', coverage: 'Up to 100% covered' },
    { name: 'Pell Grant', coverage: 'Up to $7,395/year' },
    { name: 'VR Services', coverage: 'Individualized support' },
    { name: 'Payment Plans', coverage: '0% interest, $29/mo' },
  ],
  requirements: [
    'High school diploma or GED',
    'Be 16+ years old',
    'Valid government ID',
    'Pass background check',
    'Physical ability to stand',
  ],
};

export function BarberProgram() {
  return <PremiumProgramPage program={barberProgram} />;
}

export default BarberProgram;
