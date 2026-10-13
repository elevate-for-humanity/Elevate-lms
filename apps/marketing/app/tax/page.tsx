import type { Metadata } from 'next';
import TaxSoftwarePage, { metadata as taxMetadata } from '../tax-software/page';

export const metadata: Metadata = {
  ...taxMetadata,
  alternates: { canonical: '/tax' },
};

export default TaxSoftwarePage;
