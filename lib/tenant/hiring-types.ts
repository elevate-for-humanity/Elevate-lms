export type HiringRole = 'company' | 'individual' | 'apprentice';
export type HiringProfile = {
  role: HiringRole; name: string; email: string; phone: string; company: string;
  serviceArea: string; services: string; experience: string; availability: string;
  capacity: string; equipment: string; insurance: string; qualificationsNote: string;
};
export type HiringQuestion = { id: string; question: string; options: string[] };
export type HiringDocument = { id: string; name: string; mime: string; bytes: number };
export type HiringMessage = { role: 'PARIS' | 'Applicant'; text: string };
export type HiringPublicState = {
  id: string; profile: HiringProfile; version: number; submittedAt?: string;
  assessment?: { score: number; reviewTopics: string[]; completedAt: string };
  interview: { messages: HiringMessage[]; answered: number; complete: boolean };
  documents: HiringDocument[];
};
