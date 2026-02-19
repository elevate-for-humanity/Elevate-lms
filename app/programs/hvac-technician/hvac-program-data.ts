import {
  Thermometer, Zap, Wind, Wrench, Shield, BookOpen,
  ClipboardCheck, Users,
} from 'lucide-react';

export const QUICK_STATS = [
  { val: '20 Weeks', label: 'Program Duration' },
  { val: '6', label: 'Credentials Earned' },
  { val: '$5,000', label: 'Total Cost' },
  { val: '$45K-$75K', label: 'Starting Salary Range' },
];

export const COMPETENCIES = [
  'Heating system installation and repair',
  'Cooling system diagnostics and service',
  'Refrigerant handling and EPA compliance',
  'Electrical wiring, controls, and components',
  'Ductwork design, installation, and balancing',
  'Thermostat and control system programming',
  'OSHA 30 safety compliance',
  'Residential system sizing and load calculations',
  'Preventive maintenance procedures',
  'Troubleshooting and diagnostics',
  'Customer service and communication',
  'Tool and equipment operation',
  'Building code compliance',
  'Energy efficiency and green HVAC practices',
  'Professional conduct and workplace readiness',
];

// Exact match to INTraining Program ID #10004322 credential listing + EPA 608
export const CREDENTIALS = [
  { name: 'Residential HVAC Certification 1', type: 'Industry-Recognized Certification' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
  { name: 'Residential HVAC Certification 2 - Refrigeration Diagnostics', type: 'Industry-Recognized Certification' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
  { name: 'EPA 608 Universal Certification', type: 'Industry-Recognized Certification' as const, issuer: 'EPA / Licensed testing center', testRequired: true, obtainedInProgram: true },
  { name: 'OSHA 30', type: 'Industry-Recognized Certification' as const, issuer: 'OSHA / CareerSafe', testRequired: true, obtainedInProgram: true },
  { name: 'CPR', type: 'Industry-Recognized Certification' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
  { name: 'Rise Up', type: 'Certificate' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
];

export const CURRICULUM = [
  { icon: Thermometer, title: 'HVAC Fundamentals', description: 'Heating, cooling, and ventilation system theory. Residential and light commercial system types, components, and operating principles.' },
  { icon: Zap, title: 'Electrical Systems', description: 'Wiring, controls, electrical components, circuit analysis, and safety. Hands-on work with real HVAC electrical systems.' },
  { icon: Wind, title: 'Air Distribution', description: 'Ductwork design, installation, balancing, and airflow measurement. Residential system sizing and load calculations.' },
  { icon: Wrench, title: 'Refrigeration', description: 'Refrigerant handling, recovery, and recycling. EPA 608 certification preparation. Refrigeration diagnostics and repair.' },
  { icon: Shield, title: 'Safety & Codes', description: 'OSHA 30 certification. Building codes, permits, safety protocols, PPE, and hazard identification for HVAC work.' },
  { icon: BookOpen, title: 'Troubleshooting & Diagnostics', description: 'Systematic diagnostic procedures, meter usage, pressure testing, and repair techniques for common HVAC failures.' },
];

export const CAREERS = [
  { title: 'HVAC Installer', salary: '$40K-$55K', demand: 'High demand' },
  { title: 'Service Technician', salary: '$45K-$65K', demand: 'Very high demand' },
  { title: 'Refrigeration Tech', salary: '$50K-$70K', demand: 'Specialized' },
  { title: 'Commercial HVAC', salary: '$55K-$80K', demand: 'Premium pay' },
];

export const EMPLOYERS = [
  'Carrier', 'Trane', 'Lennox', 'Local contractors',
  'Property management', 'Hospitals', 'Schools', 'Manufacturing',
];

export const ENROLLMENT_STEPS = [
  { title: 'Complete Intake', description: 'Submit the funding and eligibility intake form online. We check WIOA, Workforce Ready Grant, and other funding sources on your behalf.' },
  { title: 'Register at Indiana Career Connect', description: 'Create your account at indianacareerconnect.com. This is required for WIOA and Workforce Ready Grant eligibility verification.' },
  { title: 'Attend Orientation', description: 'Meet your instructors, tour the training facility, review the program schedule, and complete enrollment paperwork.' },
  { title: 'Start Training', description: 'Begin your 20-week HVAC program with hands-on instruction, classroom learning, and certification preparation.' },
];

export const ELIGIBILITY = [
  'At least 18 years old with a valid government-issued ID',
  'High school diploma or GED',
  'Valid driver\'s license (HVAC work involves traveling to job sites)',
  'Ability to lift 50+ pounds and work in confined spaces',
  'Basic math skills (fractions, measurements, calculations)',
  'Pass background check',
];
