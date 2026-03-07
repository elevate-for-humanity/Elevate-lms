import { Metadata } from 'next';
import StudyGuideClient from './StudyGuideClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'EPA 608 Study Guide — HVAC Technician | Elevate for Humanity',
  description: 'Complete EPA 608 Universal certification study guide covering Core, Type I, Type II, and Type III. Printable and downloadable.',
};

export default function StudyGuidePage() {
  return <StudyGuideClient />;
}
