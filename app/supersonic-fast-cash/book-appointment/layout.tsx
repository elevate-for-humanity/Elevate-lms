import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Appointment | Supersonic Fast Cash',
  description: 'Supersonic Fast Cash - Book Appointment for tax preparation services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
