import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Disabled | Elevate Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DisabledCashAdvancesPage() {
  notFound();
}
