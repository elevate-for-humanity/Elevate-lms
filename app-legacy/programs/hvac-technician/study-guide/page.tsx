import { Metadata } from 'next';
import StudyGuideClient from './StudyGuideClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'EPA 608 Study Guide — HVAC Technician',
  description:
    'Complete EPA 608 Universal certification study guide covering Core, Type I, Type II, and Type III. Printable and downloadable.',
};

export default function StudyGuidePage() {
  return <StudyGuideClient />;
}
