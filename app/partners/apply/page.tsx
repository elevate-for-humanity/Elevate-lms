import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProviderApplicationForm from './ProviderApplicationForm';

export const metadata: Metadata = {
  title: 'Apply to Join the Network | Elevate for Humanity',
  description: 'Apply to become an approved training provider, workforce agency, or employer partner on the Elevate workforce hub.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/apply' },
};

export default function ProviderApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners' },
          { label: 'Training Provider', href: '/partners/training-provider' },
          { label: 'Apply' },
        ]} />
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Provider Network Application</h1>
          <p className="text-black">
            Complete this form to apply for approval as a training provider, workforce agency, or employer partner.
            Applications are reviewed by Elevate staff. You will receive an email when a decision is made.
          </p>
        </div>

        <ProviderApplicationForm />
      </div>
    </div>
  );
}
