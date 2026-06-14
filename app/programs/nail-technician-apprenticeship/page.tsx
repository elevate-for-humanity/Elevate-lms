import { Metadata } from 'next';
import BeautyProgramPage from '@/components/beauty/BeautyProgramPage';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';

export const dynamic = 'force-dynamic';

const p = NAIL_TECH;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Nail Technician Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/nail-technician-apprenticeship' },
};

export default async function NailTechnicianApprenticeshipPage() {
  return <BeautyProgramPage program={p} />;
}
