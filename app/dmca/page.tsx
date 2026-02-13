import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/dmca',
  },
  title: 'DMCA Policy | Elevate For Humanity',
  description:
    'Digital Millennium Copyright Act (DMCA) policy and copyright infringement notification procedures.',
};

export default async function DMCAPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch DMCA policy
  const { data: policy } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('type', 'dmca')
    .single();
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Dmca" }]} />
      </div>
{/* Hero Section - Clean, No Image */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">DMCA Policy</h1>
          <p className="text-base md:text-lg text-slate-300">
            Copyright Infringement Notification
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
              Copyright Policy
            </h2>
            <p className="text-black mb-6">
              Elevate For Humanity respects the intellectual property rights of
              others and expects our users to do the same. We respond to notices
              of alleged copyright infringement that comply with the Digital
              Millennium Copyright Act (DMCA).
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Filing a DMCA Notice
            </h2>
            <p className="text-black mb-4">
              If you believe that content on our website infringes your
              copyright, please send a written notice that includes:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-3">
              <li>
                <strong>Your contact information:</strong> Name, address, phone
                number, and email address
              </li>
              <li>
                <strong>Identification of the copyrighted work:</strong>{' '}
                Description of the work you claim has been infringed
              </li>
              <li>
                <strong>Location of infringing material:</strong> URL or
                specific location on our website where the material is located
              </li>
              <li>
                <strong>Good faith statement:</strong> A statement that you have
                a good faith belief that the use is not authorized by the
                copyright owner
              </li>
              <li>
                <strong>Accuracy statement:</strong> A statement that the
                information in your notice is accurate
              </li>
              <li>
                <strong>Authority statement:</strong> A statement, under penalty
                of perjury, that you are authorized to act on behalf of the
                copyright owner
              </li>
              <li>
                <strong>Physical or electronic signature:</strong> Your
                signature (physical or electronic)
              </li>
            </ol>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Where to Send Notices
            </h2>
            <p className="text-black mb-4">
              Send DMCA notices to our designated Copyright Agent:
            </p>
            <div className="bg-slate-50 p-6 rounded-lg mb-8">
              <p className="text-black mb-2">
                <strong>Copyright Agent</strong>
              </p>
              <p className="text-black mb-2">Elevate For Humanity</p>
              <p className="text-black mb-2">
                Email:{' '}
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="text-brand-blue-600 hover:underline"
                >
                  elevate4humanityedu@gmail.com
                </a>
              </p>
              <p className="text-black">
                Phone:{' '}
                <a
                  href="/support"
                  className="text-brand-blue-600 hover:underline"
                >
                  support center
                </a>
              </p>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Counter-Notification
            </h2>
            <p className="text-black mb-4">
              If you believe that content you posted was removed in error, you
              may file a counter-notification that includes:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-3">
              <li>Your contact information (name, address, phone, email)</li>
              <li>Identification of the material that was removed</li>
              <li>
                A statement under penalty of perjury that you have a good faith
                belief the material was removed by mistake
              </li>
              <li>
                Your consent to jurisdiction of the federal court in your
                district
              </li>
              <li>Your physical or electronic signature</li>
            </ol>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Response Process
            </h2>
            <p className="text-black mb-4">
              When we receive a valid DMCA notice:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>We will promptly investigate the claim</li>
              <li>
                Remove or disable access to the allegedly infringing material
              </li>
              <li>Notify the user who posted the content</li>
              <li>Take appropriate action based on our findings</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Repeat Infringers
            </h2>
            <p className="text-black mb-6">
              We will terminate the accounts of users who are repeat copyright
              infringers in appropriate circumstances.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              False Claims
            </h2>
            <p className="text-black mb-6">
              Please note that under Section 512(f) of the DMCA, anyone who
              knowingly materially misrepresents that material is infringing may
              be subject to liability for damages. Do not make false claims.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Educational Use
            </h2>
            <p className="text-black mb-6">
              As an educational institution, some content on our website may be
              used under fair use provisions of copyright law. We use
              copyrighted materials for educational purposes, commentary, and
              criticism where appropriate.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Questions
            </h2>
            <p className="text-black mb-4">
              If you have questions about this DMCA policy or copyright issues:
            </p>
            <div className="bg-slate-50 p-6 rounded-lg mb-8">
              <p className="text-black mb-2">
                Email:{' '}
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="text-brand-blue-600 hover:underline"
                >
                  elevate4humanityedu@gmail.com
                </a>
              </p>
              <p className="text-black">
                Phone:{' '}
                <a
                  href="/support"
                  className="text-brand-blue-600 hover:underline"
                >
                  support center
                </a>
              </p>
            </div>

            <p className="text-black text-sm mb-8 italic">
              Last Updated: December 8, 2024
            </p>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-black mb-4">
                <strong>Related Policies:</strong>
              </p>
              <div className="space-y-2">
                <Link
                  href="/terms"
                  className="block text-brand-blue-600 hover:underline font-semibold"
                >
                  Terms of Service →
                </Link>
                <Link
                  href="/privacy"
                  className="block text-brand-blue-600 hover:underline font-semibold"
                >
                  Privacy Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
