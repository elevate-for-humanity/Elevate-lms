export const dynamic = 'force-dynamic';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function ComplianceAutomationCheckoutPage() {
  return (
    <AddOnCheckout
      productId="compliance-automation"
      productName="Compliance Automation"
      productImage="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/admin-compliance-audit-hero.jpg"
      backHref="/store/add-ons/compliance-automation"
      oneTimePrice={1297}
      monthlyPrice={374}
      monthlyCount={4}
      accentColor="emerald"
      features={['WIOA, FERPA, DOL, ETPL', 'Automated audit trails', 'Risk monitoring']}
    />
  );
}
