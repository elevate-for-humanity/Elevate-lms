import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Assistant Training',
  description:
    'Medical assistant training program. Clinical and administrative healthcare skills. WIOA funding may be available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/medical-assistant',
  },
};

export default function MedicalAssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
