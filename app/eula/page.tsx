import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'End User License Agreement | Elevate for Humanity',
  description: 'End User License Agreement (EULA) for the Elevate for Humanity platform and licensed software.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/eula' },
};

export default function EULAPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'EULA' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">End User License Agreement</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: February 2025</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Agreement</h2>
            <p className="text-slate-700">This End User License Agreement (&quot;EULA&quot;) is a legal agreement between you and Elevate for Humanity (&quot;Licensor&quot;) for the use of the Elevate platform, including the learning management system, enrollment tools, compliance modules, and all related software (&quot;Software&quot;). By installing, accessing, or using the Software, you agree to be bound by the terms of this EULA.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. License Grant</h2>
            <p className="text-slate-700">Subject to the terms of this EULA and your applicable license agreement, Licensor grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Software for your organization&apos;s workforce training and education purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Restrictions</h2>
            <p className="text-slate-700">You may not:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Copy, modify, or create derivative works of the Software</li>
              <li>Reverse engineer, decompile, or disassemble the Software</li>
              <li>Sublicense, rent, lease, or lend the Software to third parties</li>
              <li>Remove or alter any proprietary notices or labels</li>
              <li>Use the Software to build a competing product or service</li>
              <li>Exceed the user limits specified in your license agreement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Ownership</h2>
            <p className="text-slate-700">The Software and all copies thereof are proprietary to Licensor and title thereto remains in Licensor. The Software is protected by copyright and other intellectual property laws. Your data remains your property; Licensor claims no ownership of student records, enrollment data, or content you create within the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Handling</h2>
            <p className="text-slate-700">Student data is handled in compliance with FERPA, WIOA reporting requirements, and applicable state and federal privacy laws. See our <Link href="/privacy-policy" className="text-brand-red-600 hover:underline">Privacy Policy</Link> for details.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Termination</h2>
            <p className="text-slate-700">This EULA is effective until terminated. Licensor may terminate this EULA if you fail to comply with any term. Upon termination, you must cease all use of the Software. Data export will be available for 30 days following termination.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-slate-700">THE SOFTWARE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND. LICENSOR DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Limitation of Liability</h2>
            <p className="text-slate-700">IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Governing Law</h2>
            <p className="text-slate-700">This EULA is governed by the laws of the State of Indiana. Any disputes shall be resolved in the courts of Marion County, Indiana.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
            <p className="text-slate-700">For questions about this EULA, contact us at legal@elevateforhumanity.org or visit our <Link href="/support" className="text-brand-red-600 hover:underline">support page</Link>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
