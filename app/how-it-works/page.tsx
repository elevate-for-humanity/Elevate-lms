import { Metadata } from 'next';
import { HowItWorksAndPlatform } from '@/components/marketing/HowItWorksAndPlatform';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `How It Works | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Learn how Elevate for Humanity connects you to workforce training, apprenticeships, and career pathways.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
          <p className="text-xl text-blue-100">
            From training to career - we guide you every step of the way.
          </p>
        </div>
      </section>
      
      {/* Real Component */}
      <HowItWorksAndPlatform />
    </div>
  );
}

