export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import TppSurveyClient from './TppSurveyClient';

export const metadata: Metadata = {
  title: 'FSSA TPP Survey',
  description: 'Indiana FSSA SNAP E&T Third Party Provider questionnaire.',
  robots: { index: false, follow: false },
};

export default function TppSurveyPage() {
  return <TppSurveyClient />;
}
