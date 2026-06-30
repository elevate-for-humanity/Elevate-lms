import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policy Acknowledgment',
  description: 'Review and acknowledge barber host shop policies.',
};

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
