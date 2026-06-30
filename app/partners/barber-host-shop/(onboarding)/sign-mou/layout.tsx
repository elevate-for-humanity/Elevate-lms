import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign MOU',
  description: 'Sign the Memorandum of Understanding for the barber host shop.',
};

export default function SignMOULayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
