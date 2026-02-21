import { siteMetadata } from '@/lib/seo/siteMetadata';
import HVACProgramContent from './HVACProgramContent';

export const metadata = siteMetadata({
  title: 'HVAC Technician Training Program',
  description: 'HVAC technician pathway with EPA 608 preparation, structured training, and job readiness support for entry-level and upskilling learners.',
  path: '/programs/hvac',
});

export default function HVACPage() {
  return <HVACProgramContent />;
}
