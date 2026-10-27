import { publicArtworkMetadata } from '@/lib/marketing/artwork-metadata';
export const metadata = {
  title: 'Training payment options',
  description:
    'Review program-specific self-pay costs, available payment arrangements and how to ask about workforce funding.',
  ...publicArtworkMetadata({
    path: '/financing',
    image: '/images/refresh-20261014/admissions.webp',
    alt: 'Illustrative learner reviewing enrollment options with an advisor',
    title: 'Training payment options',
    description:
      'Review program-specific self-pay costs, available payment arrangements and how to ask about workforce funding.',
  }),
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
