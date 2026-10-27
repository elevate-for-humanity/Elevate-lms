import { publicArtworkMetadata } from '@/lib/marketing/artwork-metadata';
export const metadata = {
  title: 'Talk with an admissions advisor',
  description:
    'Discuss your career goal, program choices, application steps and training requirements with Elevate admissions.',
  ...publicArtworkMetadata({
    path: '/advising',
    image: '/images/refresh-20261014/admissions.webp',
    alt: 'Illustrative learner reviewing enrollment options with an advisor',
    title: 'Talk with an admissions advisor',
    description:
      'Discuss your career goal, program choices, application steps and training requirements with Elevate admissions.',
  }),
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
