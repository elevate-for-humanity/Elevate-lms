
import Image from 'next/image';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Building2, Handshake, Heart, GraduationCap, FileText, Mail, MapPin, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Legal & Entity Information | Elevate for Humanity',
  description: 'Corporate structure, entity relationships, and governance documents for Elevate for Humanity Career & Technical Institute.',
};

export default function LegalGovernancePage() {

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Governance', href: '/admin/governance' }, { label: 'Legal & Entity Information' }]} />
        </div>
      </div>

      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/admin/governance"
            className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Governance
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Legal &amp; Entity Information</h1>
          <p className="text-slate-300">
            Corporate structure, partner relationships, and governance documents.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Operator / School */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Operator / School</h2>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Legal Name</p>
                <p className="font-semibold text-slate-900">2Exclusive LLC-S</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Trade Name (DBA)</p>
                <p className="font-semibold text-slate-900">Elevate for Humanity Career &amp; Technical Institute</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Entity Type</p>
                <p className="font-semibold text-slate-900">Limited Liability Company</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">State of Registration</p>
                <p className="font-semibold text-slate-900">Indiana</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm pt-2 border-t border-slate-200">
              Elevate for Humanity Career &amp; Technical Institute (&ldquo;Elevate for Humanity&rdquo;) is operated
              by 2Exclusive LLC-S (the &ldquo;School,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). The School runs
              the institute, the website at elevateforhumanity.org, the learning management system,
              enrollment and credentialing systems, student contracts, and all associated workforce
              training programs.
            </p>
            <p className="text-slate-700 text-sm">
              2Exclusive LLC-S also operates SupersonicFastCash (a separate DBA) for tax preparation
              services. Tax preparation services are governed by separate terms and security documentation.
            </p>
          </div>
        </section>

        {/* Nonprofit Partner */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Handshake className="w-5 h-5 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Nonprofit Partner</h2>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Legal Name</p>
                <p className="font-semibold text-slate-900">Selfish Inc.</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Trade Name (DBA)</p>
                <p className="font-semibold text-slate-900">Rise Forward Foundation</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Entity Type</p>
                <p className="font-semibold text-slate-900">501(c)(3) Nonprofit</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm pt-2 border-t border-slate-200">
              We partner with Selfish Inc. (d/b/a Rise Forward Foundation), a 501(c)(3) nonprofit
              (&ldquo;Rise Forward&rdquo;), to provide supportive services that help students persist
              and complete training. Rise Forward coordinates community outreach, employer partnerships,
              and wrap-around student support.
            </p>
          </div>
        </section>

        {/* Mental Wellness Program */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Mental Wellness Program</h2>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Program Name</p>
                <p className="font-semibold text-slate-900">CurvatureBody Sculpting</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Operated By</p>
                <p className="font-semibold text-slate-900">Rise Forward Foundation</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm pt-2 border-t border-slate-200">
              CurvatureBody Sculpting is a mental wellness program operated by Rise Forward Foundation.
              It is not a separate contracting entity. CurvatureBody provides wellness support services
              to students enrolled in Elevate for Humanity training programs.
            </p>
          </div>
        </section>

        {/* Training Partner */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-amber-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Training Partner</h2>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Partner Name</p>
                <p className="font-semibold text-slate-900">Choice Medical CNA School</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <p className="font-semibold text-slate-900">Training Partner</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm pt-2 border-t border-slate-200">
              Certain training programs may be delivered in collaboration with third-party training
              partners such as Choice Medical CNA School. Where a third-party partner delivers
              instruction or clinical components, this will be disclosed at or before enrollment.
            </p>
          </div>
        </section>

        {/* Relationship & Responsibility */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Relationship &amp; Responsibility
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-slate-700 text-sm">
              Unless a specific written agreement states otherwise, training enrollment, platform access,
              and website use are provided by 2Exclusive LLC-S. Rise Forward Foundation and training
              partners do not control the Elevate for Humanity website or student contracts except
              where explicitly stated.
            </p>
          </div>
        </section>

        {/* Brand Use */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Brand &amp; Trade Name Usage
          </h2>
          <div className="bg-slate-50 rounded-xl p-6">
            <ul className="space-y-2 text-slate-700 text-sm">
              <li>&ldquo;Elevate for Humanity Career &amp; Technical Institute&rdquo; is a trade name (DBA) of 2Exclusive LLC-S.</li>
              <li>&ldquo;Rise Forward Foundation&rdquo; is a trade name of Selfish Inc.</li>
              <li>&ldquo;CurvatureBody Sculpting&rdquo; is a program of Rise Forward Foundation (not a separate entity).</li>
              <li>&ldquo;SupersonicFastCash&rdquo; is a trade name of 2Exclusive LLC-S, used exclusively for tax preparation services.</li>
            </ul>
          </div>
        </section>

        {/* Partner Roles Table */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Partner Roles
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-900 border-b">Entity</th>
                  <th className="text-left p-3 font-semibold text-slate-900 border-b">Role</th>
                  <th className="text-left p-3 font-semibold text-slate-900 border-b">Data Shared</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 text-slate-900 font-medium">2Exclusive LLC-S</td>
                  <td className="p-3 text-slate-700">Operator / School &mdash; enrollment, contracts, platform, credentialing</td>
                  <td className="p-3 text-slate-700">All student data (controller)</td>
                </tr>
                <tr className="border-b bg-slate-50">
                  <td className="p-3 text-slate-900 font-medium">Rise Forward Foundation</td>
                  <td className="p-3 text-slate-700">Nonprofit partner &mdash; supportive services, outreach, employer partnerships</td>
                  <td className="p-3 text-slate-700">Enrollment status, eligibility, support needs (minimum necessary)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 text-slate-900 font-medium">CurvatureBody Sculpting</td>
                  <td className="p-3 text-slate-700">Mental wellness program (under Rise Forward)</td>
                  <td className="p-3 text-slate-700">Participation status only (no PII beyond name)</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-900 font-medium">Choice Medical CNA School</td>
                  <td className="p-3 text-slate-700">Training partner &mdash; instruction, clinical placements</td>
                  <td className="p-3 text-slate-700">Name, enrollment, attendance, clinical records (per enrollment agreement)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Contact
          </h2>
          <div className="bg-slate-50 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">General Inquiries</p>
                <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Legal &amp; Privacy</p>
                <a href="mailto:legal@elevateforhumanity.org" className="text-brand-blue-600 hover:underline">legal@elevateforhumanity.org</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="text-slate-900">(317) 314-3757</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Mailing Address</p>
                <p className="text-slate-900">Indianapolis, IN 46240</p>
              </div>
            </div>
          </div>
        </section>

        {/* Governance Documents */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Governance Documents</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Terms of Service', href: '/terms-of-service', desc: 'User agreement for platform access and services' },
              { title: 'Privacy Policy', href: '/privacy-policy', desc: 'Data collection, use, sharing, and your rights' },
              { title: 'Security & Data Protection', href: '/admin/governance/security', desc: 'How we protect personal and educational data' },
              { title: 'Accessibility', href: '/accessibility', desc: 'WCAG 2.1 AA compliance and accommodations' },
              { title: 'Outcomes Methodology', href: '/outcomes', desc: 'How we measure and report student outcomes' },
              { title: 'Governance Overview', href: '/admin/governance', desc: 'Full documentation index' },
            ].map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="block bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <p className="font-semibold text-slate-900 mb-1">{doc.title}</p>
                <p className="text-sm text-slate-600">{doc.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
