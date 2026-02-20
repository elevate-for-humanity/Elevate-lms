import { Metadata } from 'next';
import { redirect } from 'next/navigation';


export const metadata: Metadata = {
  title: 'Cm | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/cm',
  },
};

export default function CmPage() {
  redirect('/admin/reports/caseload');
}
