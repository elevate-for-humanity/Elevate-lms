import { Metadata } from 'next';
import BeautyProgramPage from '@/components/beauty/BeautyProgramPage';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';

export const dynamic = 'force-dynamic';

const p = ESTHETICIAN_APPRENTICESHIP;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Esthetician Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/esthetician-apprenticeship' },
};

export default async function EstheticianApprenticeshipPage() {
  return <BeautyProgramPage program={p} />;
}
