import { Metadata } from 'next';
import VRFundingDemoClient from './VRFundingDemoClient';

export const metadata: Metadata = {
  title: 'VR Funding Demo',
  description: 'Interactive demo for VR counselors and workforce development funders. See how Elevate prepares participants for careers in healthcare, trades, and business.',
};

export default function VRFundingDemoPage() {
  return <VRFundingDemoClient />;
}
