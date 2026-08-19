export type WageMilestone = {
  completedCompetencies: number;
  hourlyRate: number;
};

export type AppendixACompetency = {
  id: string;
  sourceLabel?: string;
  category: string;
  description: string;
};

export type AppendixARTIItem = {
  title: string;
  hours: number;
};

export type AppendixAStandard = {
  occupationTitle: string;
  programSlugs: readonly string[];
  onetSocCode: string;
  rapidsCode: string;
  approach: 'competency-based';
  competencyCount: number;
  relatedInstructionHours: number;
  apprenticeToMentorRatio: '1:1';
  probationaryHours: number;
  mentorHourlyRate: number;
  startingHourlyRate: number;
  wageMilestones: readonly WageMilestone[];
  competencies: readonly AppendixACompetency[];
  relatedInstruction: readonly AppendixARTIItem[];
};

/**
 * U.S. Department of Labor Office of Apprenticeship — approved Local
 * Apprenticeship Standards for 2 Exclusive LLC-S.
 *
 * Registration: 2025-IN-132301
 * Registration date: January 14, 2025
 * Revision date: July 10, 2025
 * Revision occupations: 0030CB, 2089CB, 2090CB
 *
 * Source of truth: approved Appendix A Work Process Schedules and Related
 * Instruction Outlines. Do not replace these values with generic state-hour
 * rules or marketing copy. These occupations are competency-based.
 *
 * RTI provider assignments are operational RAPIDS data and are intentionally
 * resolved from Supabase by registered-program-contract.ts rather than stored
 * in this immutable standards definition.
 */
export const APPENDIX_A_REGISTRATION = {
  sponsor: '2 Exclusive LLC-S',
  registrationNumber: '2025-IN-132301',
  registrationDate: '2025-01-14',
  revisionDate: '2025-07-10',
} as const;

