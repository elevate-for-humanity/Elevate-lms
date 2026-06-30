import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barber Host Shop Forms',
  description: 'Required forms for the barber host shop program.',
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
