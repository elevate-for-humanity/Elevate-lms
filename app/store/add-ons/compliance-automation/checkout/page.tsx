import AddOnCheckout from '@/components/store/AddOnCheckout';

export default function ComplianceAutomationCheckoutPage() {
  return (
    <AddOnCheckout
      productId="compliance-automation"
      productName="Compliance Automation"
      productImage="/images/heroes-hq/funding-hero.jpg"
      backHref="/store/add-ons/compliance-automation"
      oneTimePrice={1297}
      monthlyPrice={374}
      monthlyCount={4}
      accentColor="emerald"
      features={['WIOA, FERPA, DOL, ETPL', 'Automated audit trails', 'Risk monitoring']}
    />
  );
}