export const APPENDIX_A_STANDARDS: Record<string, AppendixAStandard> = {
  barber: {
    occupationTitle: 'Barber',
    programSlugs: ['barber-apprenticeship'],
    onetSocCode: '39-5011.00',
    rapidsCode: '0030CB',
    approach: 'competency-based',
    competencyCount: 14,
    relatedInstructionHours: 260,
    apprenticeToMentorRatio: '1:1',
    probationaryHours: 500,
    mentorHourlyRate: 10,
    startingHourlyRate: 8,
    wageMilestones: [
      { completedCompetencies: 7, hourlyRate: 9 },
      { completedCompetencies: 14, hourlyRate: 9.5 },
    ],
    competencies: [
      { id: 'barber-a', sourceLabel: 'A', category: 'Trim client hair', description: 'Cut and trim hair according to clients instructions or current hairstyles, using clippers, combs, hand-held blow driers, and scissors.' },
      { id: 'barber-b', sourceLabel: 'B', category: 'Trim client hair', description: 'Shape and trim beards and moustaches, using scissors.' },
      { id: 'barber-c', sourceLabel: 'C', category: 'Trim client hair', description: 'Apply lather and shave beards or neck and temple hair contours, using razors.' },
      { id: 'barber-protective-coverings', category: 'Apply protective coverings', description: 'Apply protective coverings to objects or surfaces near work areas.' },
      { id: 'barber-d', sourceLabel: 'D', category: 'Clean tools or equipment', description: 'Clean and sterilize scissors, combs, clippers, and other instruments.' },
      { id: 'barber-e', sourceLabel: 'E', category: 'Discuss service options or needs with clients', description: 'Question patrons regarding desired services and haircut styles.' },
      { id: 'barber-f', sourceLabel: 'F', category: 'Clean facilities or work areas', description: 'Clean work stations and sweep floors.' },
      { id: 'barber-g', sourceLabel: 'G', category: 'Maintain financial or account records', description: 'Record services provided on cashiers tickets or receive payment from customers.' },
      { id: 'barber-h', sourceLabel: 'H', category: 'Perform administrative or clerical tasks', description: 'Perform clerical and administrative duties such as keeping records, paying bills, and hiring and supervising personnel.' },
      { id: 'barber-i', sourceLabel: 'I', category: 'Supervise service workers', description: 'Perform clerical and administrative duties such as keeping records, paying bills, and hiring and supervising personnel.' },
      { id: 'barber-j', sourceLabel: 'J', category: 'Maintain professional knowledge or certifications', description: 'Stay informed of the latest styles and hair care techniques.' },
      { id: 'barber-k', sourceLabel: 'K', category: 'Order materials, supplies, or equipment', description: 'Order supplies.' },
      { id: 'barber-l', sourceLabel: 'L', category: 'Promote products, services, or programs', description: 'Recommend and sell lotions, tonics, or other cosmetic supplies.' },
      { id: 'barber-m', sourceLabel: 'M', category: 'Maintain client information or service records', description: 'Keep card files on clientele, recording notes of work done, products used and fees charged after each visit.' },
    ],
    relatedInstruction: [
      { title: 'Barbering History and Professional Development', hours: 10 },
      { title: 'Anatomy, Physiology & Skin/Nail Disorders', hours: 60 },
      { title: 'Hair & Scalp Theory, Disorders, and Treatments', hours: 60 },
      { title: 'Infection Control & Bloodborne Pathogens (OSHA)', hours: 40 },
      { title: 'Hair Cutting Theory, Tool Safety, and Techniques', hours: 60 },
      { title: 'State Board Laws, Rules, and Regulations', hours: 10 },
      { title: 'Business Practices', hours: 10 },
      { title: 'Preparation for State Licensing Examination', hours: 10 },
    ],
  },
  esthetician: {
    occupationTitle: 'Esthetician',
    programSlugs: ['esthetician-apprenticeship', 'esthetics-apprenticeship'],
    onetSocCode: '39-5094.00',
    rapidsCode: '2089CB',
    approach: 'competency-based',
    competencyCount: 20,
    relatedInstructionHours: 300,
    apprenticeToMentorRatio: '1:1',
    probationaryHours: 500,
    mentorHourlyRate: 9.25,
    startingHourlyRate: 7.5,
    wageMilestones: [
      { completedCompetencies: 10, hourlyRate: 8.5 },
      { completedCompetencies: 20, hourlyRate: 9.25 },
    ],
    competencies: [
      { id: 'esthetician-a', sourceLabel: 'A', category: 'Clean facilities or work areas', description: 'Sterilize equipment and clean work areas.' },
      { id: 'esthetician-b', sourceLabel: 'B', category: 'Clean tools or equipment', description: 'Sterilize equipment and clean work areas.' },
      { id: 'esthetician-c', sourceLabel: 'C', category: 'Apply cleansing or conditioning agents', description: 'Cleanse client’s skin with water, creams, or lotions.' },
      { id: 'esthetician-d', sourceLabel: 'D', category: 'Apply cleansing or conditioning agents', description: 'Select and apply cosmetic products, such as creams, lotions, and tonics.' },
      { id: 'esthetician-e', sourceLabel: 'E', category: 'Apply cleansing or conditioning agents', description: 'Perform simple extractions to remove blackheads.' },
      { id: 'esthetician-f', sourceLabel: 'F', category: 'Apply cleansing or conditioning agents', description: 'Treat the facial skin to maintain and improve its appearance, using specialized techniques and products, such as peels and masks.' },
      { id: 'esthetician-g', sourceLabel: 'G', category: 'Apply cleansing or conditioning agents', description: 'Remove body and facial hair by applying wax.' },
      { id: 'esthetician-h', sourceLabel: 'H', category: 'Apply cleansing or conditioning agents', description: 'Apply chemical peels to reduce fine lines and age spots.' },
      { id: 'esthetician-i', sourceLabel: 'I', category: 'Assess skin or hair conditions', description: 'Examine clients skin, using magnifying lamps or visors when necessary, to evaluate skin condition and appearance.' },
      { id: 'esthetician-j', sourceLabel: 'J', category: 'Assess skin or hair conditions', description: "Determine which products or colors will improve clients' skin quality and appearance." },
      { id: 'esthetician-k', sourceLabel: 'K', category: 'Provide medical or cosmetic advice for clients', description: 'Demonstrate how to clean and care for skin properly and recommend skin-care regimens.' },
      { id: 'esthetician-l', sourceLabel: 'L', category: 'Provide medical or cosmetic advice for clients', description: 'Refer clients to medical personnel for treatment of serious skin problems.' },
      { id: 'esthetician-m', sourceLabel: 'M', category: 'Provide medical or cosmetic advice for clients', description: 'Advise clients about colors and types of makeup and instruct them in makeup application techniques.' },
      { id: 'esthetician-n', sourceLabel: 'N', category: 'Demonstrate activity techniques or equipment use', description: 'Demonstrate how to clean and care for skin properly and recommend skin-care regimens.' },
      { id: 'esthetician-o', sourceLabel: 'O', category: 'Teach health or hygiene practices', description: 'Demonstrate how to clean and care for skin properly and recommend skin-care regimens.' },
      { id: 'esthetician-p', sourceLabel: 'P', category: 'Maintain professional knowledge or certifications', description: 'Stay abreast of latest industry trends, products, research, and treatments.' },
      { id: 'esthetician-q', sourceLabel: 'Q', category: 'Administer therapeutic massages', description: 'Provide facial and body massages.' },
      { id: 'esthetician-r', sourceLabel: 'R', category: 'Maintain client information or service records', description: 'Keep records of client needs and preferences and the services provided.' },
      { id: 'esthetician-s', sourceLabel: 'S', category: 'Sell products or services', description: 'Sell makeup to clients.' },
      { id: 'esthetician-t', sourceLabel: 'T', category: 'Apply solutions to hair for therapeutic or cosmetic purposes', description: 'Tint eyelashes and eyebrows.' },
    ],
    relatedInstruction: [
      { title: 'Esthetics History & Professional Ethics', hours: 10 },
      { title: 'Anatomy, Physiology & Skin Disorders', hours: 60 },
      { title: 'Skin Types, Conditions & Product Selection', hours: 60 },
      { title: 'Facial Techniques & Equipment Usage', hours: 40 },
      { title: 'Methods & Safety', hours: 40 },
      { title: 'Makeup Fundamentals', hours: 60 },
      { title: 'State Laws & Licensing Requirements', hours: 10 },
      { title: 'Retailing, Client Care & Business Practices', hours: 10 },
      { title: 'State Licensing Exam Preparation', hours: 10 },
    ],
  },
  manicurist: {
    occupationTitle: 'Manicurist',
    programSlugs: ['nail-tech-apprenticeship', 'nail-technician-apprenticeship', 'manicurist-apprenticeship'],
    onetSocCode: '39-5092.00',
    rapidsCode: '2090CB',
    approach: 'competency-based',
    competencyCount: 19,
    relatedInstructionHours: 210,
    apprenticeToMentorRatio: '1:1',
    probationaryHours: 500,
    mentorHourlyRate: 15,
    startingHourlyRate: 7.5,
    wageMilestones: [
      { completedCompetencies: 4, hourlyRate: 8 },
      { completedCompetencies: 8, hourlyRate: 8.5 },
      { completedCompetencies: 12, hourlyRate: 9 },
      { completedCompetencies: 16, hourlyRate: 10 },
      { completedCompetencies: 19, hourlyRate: 15 },
    ],
    competencies: [
      { id: 'manicurist-a', sourceLabel: 'A', category: 'Clean tools or equipment', description: 'Clean and sanitize tools and work environment.' },
      { id: 'manicurist-b', sourceLabel: 'B', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Prepare nail cuticles with water and oil, using cuticle knives to push back cuticles and scissors or nippers to trim cuticles.' },
      { id: 'manicurist-c', sourceLabel: 'C', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Prepare customers nails in soapy water, using swabs, files, and orange sticks.' },
      { id: 'manicurist-d', sourceLabel: 'D', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Use rotary abrasive wheels to shape and smooth nails or artificial extensions.' },
      { id: 'manicurist-e', sourceLabel: 'E', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Treat nails to repair or improve strength and resilience by wrapping.' },
      { id: 'manicurist-f', sourceLabel: 'F', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Extend nails using powder, solvent, and paper forms attached to tips of customers fingers to support and shape artificial nails.' },
      { id: 'manicurist-g', sourceLabel: 'G', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Remove previously applied nail polish, using liquid remover and swabs.' },
      { id: 'manicurist-h', sourceLabel: 'H', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Shape and smooth ends of nails, using scissors, files, or emery boards.' },
      { id: 'manicurist-i', sourceLabel: 'I', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Apply undercoat and clear or colored polish onto nails with brush.' },
      { id: 'manicurist-j', sourceLabel: 'J', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Roughen surfaces of fingernails, using abrasive wheel.' },
      { id: 'manicurist-k', sourceLabel: 'K', category: 'Treat nails by shaping, decorating, or augmenting', description: 'Polish nails, using powdered polish and buffer.' },
      { id: 'manicurist-l', sourceLabel: 'L', category: 'Maintain client information or service records', description: 'Maintain supply inventories and records of client services.' },
      { id: 'manicurist-m', sourceLabel: 'M', category: 'Maintain supply or equipment inventories', description: 'Maintain supply inventories and records of client services.' },
      { id: 'manicurist-n', sourceLabel: 'N', category: 'Schedule appointments', description: 'Schedule client appointments and accept payments.' },
      { id: 'manicurist-o', sourceLabel: 'O', category: 'Administer therapeutic massages', description: 'Assess the condition of clients hands, remove dead skin, and massage hands.' },
      { id: 'manicurist-p', sourceLabel: 'P', category: 'Assess skin or hair conditions', description: 'Assess the condition of clients hands, remove dead skin, and massage hands.' },
      { id: 'manicurist-q', sourceLabel: 'Q', category: 'Provide medical or cosmetic advice for clients', description: 'Advise clients on nail care and use of products and colors.' },
      { id: 'manicurist-r', sourceLabel: 'R', category: 'Promote products, services, or programs', description: 'Promote and sell nail care products.' },
      { id: 'manicurist-s', sourceLabel: 'S', category: 'Sell products or services', description: 'Promote and sell nail care products.' },
    ],
    relatedInstruction: [
      { title: 'Introduction & Sanitation', hours: 5 },
      { title: 'History & Overview of Nail Technology', hours: 10 },
      { title: 'Sanitation, Disinfection, & State Board Regulations', hours: 40 },
      { title: 'Nail Anatomy & Disorders', hours: 25 },
      { title: 'Proper use of tools: Clippers, Buffers, & Cuticle Pushers', hours: 5 },
      { title: 'Manicure & Pedicure Techniques', hours: 20 },
      { title: 'Nail Art & Specialty Services', hours: 30 },
      { title: 'Business & Career Preparation', hours: 10 },
      { title: 'Salon Business Management & Retailing', hours: 5 },
      { title: 'Client Relations & Customer Retention', hours: 5 },
      { title: 'Resume Building & Portfolio Development', hours: 10 },
      { title: 'Final Review & Virtual Practical Demonstration', hours: 45 },
    ],
  },
};

export function getAppendixAStandard(programSlug: string | null | undefined): AppendixAStandard | null {
  if (!programSlug) return null;
  return (
    Object.values(APPENDIX_A_STANDARDS).find((standard) =>
      standard.programSlugs.includes(programSlug),
    ) ?? null
  );
}
