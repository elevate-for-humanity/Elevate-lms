import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `FERPA Privacy Rights | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Family Educational Rights and Privacy Act information.',
};

export default function FERPAPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">FERPA Privacy Rights</h1>
          <p className="text-xl text-blue-100">Your educational records are protected.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto prose">
          <h2 className="text-2xl font-bold mb-4">Your Rights Under FERPA</h2>
          <p className="text-slate-600 mb-6">The Family Educational Rights and Privacy Act (FERPA) provides you with certain rights regarding your education records.</p>
          
          <h3 className="text-xl font-bold mb-2">Right to Review</h3>
          <p className="text-slate-600 mb-4">You have the right to review your education records within 45 days of requesting access.</p>
          
          <h3 className="text-xl font-bold mb-2">Right to Request Amendment</h3>
          <p className="text-slate-600 mb-4">You have the right to request amendment of records you believe are inaccurate.</p>
          
          <h3 className="text-xl font-bold mb-2">Contact</h3>
          <p className="text-slate-600">For questions about FERPA, contact our registrar at info@elevateforhumanity.org.</p>
        </div>
      </section>
    </div>
  );
}
