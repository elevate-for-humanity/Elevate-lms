import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HVAC Technician Course Preview | Elevate for Humanity',
  description: 'Preview the HVAC Technician training program curriculum and outcomes.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
