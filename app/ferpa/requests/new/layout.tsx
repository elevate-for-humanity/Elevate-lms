import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Access Request | FERPA Portal',
  description: 'Submit a new FERPA records access request.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
