import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import CurriculumUploadClient from './CurriculumUploadClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Upload Curriculum | Admin | Elevate For Humanity',
  description: 'Upload lesson plans, packets, videos, and training materials.',
};

export default async function CurriculumUploadPage() {
  await requireRole(['admin']);
  return <CurriculumUploadClient />;
}
