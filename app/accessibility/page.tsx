import { Metadata } from 'next';
import { CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Accessibility Statement | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Our commitment to web accessibility and inclusive design.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Accessibility Statement</h1>
          <p className="text-xl text-blue-100">Our commitment to making our website accessible to everyone.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
          <p className="text-slate-600 mb-6">We are committed to ensuring digital accessibility for people with disabilities.</p>
          
          <h2 className="text-2xl font-bold mb-4">Accessibility Features</h2>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Keyboard navigation support</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Screen reader compatible</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Clear, readable fonts</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> High contrast colors</li>
          </ul>
          
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="text-slate-600">If you need assistance, please contact us at info@elevateforhumanity.org.</p>
        </div>
      </section>
    </div>
  );
}
