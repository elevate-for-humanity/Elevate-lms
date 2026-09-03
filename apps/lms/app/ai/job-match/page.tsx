import type { Metadata } from 'next';
import JobMatchClient from './JobMatchClient';

export const metadata: Metadata = {
  title: 'Job Match | Elevate for Humanity',
  description: 'AI-powered job matching based on your skills and experience.',
};

export default function AIJobMatchPage() {
  return <JobMatchClient />;
}
