import type { Metadata } from 'next';
import LearningClient from './LearningClient';

export const metadata: Metadata = {
  title: 'My Learning | Elevate for Humanity',
  description: 'Access your courses, lessons, and learning materials.',
};

export default function LearningPage() {
  return <LearningClient />;
}
